import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { member_id, action, role } = await request.json() as {
    member_id: string;
    action: 'kick' | 'promote';
    role?: 'officer' | 'member';
  };

  const { data: myMembership } = await supabase
    .from('guild_members')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!myMembership || myMembership.role !== 'leader') {
    return NextResponse.json({ error: 'Только лидер может управлять участниками' }, { status: 403 });
  }

  const { data: targetMember } = await supabase
    .from('guild_members')
    .select('*')
    .eq('id', member_id)
    .eq('guild_id', myMembership.guild_id)
    .single();

  if (!targetMember) {
    return NextResponse.json({ error: 'Участник не найден' }, { status: 404 });
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

  if (action === 'promote' && role) {
    const { error } = await supabase
      .from('guild_members')
      .update({ role })
      .eq('id', member_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Неверное действие' }, { status: 400 });
}