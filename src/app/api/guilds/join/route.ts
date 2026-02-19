import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { guild_id, invite_code } = await request.json() as {
    guild_id?: string;
    invite_code?: string;
  };

  const { data: existingMembership } = await supabase
    .from('guild_members')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMembership) {
    return NextResponse.json(
      { error: 'Вы уже состоите в гильдии. Покиньте текущую, чтобы вступить в другую.' },
      { status: 400 }
    );
  }

  let guildQuery = supabase.from('guilds').select('*');

  if (invite_code) {
    guildQuery = guildQuery.eq('invite_code', invite_code);
  } else if (guild_id) {
    guildQuery = guildQuery.eq('id', guild_id);
  } else {
    return NextResponse.json({ error: 'Укажите guild_id или invite_code' }, { status: 400 });
  }

  const { data: guild } = await guildQuery.single();

  if (!guild) {
    return NextResponse.json({ error: 'Гильдия не найдена' }, { status: 404 });
  }

  const { count } = await supabase
    .from('guild_members')
    .select('id', { count: 'exact', head: true })
    .eq('guild_id', guild.id);

  if ((count ?? 0) >= guild.max_members) {
    return NextResponse.json({ error: 'Гильдия заполнена' }, { status: 400 });
  }

  if (guild.is_public || invite_code) {
    const { error: joinError } = await supabase
      .from('guild_members')
      .insert({
        guild_id: guild.id,
        user_id: user.id,
        role: 'member',
      });

    if (joinError) {
      return NextResponse.json({ error: joinError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, joined: true });
  }

  const { error: requestError } = await supabase
    .from('guild_join_requests')
    .insert({
      guild_id: guild.id,
      user_id: user.id,
    });

  if (requestError) {
    if (requestError.code === '23505') {
      return NextResponse.json({ error: 'Заявка уже подана' }, { status: 400 });
    }
    return NextResponse.json({ error: requestError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, joined: false, request_sent: true });
}