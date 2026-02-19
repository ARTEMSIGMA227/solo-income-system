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

  if (!membership || !['leader', 'officer'].includes(membership.role)) {
    return NextResponse.json({ error: 'Нет прав' }, { status: 403 });
  }

  const { data: requests } = await supabase
    .from('guild_join_requests')
    .select('*')
    .eq('guild_id', membership.guild_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  return NextResponse.json(requests ?? []);
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

  const { data: membership } = await supabase
    .from('guild_members')
    .select('guild_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership || !['leader', 'officer'].includes(membership.role)) {
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

      return NextResponse.json({ error: 'Пользователь уже состоит в гильдии' }, { status: 400 });
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

  await supabase
    .from('guild_join_requests')
    .update({
      status: action === 'accept' ? 'accepted' : 'rejected',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', request_id);

  return NextResponse.json({ success: true });
}