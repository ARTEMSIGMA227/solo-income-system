export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: 'actions' | 'income' | 'streak' | 'level' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  goldReward: number;
  xpReward: number;
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  totalActions: number;
  totalIncome: number;
  totalSales: number;
  totalClients: number;
  streakCurrent: number;
  streakBest: number;
  level: number;
  totalXpEarned: number;
  totalGoldEarned: number;
  todayActions: number;
  sessionsToday: number;
}

function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common': return '#94a3b8';
    case 'rare': return '#3b82f6';
    case 'epic': return '#7c3aed';
    case 'legendary': return '#f59e0b';
    default: return '#94a3b8';
  }
}

function getRarityLabel(rarity: string): string {
  switch (rarity) {
    case 'common': return 'Обычная';
    case 'rare': return 'Редкая';
    case 'epic': return 'Эпическая';
    case 'legendary': return 'Легендарная';
    default: return '';
  }
}

export { getRarityColor, getRarityLabel };

export const ACHIEVEMENTS: AchievementDef[] = [
  // === ДЕЙСТВИЯ ===
  {
    key: 'first_blood', name: 'Первая кровь', description: 'Сделай первое действие',
    icon: '🗡️', category: 'actions', rarity: 'common', goldReward: 10, xpReward: 25,
    check: (s) => s.totalActions >= 1,
  },
  {
    key: 'actions_100', name: 'Сотня', description: '100 действий всего',
    icon: '💯', category: 'actions', rarity: 'common', goldReward: 50, xpReward: 100,
    check: (s) => s.totalActions >= 100,
  },
  {
    key: 'actions_500', name: 'Неудержимый', description: '500 действий всего',
    icon: '🔥', category: 'actions', rarity: 'rare', goldReward: 150, xpReward: 300,
    check: (s) => s.totalActions >= 500,
  },
  {
    key: 'actions_1000', name: 'Машина', description: '1000 действий всего',
    icon: '⚙️', category: 'actions', rarity: 'epic', goldReward: 500, xpReward: 750,
    check: (s) => s.totalActions >= 1000,
  },
  {
    key: 'actions_5000', name: 'Легенда действий', description: '5000 действий всего',
    icon: '🌟', category: 'actions', rarity: 'legendary', goldReward: 2000, xpReward: 2500,
    check: (s) => s.totalActions >= 5000,
  },
  {
    key: 'daily_50', name: 'Перевыполнение', description: '50 действий за 1 день',
    icon: '⚡', category: 'actions', rarity: 'rare', goldReward: 100, xpReward: 200,
    check: (s) => s.todayActions >= 50,
  },
  {
    key: 'daily_100', name: 'Берсерк', description: '100 действий за 1 день',
    icon: '💀', category: 'actions', rarity: 'epic', goldReward: 300, xpReward: 500,
    check: (s) => s.todayActions >= 100,
  },

  // === ДОХОД ===
  {
    key: 'income_10k', name: 'Первые деньги', description: 'Заработай 10 000 ₽',
    icon: '💵', category: 'income', rarity: 'common', goldReward: 50, xpReward: 100,
    check: (s) => s.totalIncome >= 10000,
  },
  {
    key: 'income_50k', name: 'На пути к цели', description: 'Заработай 50 000 ₽',
    icon: '💰', category: 'income', rarity: 'rare', goldReward: 200, xpReward: 400,
    check: (s) => s.totalIncome >= 50000,
  },
  {
    key: 'income_150k', name: 'Цель достигнута!', description: 'Заработай 150 000 ₽',
    icon: '🏆', category: 'income', rarity: 'epic', goldReward: 1000, xpReward: 1500,
    check: (s) => s.totalIncome >= 150000,
  },
  {
    key: 'income_500k', name: 'Полмиллиона', description: 'Заработай 500 000 ₽',
    icon: '👑', category: 'income', rarity: 'legendary', goldReward: 3000, xpReward: 5000,
    check: (s) => s.totalIncome >= 500000,
  },
  {
    key: 'income_1m', name: 'Миллионер', description: 'Заработай 1 000 000 ₽',
    icon: '🌟', category: 'income', rarity: 'legendary', goldReward: 10000, xpReward: 10000,
    check: (s) => s.totalIncome >= 1000000,
  },
  {
    key: 'sales_5', name: 'Продавец', description: '5 продаж',
    icon: '🤝', category: 'income', rarity: 'common', goldReward: 50, xpReward: 100,
    check: (s) => s.totalSales >= 5,
  },
  {
    key: 'sales_25', name: 'Мастер продаж', description: '25 продаж',
    icon: '💎', category: 'income', rarity: 'rare', goldReward: 300, xpReward: 500,
    check: (s) => s.totalSales >= 25,
  },
  {
    key: 'sales_100', name: 'Акула бизнеса', description: '100 продаж',
    icon: '🦈', category: 'income', rarity: 'epic', goldReward: 1000, xpReward: 2000,
    check: (s) => s.totalSales >= 100,
  },

  // === STREAK ===
  {
    key: 'streak_3', name: 'Разогрев', description: '3 дня подряд без пропусков',
    icon: '🔥', category: 'streak', rarity: 'common', goldReward: 30, xpReward: 50,
    check: (s) => s.streakBest >= 3,
  },
  {
    key: 'streak_7', name: 'Неделя силы', description: '7 дней подряд',
    icon: '💪', category: 'streak', rarity: 'rare', goldReward: 100, xpReward: 200,
    check: (s) => s.streakBest >= 7,
  },
  {
    key: 'streak_14', name: 'Две недели огня', description: '14 дней подряд',
    icon: '🔥', category: 'streak', rarity: 'epic', goldReward: 300, xpReward: 500,
    check: (s) => s.streakBest >= 14,
  },
  {
    key: 'streak_30', name: 'Месяц дисциплины', description: '30 дней подряд',
    icon: '⚡', category: 'streak', rarity: 'legendary', goldReward: 1000, xpReward: 2000,
    check: (s) => s.streakBest >= 30,
  },

  // === УРОВЕНЬ ===
  {
    key: 'level_5', name: 'Охотник', description: 'Достигни 5 уровня',
    icon: '🏹', category: 'level', rarity: 'common', goldReward: 50, xpReward: 0,
    check: (s) => s.level >= 5,
  },
  {
    key: 'level_10', name: 'Воин', description: 'Достигни 10 уровня',
    icon: '⚔️', category: 'level', rarity: 'rare', goldReward: 200, xpReward: 0,
    check: (s) => s.level >= 10,
  },
  {
    key: 'level_20', name: 'Рыцарь', description: 'Достигни 20 уровня',
    icon: '🛡️', category: 'level', rarity: 'epic', goldReward: 500, xpReward: 0,
    check: (s) => s.level >= 20,
  },
  {
    key: 'level_30', name: 'S-ранг', description: 'Достигни 30 уровня',
    icon: '⚡', category: 'level', rarity: 'legendary', goldReward: 2000, xpReward: 0,
    check: (s) => s.level >= 30,
  },

  // === SPECIAL ===
  {
    key: 'focus_first', name: 'Первый фокус', description: 'Заверши первый фокус-блок',
    icon: '🎯', category: 'special', rarity: 'common', goldReward: 25, xpReward: 50,
    check: (s) => s.sessionsToday >= 1,
  },
  {
    key: 'gold_1000', name: 'Золотой мешок', description: 'Заработай 1000 Gold',
    icon: '🪙', category: 'special', rarity: 'rare', goldReward: 100, xpReward: 100,
    check: (s) => s.totalGoldEarned >= 1000,
  },
  {
    key: 'xp_10000', name: 'Прокачанный', description: 'Заработай 10 000 XP',
    icon: '✨', category: 'special', rarity: 'epic', goldReward: 500, xpReward: 500,
    check: (s) => s.totalXpEarned >= 10000,
  },
];