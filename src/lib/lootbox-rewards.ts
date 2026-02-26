import { SupabaseClient } from '@supabase/supabase-js';

export async function grantLootbox(
  supabase: SupabaseClient,
  userId: string,
  boxType: 'common' | 'rare' | 'epic' | 'legendary',
  source: 'level_up' | 'quest' | 'streak' | 'boss' | 'shop',
  sourceDetail?: string
) {
  const { data, error } = await supabase
    .from('lootboxes')
    .insert({
      user_id: userId,
      box_type: boxType,
      source,
      source_detail: sourceDetail || null,
    })
    .select()
    .single();
  return { data, error };
}

export function getLootboxTypeForLevel(
  level: number
): 'common' | 'rare' | 'epic' | 'legendary' {
  if (level >= 50) return 'legendary';
  if (level >= 25) return 'epic';
  if (level >= 10) return 'rare';
  return 'common';
}

export function getLootboxTypeForStreak(
  streak: number
): 'common' | 'rare' | 'epic' | 'legendary' | null {
  if (streak === 100) return 'legendary';
  if (streak === 30) return 'rare';
  if (streak === 7) return 'common';
  return null;
}