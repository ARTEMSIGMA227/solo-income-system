import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ guild: null, membership: null });
  }

  const { data: guild } = await supabase
    .from('guilds')
    .select('*')
    .eq('id', membership.guild_id)
    .single();

  if (!guild) {
    return NextResponse.json({ guild: null, membership: null });
  }

  const { data: members } = await supabase
    .from('guild_members')
    .select('*')
    .eq('guild_id', guild.id)
    .order('xp_contributed', { ascending: false });

  const memberUserIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .in('id', memberUserIds);

  const profileMap: Record<string, { display_name?: string; email?: string }> = {};
  (profiles ?? []).forEach((p) => {
    profileMap[p.id] = { display_name: p.display_name, email: p.email };
  });

  const membersWithProfiles = (members ?? []).map((m) => ({
    ...m,
    display_name: profileMap[m.user_id]?.display_name ?? profileMap[m.user_id]?.email ?? 'Охотник',
  }));

  return NextResponse.json({
    guild: {
      ...guild,
      member_count: members?.length ?? 0,
      members: membersWithProfiles,
    },
    membership,
  });
}