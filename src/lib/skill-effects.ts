import type { SkillEffectType } from './skill-tree';

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

  // xp_bonus_percent — general XP boost for actions/tasks
  const xpPct = effects.xp_bonus_percent || 0;
  if (xpPct > 0) {
    xpMult += xpPct / 100;
    bonusParts.push(`+${xpPct}% XP`);
  }

  // xp_multiplier_actions — extra for hard_task
  const hardMult = effects.xp_multiplier_actions || 0;
  if (ctx.actionType === 'hard_task' && hardMult > 0) {
    xpMult += hardMult / 100;
    bonusParts.push(`+${hardMult}% сложная`);
  }

  // gold_bonus_percent — extra gold for sales
  const goldPct = effects.gold_bonus_percent || 0;
  if (ctx.actionType === 'sale' && goldPct > 0) {
    goldMult += goldPct / 100;
    bonusParts.push(`+${goldPct}% 🪙 продажа`);
  }

  // xp_bonus_flat — flat XP per streak day (capped)
  const flatPerStreak = effects.xp_bonus_flat || 0;
  if (flatPerStreak > 0 && ctx.streak > 0) {
    const bonus = Math.min(flatPerStreak * ctx.streak, 150);
    flatXP += bonus;
    bonusParts.push(`+${bonus} XP серия`);
  }

  // gold_bonus_flat — flat gold when completing daily target
  const flatGoldBonus = effects.gold_bonus_flat || 0;
  if (flatGoldBonus > 0 && ctx.todayActions + 1 >= ctx.dailyTarget) {
    flatGold += flatGoldBonus;
    bonusParts.push(`+${flatGoldBonus} 🪙 план`);
  }

  // Apply multipliers
  let finalXP = Math.round(baseXP * xpMult + flatXP);
  const finalGold = Math.round(baseGold * goldMult + flatGold);

  // Crit chance
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