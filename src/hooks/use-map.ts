'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  TERRITORIES,
  getTerritoryById,
  calculateTerritoryXPForLevel,
  type TerritoryStatus,
} from '@/lib/map-data';
import { toast } from 'sonner';

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

interface SkillAllocationRow {
  skill_id: string;
  allocated_points: number;
  branch_id: string;
}

async function fetchMapData() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Загружаем level из stats, остальное из profiles
  const [progressRes, profileRes, statsRes, skillsRes] = await Promise.all([
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
    supabase
      .from('skill_allocations')
      .select('skill_id, allocated_points, branch_id')
      .eq('user_id', user.id)
      .gt('allocated_points', 0),
  ]);

  if (profileRes.error) throw profileRes.error;

  const profile: ProfileMapData = {
    id: profileRes.data.id as string,
    level: (statsRes.data?.level as number) ?? 1,
    active_territory_id: (profileRes.data.active_territory_id as string | null) ?? null,
    streak_current: (profileRes.data.streak_current as number) ?? 0,
  };

  return {
    progress: (progressRes.data ?? []) as TerritoryProgress[],
    profile,
    skills: (skillsRes.data ?? []) as SkillAllocationRow[],
  };
}

function evaluateRequirements(
  territoryId: string,
  capturedIds: Set<string>,
  profile: ProfileMapData,
  skillsByBranch: Map<string, number>
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

  const query = useQuery({
    queryKey: ['map-data'],
    queryFn: fetchMapData,
    staleTime: 30_000,
  });

  const capturedIds = new Set(
    (query.data?.progress ?? [])
      .filter((p) => p.status === 'captured')
      .map((p) => p.territory_id)
  );

  const skillsByBranch = new Map<string, number>();
  (query.data?.skills ?? []).forEach((s) => {
    const current = skillsByBranch.get(s.branch_id) ?? 0;
    skillsByBranch.set(s.branch_id, current + 1);
  });

  function getStatus(territoryId: string): TerritoryStatus {
    const progress = query.data?.progress.find((p) => p.territory_id === territoryId);
    if (progress) return progress.status;

    if (!query.data?.profile) return 'locked';

    const territory = getTerritoryById(territoryId);
    if (!territory) return 'locked';

    // Стартовая территория без требований — доступна
    if (territory.requirements.length === 0) return 'available';

    const met = evaluateRequirements(
      territoryId,
      capturedIds,
      query.data.profile,
      skillsByBranch
    );
    if (met) return 'available';

    // Если хотя бы один prereq-territory захвачен — видно в тумане
    const anyPrereqCaptured = territory.requirements.some(
      (r) => r.type === 'territory' && capturedIds.has(r.value as string)
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

      const existing = query.data?.progress.find((p) => p.territory_id === territoryId);

      if (!existing) {
        const { error: insertError } = await supabase.from('territory_progress').insert({
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
      toast.success(`${territory?.icon} ${territory?.name} активирована!`, {
        description: 'XP от действий теперь идёт в прогресс этой территории.',
      });
      void queryClient.invalidateQueries({ queryKey: ['map-data'] });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err: Error) => {
      toast.error('Ошибка активации территории', { description: err.message });
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