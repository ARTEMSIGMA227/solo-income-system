import type { SkillEffectType } from './skill-tree';
import { calculateEffects } from './skill-tree';
import { createClient } from '@/lib/supabase/client';

export interface SkillContext {
  actionType: 'action' | 'task' | 'hard_task' | 'sale';
  hour: number;
  todayActions: number;
  streak: number;
  dailyTarget: number;
}

export interface SkillResult {
  finalXP: number;
  finalGold: number;
  isCrit: boolean;
  xpMultiplier: number;
  goldMultiplier: number;
  bonusParts: string[];
}

export function applySkillEffects(
  baseXP: number,
  baseGold: number,
  effects: Partial<Record<SkillEffectType, number>>,
  ctx: SkillContext
): SkillResult {
  let xpMult = 1;
  let goldMult = 1;
  let flatXP = 0;
  let flatGold = 0;
  const bonusParts: string[] = [];

  const xpPct = effects.xp_bonus_percent || 0;
  if (xpPct > 0) {
    xpMult += xpPct / 100;
    bonusParts.push(`+${xpPct}% XP`);
  }

  const hardMult = effects.xp_multiplier_actions || 0;
  if (ctx.actionType === 'hard_task' && hardMult > 0) {
    xpMult += hardMult / 100;
    bonusParts.push(`+${hardMult}% сложная`);
  }

  const goldPct = effects.gold_bonus_percent || 0;
  if (ctx.actionType === 'sale' && goldPct > 0) {
    goldMult += goldPct / 100;
    bonusParts.push(`+${goldPct}% 🪙 продажа`);
  }

  const flatPerStreak = effects.xp_bonus_flat || 0;
  if (flatPerStreak > 0 && ctx.streak > 0) {
    const bonus = Math.min(flatPerStreak * ctx.streak, 150);
    flatXP += bonus;
    bonusParts.push(`+${bonus} XP серия`);
  }

  const flatGoldBonus = effects.gold_bonus_flat || 0;
  if (flatGoldBonus > 0 && ctx.todayActions + 1 >= ctx.dailyTarget) {
    flatGold += flatGoldBonus;
    bonusParts.push(`+${flatGoldBonus} 🪙 план`);
  }

  let finalXP = Math.round(baseXP * xpMult + flatXP);
  const finalGold = Math.round(baseGold * goldMult + flatGold);

  let isCrit = false;
  const critChance = effects.crit_chance_percent || 0;
  if (critChance > 0 && Math.random() * 100 < critChance) {
    finalXP *= 2;
    isCrit = true;
    bonusParts.push('⚡ КРИТ x2');
  }

  return {
    finalXP,
    finalGold,
    isCrit,
    xpMultiplier: xpMult,
    goldMultiplier: goldMult,
    bonusParts,
  };
}

export function applyPenaltyReduction(
  basePenalty: number,
  effects: Partial<Record<SkillEffectType, number>>
): number {
  const reduction = effects.penalty_reduction_percent || 0;
  if (reduction <= 0) return basePenalty;
  return Math.max(Math.round(basePenalty * (1 - reduction / 100)), 10);
}

export function applyShopDiscount(
  basePrice: number,
  effects: Partial<Record<SkillEffectType, number>>
): number {
  const discount = effects.shop_discount_percent || 0;
  if (discount <= 0) return basePrice;
  return Math.max(Math.round(basePrice * (1 - discount / 100)), 1);
}

export function applyBossDamageBonus(
  baseDamage: number,
  effects: Partial<Record<SkillEffectType, number>>
): number {
  const bonus = effects.boss_damage_bonus || 0;
  if (bonus <= 0) return baseDamage;
  return Math.round(baseDamage * (1 + bonus / 100));
}

export function getExtraMissionSlots(
  effects: Partial<Record<SkillEffectType, number>>
): number {
  return effects.mission_slot || 0;
}

export function getStreakShieldDays(
  effects: Partial<Record<SkillEffectType, number>>
): number {
  return effects.streak_shield_days || 0;
}

/** Load skill effects directly from DB (for use before hooks are ready) */
export async function loadSkillEffectsFromDB(
  userId: string
): Promise<Partial<Record<SkillEffectType, number>>> {
  const supabase = createClient();
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