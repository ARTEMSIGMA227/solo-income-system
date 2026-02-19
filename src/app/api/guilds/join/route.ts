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

  // Проверяем, не состоит ли уже в гильдии
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

  // Находим гильдию
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

  // Проверяем количество участников
  const { count } = await supabase
    .from('guild_members')
    .select('id', { count: 'exact', head: true })
    .eq('guild_id', guild.id);

  if ((count ?? 0) >= guild.max_members) {
    return NextResponse.json({ error: 'Гильдия заполнена' }, { status: 400 });
  }

  // Публичная гильдия — вступаем сразу
  if (guild.is_public) {
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

  // Приватная гильдия — ВСЕГДА заявка (даже с инвайт-кодом)
  // Проверяем нет ли уже заявки
  const { data: existingRequest } = await supabase
    .from('guild_join_requests')
    .select('id, status')
    .eq('guild_id', guild.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      return NextResponse.json({ error: 'Заявка уже подана и ожидает рассмотрения' }, { status: 400 });
    }
    // Если была отклонена — удаляем старую и создаём новую
    await supabase
      .from('guild_join_requests')
      .delete()
      .eq('id', existingRequest.id);
  }

  const { error: requestError } = await supabase
    .from('guild_join_requests')
    .insert({
      guild_id: guild.id,
      user_id: user.id,
      message: invite_code ? `Вступает по коду: ${invite_code}` : null,
    });

  if (requestError) {
    return NextResponse.json({ error: requestError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, joined: false, request_sent: true });
}