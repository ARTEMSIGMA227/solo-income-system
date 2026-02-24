export const XP_REWARDS = {
  action: 5,
  task: 25,
  hard_task: 50,
  sale: 100,
  client_closed: 250,
  daily_complete: 50,
  focus_bonus: 30,
} as const;

export const PENALTIES = {
  daily_miss: -100,
  streak_break_levels: 1,
  consecutive_misses_threshold: 3,
} as const;

export const MULTIPLIERS = {
  overperform_threshold: 1.2,
  overperform_multiplier: 1.5,
  sales_perk_bonus: 1.2,
} as const;

export function xpToNextLevel(level: number): number {
  return 500 + level * 250;
}

export function xpForLevel(targetLevel: number): number {
  let total = 0;
  for (let i = 1; i < targetLevel; i++) {
    total += xpToNextLevel(i);
  }
  return total;
}

export const TITLES: { minLevel: number; title: string; titleKey: string; icon: string }[] = [
  { minLevel: 1, title: 'Безымянный', titleKey: 'nameless', icon: '👢' },
  { minLevel: 3, title: 'Рекрут дохода', titleKey: 'incomeRecruit', icon: '🗡️' },
  { minLevel: 5, title: 'Охотник E-ранга', titleKey: 'eRank', icon: '🏹' },
  { minLevel: 8, title: 'Охотник D-ранга', titleKey: 'dRank', icon: '⚔️' },
  { minLevel: 12, title: 'Охотник C-ранга', titleKey: 'cRank', icon: '🔥' },
  { minLevel: 16, title: 'Охотник B-ранга', titleKey: 'bRank', icon: '👊' },
  { minLevel: 20, title: 'Охотник A-ранга', titleKey: 'aRank', icon: '👑' },
  { minLevel: 25, title: 'Архитектор дохода', titleKey: 'incomeArchitect', icon: '🏛️' },
  { minLevel: 30, title: 'S-ранг Охотник', titleKey: 'sRank', icon: '⚡' },
  { minLevel: 40, title: 'Магнат', titleKey: 'magnate', icon: '🌟' },
  { minLevel: 50, title: 'Теневой Монарх', titleKey: 'shadowMonarch', icon: '👁️' },
];

export function getTitleForLevel(level: number) {
  let current = TITLES[0];
  for (const t of TITLES) {
    if (level >= t.minLevel) current = t;
    else break;
  }
  return current;
}

export const PERKS = {
  sales_xp_boost: {
    key: 'sales_xp_boost',
    title: '+20% XP за продажи',
    description: 'Все XP за продажи и закрытие клиентов увеличены на 20%',
    unlock_level: 5,
    icon: '💰',
  },
  focus_mode: {
    key: 'focus_mode',
    title: 'Фокус-режим',
    description: 'Таймер 90 минут с бонусным XP за завершение блока',
    unlock_level: 3,
    icon: '🎯',
  },
  analytics: {
    key: 'analytics',
    title: 'Аналитика',
    description: 'Доступ к расширенным отчётам и трендам',
    unlock_level: 7,
    icon: '📊',
  },
  auto_plan: {
    key: 'auto_plan',
    title: 'Автоплан',
    description: 'Автоматическая генерация плана дня и недели',
    unlock_level: 10,
    icon: '🤖',
  },
} as const;

export const MANDATORY_CATEGORIES = [
  'income_action',
  'strategy',
  'skill',
  'fitness',
] as const;

export const DEFAULTS = {
  monthly_income_target: 150000,
  daily_actions_target: 30,
  daily_income_target: 5000,
  focus_duration: 90,
  timezone: 'Europe/Berlin',
} as const;
