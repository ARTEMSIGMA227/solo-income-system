import { xpToNextLevel, getTitleForLevel, PENALTIES, MULTIPLIERS } from './constants';

export interface LevelInfo {
  level: number;
  currentXP: number;
  xpToNext: number;
  progressPercent: number;
  totalXPEarned: number;
  title: string;
  titleKey: string;
  titleIcon: string;
}

export function calculateLevelFromTotalXP(netXP: number): {
  level: number;
  remainingXP: number;
} {
  let level = 1;
  let remaining = Math.max(netXP, 0);
  while (true) {
    const needed = xpToNextLevel(level);
    if (remaining < needed) break;
    remaining -= needed;
    level++;
  }
  return { level, remainingXP: remaining };
}

export function getLevelInfo(totalEarned: number, totalLost: number): LevelInfo {
  const netXP = Math.max(totalEarned - totalLost, 0);
  const { level, remainingXP } = calculateLevelFromTotalXP(netXP);
  const xpToNext = xpToNextLevel(level);
  const progressPercent = Math.round((remainingXP / xpToNext) * 100);
  const titleInfo = getTitleForLevel(level);

  return {
    level,
    currentXP: remainingXP,
    xpToNext,
    progressPercent,
    totalXPEarned: totalEarned,
    title: titleInfo.title,
    titleKey: titleInfo.titleKey,
    titleIcon: titleInfo.icon,
  };
}

export function calculateDayMultiplier(
  actionsCompleted: number,
  actionsTarget: number,
): number {
  const ratio = actionsTarget > 0 ? actionsCompleted / actionsTarget : 0;
  if (ratio >= MULTIPLIERS.overperform_threshold) {
    return MULTIPLIERS.overperform_multiplier;
  }
  return 1.0;
}

export function calculatePenalty(consecutiveMisses: number): {
  xpPenalty: number;
  levelPenalty: number;
} {
  const xpPenalty = Math.abs(PENALTIES.daily_miss);
  const levelPenalty =
    consecutiveMisses >= PENALTIES.consecutive_misses_threshold
      ? PENALTIES.streak_break_levels
      : 0;
  return { xpPenalty, levelPenalty };
}
