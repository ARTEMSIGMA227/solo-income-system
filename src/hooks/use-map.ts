'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  TERRITORIES,
  getTerritoryById,
  type TerritoryStatus,
} from '@/lib/map-data';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';

export interface TerritoryProgress {
  id: string;
  user_id: string;
  territory_id: string;
  current_xp: number;
  required_xp: number;
  status: TerritoryStatus;
  level: number;
  captured_at: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileMapData {
  id: string;
  level: number;
  active_territory_id: string | null;
  streak_current: number;
}

interface SkillRow {
  skill_id: string;
  level: number;
}

// Extract branch from skill_id: "comm_persuasion" -> "communication"
function getBranchFromSkillId(skillId: string): string {
  const prefix = skillId.split('_')[0];
  const branchMap: Record<string, string> = {
    comm: 'communication',
    int: 'intellect',
    disc: 'discipline',
    prec: 'precision',
    will: 'willpower',
    def: 'defense',
  };
  return branchMap[prefix] ?? prefix;
}

async function fetchMapData() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [progressRes, profileRes, statsRes] = await Promise.all([
    supabase.from('territory_progress').select('*').eq('user_id', user.id),
    supabase
      .from('profiles')
      .select('id, active_territory_id, streak_current')
      .eq('id', user.id)
      .single(),
    supabase
      .from('stats')
      .select('level')
      .eq('user_id', user.id)
      .single(),
  ]);

  if (profileRes.error) throw profileRes.error;

  // Fetch skill_allocations safely — table may not exist yet
  let skillsData: SkillRow[] = [];
  try {
    const skillsRes = await supabase
      .from('skill_allocations')
      .select('skill_id, level')
      .eq('user_id', user.id)
      .gt('level', 0);

    if (!skillsRes.error && skillsRes.data) {
      skillsData = skillsRes.data as SkillRow[];
    }
  } catch {
    // Table doesn't exist or query failed — silently continue with empty skills
  }

  const profile: ProfileMapData = {
    id: profileRes.data.id as string,
    level: (statsRes.data?.level as number) ?? 1,
    active_territory_id:
      (profileRes.data.active_territory_id as string | null) ?? null,
    streak_current: (profileRes.data.streak_current as number) ?? 0,
  };

  return {
    progress: (progressRes.data ?? []) as TerritoryProgress[],
    profile,
    skills: skillsData,
  };
}

function evaluateRequirements(
  territoryId: string,
  capturedIds: Set<string>,
  profile: ProfileMapData,
  skillsByBranch: Map<string, number>,
): boolean {
  const territory = getTerritoryById(territoryId);
  if (!territory) return false;

  return territory.requirements.every((req) => {
    switch (req.type) {
      case 'level':
        return profile.level >= (req.value as number);
      case 'territory':
        return capturedIds.has(req.value as string);
      case 'streak':
        return profile.streak_current >= (req.value as number);
      case 'skill_branch': {
        const count = skillsByBranch.get(req.value as string) ?? 0;
        return count >= 1;
      }
      default:
        return false;
    }
  });
}

export function useMap() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { t } = useT();

  const query = useQuery({
    queryKey: ['map-data'],
    queryFn: fetchMapData,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('400')) return false;
      return failureCount < 2;
    },
  });

  const capturedIds = new Set(
    (query.data?.progress ?? [])
      .filter((p) => p.status === 'captured')
      .map((p) => p.territory_id),
  );

  const skillsByBranch = new Map<string, number>();
  (query.data?.skills ?? []).forEach((s) => {
    const branch = getBranchFromSkillId(s.skill_id);
    const current = skillsByBranch.get(branch) ?? 0;
    skillsByBranch.set(branch, current + 1);
  });

  function getStatus(territoryId: string): TerritoryStatus {
    const progress = query.data?.progress.find(
      (p) => p.territory_id === territoryId,
    );
    if (progress) return progress.status;

    if (!query.data?.profile) return 'locked';

    const territory = getTerritoryById(territoryId);
    if (!territory) return 'locked';

    if (territory.requirements.length === 0) return 'available';

    const met = evaluateRequirements(
      territoryId,
      capturedIds,
      query.data.profile,
      skillsByBranch,
    );
    if (met) return 'available';

    const anyPrereqCaptured = territory.requirements.some(
      (r) => r.type === 'territory' && capturedIds.has(r.value as string),
    );
    if (anyPrereqCaptured) return 'foggy';

    return 'locked';
  }

  function getProgress(territoryId: string): TerritoryProgress | undefined {
    return query.data?.progress.find((p) => p.territory_id === territoryId);
  }

  const activateTerritory = useMutation({
    mutationFn: async (territoryId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const territory = getTerritoryById(territoryId);
      if (!territory) throw new Error('Territory not found');

      const status = getStatus(territoryId);
      if (status !== 'available' && status !== 'in_progress') {
        throw new Error('Territory not available');
      }

      const existing = query.data?.progress.find(
        (p) => p.territory_id === territoryId,
      );

      if (!existing) {
        const { error: insertError } = await supabase
          .from('territory_progress')
          .insert({
            user_id: user.id,
            territory_id: territoryId,
            current_xp: 0,
            required_xp: territory.requiredXP,
            status: 'in_progress' as const,
            level: 0,
            activated_at: new Date().toISOString(),
          });
        if (insertError) throw insertError;
      } else if (existing.status === 'available') {
        const { error: updateError } = await supabase
          .from('territory_progress')
          .update({
            status: 'in_progress' as const,
            activated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (updateError) throw updateError;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ active_territory_id: territoryId })
        .eq('id', user.id);
      if (profileError) throw profileError;

      return territoryId;
    },
    onSuccess: (territoryId) => {
      const territory = getTerritoryById(territoryId);
      const territoryName = territory
        ? t.map.territories_names[
            territory.nameKey as keyof typeof t.map.territories_names
          ] || territory.nameKey
        : '';
      toast.success(`${territory?.icon} ${territoryName} — ${t.map.active}`, {
        description: t.map.xpTip,
      });
      void queryClient.invalidateQueries({ queryKey: ['map-data'] });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err: Error) => {
      toast.error(t.map.errorLoading, { description: err.message });
    },
  });

  const activeTerritory = query.data?.profile.active_territory_id
    ? getTerritoryById(query.data.profile.active_territory_id)
    : null;

  const activeProgress = query.data?.profile.active_territory_id
    ? getProgress(query.data.profile.active_territory_id)
    : undefined;

  const capturedCount = capturedIds.size;
  const totalCount = TERRITORIES.length;

  return {
    territories: TERRITORIES,
    progress: query.data?.progress ?? [],
    profile: query.data?.profile ?? null,
    isLoading: query.isLoading,
    error: query.error,

    getStatus,
    getProgress,
    capturedIds,

    activeTerritory,
    activeProgress,
    activateTerritory,

    capturedCount,
    totalCount,
  };
}