import { createClient } from '@/lib/supabase/client';
import { getTerritoryById, calculateTerritoryXPForLevel } from './map-data';
import type { TerritoryStatus } from './map-data';

export interface TerritoryXPResult {
  territoryId: string;
  xpAdded: number;
  newLevel: number;
  captured: boolean;
  territoryName: string;
  territoryIcon: string;
}

export async function addXPToActiveTerritory(
  userId: string,
  baseXP: number
): Promise<TerritoryXPResult | null> {
  const supabase = createClient();
  const territoryXP = Math.floor(baseXP * 0.2);

  if (territoryXP <= 0) return null;

  const { data: profileData } = await supabase
    .from('profiles')
    .select('active_territory_id')
    .eq('id', userId)
    .single();

  const activeTerritoryId = profileData?.active_territory_id as string | null;
  if (!activeTerritoryId) return null;

  const territory = getTerritoryById(activeTerritoryId);
  if (!territory) return null;

  const { data: progress } = await supabase
    .from('territory_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('territory_id', activeTerritoryId)
    .eq('status', 'in_progress')
    .single();

  if (!progress) return null;

  const prevXP = progress.current_xp as number;
  const prevLevel = progress.level as number;
  const newXPTotal = prevXP + territoryXP;
  const levelRequired = calculateTerritoryXPForLevel(territory.requiredXP, prevLevel);

  let newLevel = prevLevel;
  let newCurrentXP = newXPTotal;
  let newStatus: TerritoryStatus = 'in_progress';
  let captured = false;

  if (newXPTotal >= levelRequired) {
    newLevel = prevLevel + 1;
    newCurrentXP = newXPTotal - levelRequired;

    if (newLevel >= territory.maxLevel) {
      newStatus = 'captured';
      newLevel = territory.maxLevel;
      newCurrentXP = 0;
      captured = true;
    }
  }

  const updateData: Record<string, unknown> = {
    current_xp: newCurrentXP,
    level: newLevel,
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (captured) {
    updateData.captured_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('territory_progress')
    .update(updateData)
    .eq('id', progress.id as string);

  if (error) {
    console.error('Territory XP update error:', error);
    return null;
  }

  if (captured) {
    await supabase
      .from('profiles')
      .update({ active_territory_id: null })
      .eq('id', userId);
  }

  return {
    territoryId: activeTerritoryId,
    xpAdded: territoryXP,
    newLevel,
    captured,
    territoryName: territory.name,
    territoryIcon: territory.icon,
  };
}