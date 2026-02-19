import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('guild_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Вы не в гильдии' }, { status: 403 });
  }

  if (membership.role !== 'leader' && membership.role !== 'officer') {
    return NextResponse.json({ error: 'Нет прав для просмотра заявок' }, { status: 403 });
  }

  const { data: requests, error } = await supabase
    .from('guild_join_requests')
    .select('*')
    .eq('guild_id', membership.guild_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = (requests ?? []).map((r) => r.user_id);

  if (userIds.length === 0) {
    return NextResponse.json([]);
  }

  // Получаем display_name из profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);

  const profileMap: Record<string, string> = {};
  (profiles ?? []).forEach((p) => {
    if (p.display_name) {
      profileMap[p.id] = p.display_name;
    }
  });

  const requestsWithNames = (requests ?? []).map((r) => ({
    ...r,
    display_name: profileMap[r.user_id] ?? `Охотник #${r.user_id.slice(0, 4)}`,
  }));

  return NextResponse.json(requestsWithNames);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { request_id, action } = await request.json() as {
    request_id: string;
    action: 'accept' | 'reject';
  };

  if (!request_id || !action) {
    return NextResponse.json({ error: 'request_id и action обязательны' }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('guild_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership || (membership.role !== 'leader' && membership.role !== 'officer')) {
    return NextResponse.json({ error: 'Нет прав' }, { status: 403 });
  }

  const { data: joinRequest } = await supabase
    .from('guild_join_requests')
    .select('*')
    .eq('id', request_id)
    .eq('guild_id', membership.guild_id)
    .eq('status', 'pending')
    .single();

  if (!joinRequest) {
    return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
  }

  if (action === 'accept') {
    const { data: guild } = await supabase
      .from('guilds')
      .select('max_members')
      .eq('id', membership.guild_id)
      .single();

    const { count } = await supabase
      .from('guild_members')
      .select('id', { count: 'exact', head: true })
      .eq('guild_id', membership.guild_id);

    if (guild && (count ?? 0) >= guild.max_members) {
      return NextResponse.json({ error: 'Гильдия заполнена' }, { status: 400 });
    }

    const { data: existingMember } = await supabase
      .from('guild_members')
      .select('id')
      .eq('user_id', joinRequest.user_id)
      .maybeSingle();

    if (existingMember) {
      await supabase
        .from('guild_join_requests')
        .update({ status: 'rejected', resolved_at: new Date().toISOString() })
        .eq('id', request_id);

      return NextResponse.json({ error: 'Пользователь уже состоит в другой гильдии' }, { status: 400 });
    }

    const { error: joinError } = await supabase
      .from('guild_members')
      .insert({
        guild_id: membership.guild_id,
        user_id: joinRequest.user_id,
        role: 'member',
      });

    if (joinError) {
      return NextResponse.json({ error: joinError.message }, { status: 500 });
    }
  }

  const { error: updateError } = await supabase
    .from('guild_join_requests')
    .update({
      status: action === 'accept' ? 'accepted' : 'rejected',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', request_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, action });
}