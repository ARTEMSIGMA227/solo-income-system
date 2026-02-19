import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('*, guilds!inner(leader_id)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Вы не состоите в гильдии' }, { status: 400 });
  }

  if (membership.role === 'leader') {
    const guildId = membership.guild_id;

    await supabase.from('guild_members').delete().eq('guild_id', guildId);
    await supabase.from('guild_messages').delete().eq('guild_id', guildId);

    const { data: quests } = await supabase
      .from('guild_quests')
      .select('id')
      .eq('guild_id', guildId);
    if (quests && quests.length > 0) {
      const questIds = quests.map((q) => q.id);
      await supabase.from('guild_quest_contributions').delete().in('quest_id', questIds);
    }
    await supabase.from('guild_quests').delete().eq('guild_id', guildId);
    await supabase.from('guild_join_requests').delete().eq('guild_id', guildId);
    await supabase.from('guilds').delete().eq('id', guildId);

    return NextResponse.json({ success: true, guild_disbanded: true });
  }

  const { error } = await supabase
    .from('guild_members')
    .delete()
    .eq('user_id', user.id)
    .eq('guild_id', membership.guild_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}