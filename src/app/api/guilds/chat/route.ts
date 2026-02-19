import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('guild_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Вы не в гильдии' }, { status: 400 });
  }

  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '50');

  const { data: messages } = await supabase
    .from('guild_messages')
    .select('*')
    .eq('guild_id', membership.guild_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!messages || messages.length === 0) {
    return NextResponse.json([]);
  }

  // Получаем уникальные user_id
  const userIds = [...new Set(messages.map((m) => m.user_id))];

  // Пробуем получить профили
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .in('id', userIds);

  // Также получаем данные из auth через email (fallback)
  const profileMap: Record<string, string> = {};

  if (profiles && profiles.length > 0) {
    profiles.forEach((p) => {
      const name = p.display_name || p.email || null;
      if (name) {
        profileMap[p.id] = name;
      }
    });
  }

  // Если профиля нет — пробуем достать email текущего пользователя
  if (user.email && !profileMap[user.id]) {
    profileMap[user.id] = user.email;
  }

  const messagesWithNames = messages.reverse().map((m) => ({
    ...m,
    display_name: profileMap[m.user_id] ?? `Охотник #${m.user_id.slice(0, 4)}`,
  }));

  return NextResponse.json(messagesWithNames);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('guild_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Вы не в гильдии' }, { status: 400 });
  }

  const { content } = await request.json() as { content: string };

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Сообщение не может быть пустым' }, { status: 400 });
  }

  if (content.trim().length > 500) {
    return NextResponse.json({ error: 'Максимум 500 символов' }, { status: 400 });
  }

  const { data: message, error } = await supabase
    .from('guild_messages')
    .insert({
      guild_id: membership.guild_id,
      user_id: user.id,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Возвращаем сообщение с именем
  const displayName = user.user_metadata?.display_name
    ?? user.email
    ?? `Охотник #${user.id.slice(0, 4)}`;

  return NextResponse.json({
    ...message,
    display_name: displayName,
  });
}