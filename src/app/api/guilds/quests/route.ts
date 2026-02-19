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
    .select('guild_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Вы не в гильдии' }, { status: 400 });
  }

  const { data: quests } = await supabase
    .from('guild_quests')
    .select('*')
    .eq('guild_id', membership.guild_id)
    .order('created_at', { ascending: false });

  return NextResponse.json(quests ?? []);
}

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: 'Нет прав для создания квестов' }, { status: 403 });
  }

  const body = await request.json() as {
    title: string;
    description?: string;
    target_value: number;
    xp_reward: number;
    gold_reward: number;
    expires_at?: string;
  };

  if (!body.title || body.title.trim().length < 2) {
    return NextResponse.json({ error: 'Название минимум 2 символа' }, { status: 400 });
  }

  const { data: quest, error } = await supabase
    .from('guild_quests')
    .insert({
      guild_id: membership.guild_id,
      title: body.title.trim(),
      description: body.description?.trim() ?? null,
      target_value: body.target_value,
      xp_reward: body.xp_reward,
      gold_reward: body.gold_reward,
      expires_at: body.expires_at ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(quest);
}