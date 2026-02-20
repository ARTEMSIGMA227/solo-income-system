import { calculateEffects } from './skill-tree';
import type { SkillEffectType } from './skill-tree';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function loadSkillEffectsServer(
  supabase: SupabaseClient,
  userId: string
): Promise<Partial<Record<SkillEffectType, number>>> {
  const { data } = await supabase
    .from('skill_allocations')
    .select('skill_id, level')
    .eq('user_id', userId);

  if (!data || data.length === 0) return {};

  const allocated: Record<string, number> = {};
  for (const row of data) {
    allocated[row.skill_id] = row.level;
  }

  return calculateEffects(allocated);
}

export function getExtraMissionSlotsFromEffects(
  effects: Partial<Record<SkillEffectType, number>>
): number {
  return effects.mission_slot || 0;
}