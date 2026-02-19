import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { quest_id, value } = await request.json() as {
    quest_id: string;
    value: number;
  };

  if (!quest_id || !value || value < 1) {
    return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('guild_id, xp_contributed')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Вы не в гильдии' }, { status: 400 });
  }

  const { data: quest } = await supabase
    .from('guild_quests')
    .select('*')
    .eq('id', quest_id)
    .eq('guild_id', membership.guild_id)
    .eq('status', 'active')
    .single();

  if (!quest) {
    return NextResponse.json({ error: 'Квест не найден или не активен' }, { status: 404 });
  }

  const { error: contribError } = await supabase
    .from('guild_quest_contributions')
    .insert({
      quest_id,
      user_id: user.id,
      value,
    });

  if (contribError) {
    return NextResponse.json({ error: contribError.message }, { status: 500 });
  }

  const newValue = Math.min(quest.current_value + value, quest.target_value);
  const isCompleted = newValue >= quest.target_value;

  const { error: updateError } = await supabase
    .from('guild_quests')
    .update({
      current_value: newValue,
      ...(isCompleted ? { status: 'completed' as const, completed_at: new Date().toISOString() } : {}),
    })
    .eq('id', quest_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const newXp = (membership.xp_contributed ?? 0) + value * 10;
  await supabase
    .from('guild_members')
    .update({ xp_contributed: newXp })
    .eq('user_id', user.id)
    .eq('guild_id', membership.guild_id);

  return NextResponse.json({
    success: true,
    completed: isCompleted,
    current_value: newValue,
    target_value: quest.target_value,
  });
}