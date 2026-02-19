import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const member_id = body.member_id as string;
  const action = body.action as string;
  const role = body.role as string | undefined;

  if (!member_id || !action) {
    return NextResponse.json({ error: 'member_id и action обязательны' }, { status: 400 });
  }

  // Проверяем, что текущий пользователь — лидер
  const { data: myMembership } = await supabase
    .from('guild_members')
    .select('guild_id, role, user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!myMembership) {
    return NextResponse.json({ error: 'Вы не состоите в гильдии' }, { status: 403 });
  }

  if (myMembership.role !== 'leader') {
    return NextResponse.json({ error: 'Только лидер может управлять участниками' }, { status: 403 });
  }

  // Находим целевого участника
  const { data: targetMember } = await supabase
    .from('guild_members')
    .select('id, user_id, guild_id, role')
    .eq('id', member_id)
    .single();

  if (!targetMember) {
    return NextResponse.json({ error: 'Участник не найден' }, { status: 404 });
  }

  // Проверяем что в одной гильдии
  if (targetMember.guild_id !== myMembership.guild_id) {
    return NextResponse.json({ error: 'Участник не в вашей гильдии' }, { status: 400 });
  }

  if (targetMember.user_id === user.id) {
    return NextResponse.json({ error: 'Нельзя управлять собой' }, { status: 400 });
  }

  if (action === 'kick') {
    const { error } = await supabase
      .from('guild_members')
      .delete()
      .eq('id', member_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (action === 'promote') {
    const newRole = role ?? 'officer';

    if (newRole !== 'officer' && newRole !== 'member') {
      return NextResponse.json({ error: 'Роль может быть officer или member' }, { status: 400 });
    }

    const { error } = await supabase
      .from('guild_members')
      .update({ role: newRole })
      .eq('id', member_id)
      .eq('guild_id', myMembership.guild_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, new_role: newRole });
  }

  return NextResponse.json({ error: 'Неверное действие. Используйте kick или promote' }, { status: 400 });
}