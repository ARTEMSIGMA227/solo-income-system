import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search');
  const showPublic = searchParams.get('public') === 'true';

  // Получаем гильдию текущего пользователя
  const { data: myMembership } = await supabase
    .from('guild_members')
    .select('guild_id')
    .eq('user_id', user.id)
    .maybeSingle();

  let query = supabase.from('guilds').select('*');

  if (showPublic) {
    // Показываем публичные + свою гильдию (даже если приватная)
    if (myMembership) {
      query = query.or(`is_public.eq.true,id.eq.${myMembership.guild_id}`);
    } else {
      query = query.eq('is_public', true);
    }
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  query = query.order('total_xp', { ascending: false }).limit(50);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const guildIds = (data ?? []).map((g) => g.id);

  if (guildIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: memberCounts } = await supabase
    .from('guild_members')
    .select('guild_id')
    .in('guild_id', guildIds);

  const countMap: Record<string, number> = {};
  (memberCounts ?? []).forEach((m) => {
    countMap[m.guild_id] = (countMap[m.guild_id] ?? 0) + 1;
  });

  const guildsWithCount = (data ?? []).map((g) => ({
    ...g,
    member_count: countMap[g.id] ?? 0,
  }));

  return NextResponse.json(guildsWithCount);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: existingMembership } = await supabase
    .from('guild_members')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMembership) {
    return NextResponse.json(
      { error: 'Вы уже состоите в гильдии. Покиньте текущую гильдию, чтобы создать новую.' },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { name, description, is_public, max_members } = body as {
    name: string;
    description?: string;
    is_public?: boolean;
    max_members?: number;
  };

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: 'Название гильдии должно быть минимум 2 символа' }, { status: 400 });
  }

  if (name.trim().length > 30) {
    return NextResponse.json({ error: 'Название гильдии максимум 30 символов' }, { status: 400 });
  }

  const { data: guild, error: createError } = await supabase
    .from('guilds')
    .insert({
      name: name.trim(),
      description: description?.trim() ?? null,
      leader_id: user.id,
      is_public: is_public ?? true,
      max_members: max_members ?? 20,
    })
    .select()
    .single();

  if (createError) {
    if (createError.code === '23505') {
      return NextResponse.json({ error: 'Гильдия с таким названием уже существует' }, { status: 400 });
    }
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  const { error: memberError } = await supabase
    .from('guild_members')
    .insert({
      guild_id: guild.id,
      user_id: user.id,
      role: 'leader',
    });

  if (memberError) {
    await supabase.from('guilds').delete().eq('id', guild.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json(guild);
}