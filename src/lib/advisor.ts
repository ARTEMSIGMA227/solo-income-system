import type { TranslationDictionary } from './i18n/types';

interface AdviceOutput {
  greeting: string;
  advice: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- accepts any stats/profile shape
type AnyRow = Record<string, any>;

interface AdviceInput {
  stats: AnyRow;
  profile: AnyRow;
  todayActions: number;
  todayIncome: number;
  monthIncome: number;
  hour: number;
  dayOfWeek: number;
  dayOfMonth: number;
  daysInMonth: number;
  t: TranslationDictionary;
}

export function generateAdvice(input: AdviceInput): AdviceOutput {
  const {
    stats,
    profile,
    todayActions,
    todayIncome,
    monthIncome,
    hour,
    dayOfWeek,
    dayOfMonth,
    daysInMonth,
    t,
  } = input;

  const a = t.advisorLib;

  const level = Number(stats.level ?? 1);
  const gold = Number(stats.gold ?? 0);
  const totalActions = Number(stats.total_actions ?? 0);
  const totalSales = Number(stats.total_sales ?? 0);

  const streak = Number(profile.streak_current ?? 0);
  const bestStreak = Number(profile.streak_best ?? 0);
  const target = Number(profile.daily_actions_target ?? 30);
  const monthTarget = Number(profile.monthly_income_target ?? 150000);
  const consecutiveMisses = Number(profile.consecutive_misses ?? 0);

  const advice: string[] = [];

  // --- Greeting ---
  const title = getLevelTitle(level, t);
  const displayName = profile.display_name
    ? String(profile.display_name)
    : title;
  let greeting: string;

  if (hour < 6) greeting = a.greetings.night(displayName);
  else if (hour < 12) greeting = a.greetings.morning(displayName);
  else if (hour < 18) greeting = a.greetings.afternoon(displayName);
  else greeting = a.greetings.evening(displayName);

  // --- Actions progress ---
  const actionsPercent = Math.round((todayActions / target) * 100);

  if (todayActions === 0 && hour >= 10) {
    advice.push(a.advice.noActions);
  } else if (actionsPercent < 30 && hour >= 14) {
    advice.push(a.advice.lowActions(todayActions, target));
  } else if (actionsPercent >= 100) {
    advice.push(a.advice.planDone);
  } else if (actionsPercent >= 70) {
    advice.push(a.advice.almostDone(todayActions, target, target - todayActions));
  }

  // --- Streak ---
  if (streak === 0 && consecutiveMisses > 0) {
    advice.push(a.advice.streakBroken(consecutiveMisses));
  } else if (streak >= 7 && streak === bestStreak) {
    advice.push(a.advice.streakRecord(streak));
  } else if (streak >= 3) {
    advice.push(a.advice.streakGoing(streak, bestStreak, Math.max(bestStreak - streak, 0)));
  }

  if (consecutiveMisses >= 2) {
    advice.push(a.advice.missWarning(consecutiveMisses));
  }

  // --- Income ---
  const monthRemaining = daysInMonth - dayOfMonth;
  const monthPercent = Math.round((monthIncome / monthTarget) * 100);

  if (todayIncome > 0) {
    advice.push(a.advice.todayIncome(formatNum(todayIncome)));
  }

  if (monthPercent >= 100) {
    advice.push(a.advice.monthlyDone);
  } else if (monthPercent < 50 && dayOfMonth > daysInMonth * 0.6) {
    const needed = monthTarget - monthIncome;
    const perDay =
      monthRemaining > 0 ? Math.ceil(needed / monthRemaining) : needed;
    advice.push(a.advice.monthlyBehind(monthPercent, formatNum(perDay)));
  } else if (monthPercent >= 70) {
    advice.push(a.advice.monthlyAlmost(monthPercent, formatNum(monthTarget - monthIncome)));
  }

  // --- Day of week ---
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    advice.push(a.advice.weekend);
  } else if (dayOfWeek === 1) {
    advice.push(a.advice.monday);
  } else if (dayOfWeek === 5) {
    advice.push(a.advice.friday);
  }

  // --- Level-based ---
  if (level <= 5 && totalActions < 50) {
    advice.push(a.advice.lowLevel);
  } else if (level >= 20) {
    advice.push(a.advice.highLevel);
  }

  // --- Gold ---
  if (gold >= 500) {
    advice.push(a.advice.goldTip(gold));
  }

  // --- Conversion rate ---
  if (totalActions > 100 && totalSales > 0) {
    const convRate = ((totalSales / totalActions) * 100).toFixed(1);
    advice.push(a.advice.conversion(convRate, totalSales, totalActions));
  } else if (totalActions > 50 && totalSales === 0) {
    advice.push(a.advice.noConversion);
  }

  // --- Time pressure ---
  if (hour >= 21 && actionsPercent < 100) {
    advice.push(a.advice.timePressure(hour, target - todayActions));
  }

  return {
    greeting,
    advice: advice.slice(0, 4),
  };
}

function getLevelTitle(level: number, t: TranslationDictionary): string {
  const titles = t.advisorLib.levelTitles;
  if (level >= 50) return titles.monarch;
  if (level >= 40) return titles.national;
  if (level >= 30) return titles.sRank;
  if (level >= 20) return titles.aRank;
  if (level >= 15) return titles.bRank;
  if (level >= 10) return titles.cRank;
  if (level >= 5) return titles.dRank;
  return titles.eRank;
}

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return String(n);
}