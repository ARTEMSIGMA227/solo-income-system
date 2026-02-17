import type { Stats, Profile } from '@/types/database';

export interface Advice {
  icon: string;
  title: string;
  message: string;
  priority: 'critical' | 'warning' | 'info' | 'positive';
  action?: string;
  actionRoute?: string;
}

interface AdvisorInput {
  stats: Stats;
  profile: Profile;
  todayActions: number;
  todayIncome: number;
  monthIncome: number;
  hour: number;
  dayOfWeek: number;
  dayOfMonth: number;
  daysInMonth: number;
}

function getTimeGreeting(hour: number, name: string): string {
  if (hour < 6) return `Ночной охотник, ${name}! 🌙`;
  if (hour < 12) return `Доброе утро, ${name}! ☀️`;
  if (hour < 18) return `${name}, день в разгаре! 🔥`;
  if (hour < 22) return `Вечерний спринт, ${name}! 🌆`;
  return `Поздний воин, ${name}! 🦉`;
}

export function generateAdvice(input: AdvisorInput): {
  greeting: string;
  advice: Advice[];
} {
  const {
    stats, profile, todayActions, todayIncome, monthIncome,
    hour, dayOfWeek, dayOfMonth, daysInMonth,
  } = input;

  const advice: Advice[] = [];
  const target = profile.daily_actions_target || 30;
  const monthlyTarget = profile.monthly_income_target || 150000;
  const streak = profile.streak_current || 0;
  const percent = Math.round((todayActions / target) * 100);
  const daysLeft = daysInMonth - dayOfMonth;
  const monthPercent = monthlyTarget > 0 ? Math.round((monthIncome / monthlyTarget) * 100) : 0;
  const dailyNeeded = daysLeft > 0 ? Math.round((monthlyTarget - monthIncome) / daysLeft) : 0;

  // === CRITICAL ===
  if (hour >= 18 && todayActions === 0) {
    advice.push({
      icon: '💀',
      title: 'Серия под угрозой!',
      message: streak > 0
        ? `${streak} дней серии сгорят если не сделаешь хотя бы 1 действие!`
        : 'Ни одного действия сегодня. Начни прямо сейчас!',
      priority: 'critical',
      action: 'Быстрое действие',
    });
  }

  if ((profile.consecutive_misses || 0) >= 2) {
    advice.push({
      icon: '⚠️',
      title: 'Штраф приближается!',
      message: `${profile.consecutive_misses} пропуска подряд. Ещё один и потеряешь ${profile.penalty_xp || 100} XP!`,
      priority: 'critical',
    });
  }

  // === WARNING ===
  if (hour >= 14 && percent < 50 && todayActions > 0) {
    advice.push({
      icon: '📊',
      title: 'Темп ниже нормы',
      message: `${todayActions}/${target} действий (${percent}%). Ускорься — осталось ${target - todayActions}.`,
      priority: 'warning',
    });
  }

  if (dayOfMonth >= 10 && monthPercent < Math.round((dayOfMonth / daysInMonth) * 100) - 10) {
    advice.push({
      icon: '💰',
      title: 'Доход отстаёт от плана',
      message: `${monthPercent}% месячной цели. Нужно ${formatRub(dailyNeeded)}/день чтобы успеть.`,
      priority: 'warning',
      action: 'Добавить доход',
    });
  }

  if (stats.total_actions > 100 && stats.level <= 1) {
    advice.push({
      icon: '📈',
      title: 'Пора расти!',
      message: 'Много действий, но уровень низкий. Делай сложные задачи для большего XP.',
      priority: 'warning',
    });
  }

  // === INFO ===
  if (dayOfWeek === 1 && hour < 12) {
    advice.push({
      icon: '🎯',
      title: 'Новая неделя — новые цели',
      message: 'Запланируй ключевые задачи. Недельный босс ждёт!',
      priority: 'info',
      action: 'К боссам',
      actionRoute: '/bosses',
    });
  }

  if (dayOfWeek === 5) {
    advice.push({
      icon: '⚡',
      title: 'Пятничный рывок',
      message: 'Последний рабочий день. Закрой максимум до конца недели!',
      priority: 'info',
    });
  }

  if ((stats.gold || 0) >= 100 && stats.level >= 2) {
    advice.push({
      icon: '🪙',
      title: 'Используй золото',
      message: `${stats.gold} монет копятся. Купи зелье XP в магазине!`,
      priority: 'info',
      action: 'Магазин',
      actionRoute: '/shop',
    });
  }

  if (hour >= 9 && hour <= 11 && todayActions < 5) {
    advice.push({
      icon: '🎯',
      title: 'Время для фокуса',
      message: 'Утро — лучшее время для глубокой работы. Включи фокус-режим!',
      priority: 'info',
      action: 'Фокус',
      actionRoute: '/focus',
    });
  }

  // === POSITIVE ===
  if (percent >= 100) {
    advice.push({
      icon: '🏆',
      title: 'План выполнен!',
      message: todayIncome > 0
        ? `${todayActions} действий + ${formatRub(todayIncome)} дохода. Отличный день!`
        : `${todayActions} действий сделано. Можешь добавить доход если был.`,
      priority: 'positive',
    });
  }

  if (streak >= 7) {
    advice.push({
      icon: '🔥',
      title: `Серия ${streak} дней!`,
      message: streak >= 30
        ? 'Месяц без пропусков. Легендарный статус!'
        : streak >= 14
        ? 'Две недели подряд. Привычка формируется!'
        : 'Неделя на серии. Не останавливайся!',
      priority: 'positive',
    });
  }

  const xpInfo = getLevelXPInfo(stats.total_xp_earned, stats.total_xp_lost);
  if (xpInfo.xpForNext <= 50 && xpInfo.xpForNext > 0) {
    advice.push({
      icon: '⬆️',
      title: 'Почти новый уровень!',
      message: `Осталось ${xpInfo.xpForNext} XP до уровня ${stats.level + 1}!`,
      priority: 'positive',
    });
  }

  // Sort: critical → warning → positive → info
  const order = { critical: 0, warning: 1, positive: 2, info: 3 };
  advice.sort((a, b) => order[a.priority] - order[b.priority]);

  return {
    greeting: getTimeGreeting(hour, profile.display_name || 'Охотник'),
    advice: advice.slice(0, 3),
  };
}

function formatRub(n: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(n);
}

function getLevelXPInfo(totalEarned: number, totalLost: number): { xpForNext: number } {
  const netXP = totalEarned - totalLost;
  let level = 1;
  let xpForLevel = 750;
  let accumulated = 0;

  while (accumulated + xpForLevel <= netXP) {
    accumulated += xpForLevel;
    level++;
    xpForLevel = Math.round(750 * Math.pow(1.15, level - 1));
  }

  return { xpForNext: xpForLevel - (netXP - accumulated) };
}
