import type { TranslationDictionary } from './i18n/types';

export interface AchievementDef {
  key: string;
  nameKey: string;
  descriptionKey: string;
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

function getRarityLabel(rarity: string, t: TranslationDictionary): string {
  switch (rarity) {
    case 'common': return t.achievementsLib.rarityLabels.common;
    case 'rare': return t.achievementsLib.rarityLabels.rare;
    case 'epic': return t.achievementsLib.rarityLabels.epic;
    case 'legendary': return t.achievementsLib.rarityLabels.legendary;
    default: return '';
  }
}

function getAchievementName(key: string, t: TranslationDictionary): string {
  return t.achievementsLib.names[key] ?? key;
}

function getAchievementDescription(key: string, t: TranslationDictionary): string {
  return t.achievementsLib.descriptions[key] ?? key;
}

export { getRarityColor, getRarityLabel, getAchievementName, getAchievementDescription };

export const ACHIEVEMENTS: AchievementDef[] = [
  // === ACTIONS ===
  {
    key: 'first_blood', nameKey: 'first_blood', descriptionKey: 'first_blood',
    icon: '🗡️', category: 'actions', rarity: 'common', goldReward: 10, xpReward: 25,
    check: (s) => s.totalActions >= 1,
  },
  {
    key: 'actions_100', nameKey: 'actions_100', descriptionKey: 'actions_100',
    icon: '💯', category: 'actions', rarity: 'common', goldReward: 50, xpReward: 100,
    check: (s) => s.totalActions >= 100,
  },
  {
    key: 'actions_500', nameKey: 'actions_500', descriptionKey: 'actions_500',
    icon: '🔥', category: 'actions', rarity: 'rare', goldReward: 150, xpReward: 300,
    check: (s) => s.totalActions >= 500,
  },
  {
    key: 'actions_1000', nameKey: 'actions_1000', descriptionKey: 'actions_1000',
    icon: '⚙️', category: 'actions', rarity: 'epic', goldReward: 500, xpReward: 750,
    check: (s) => s.totalActions >= 1000,
  },
  {
    key: 'actions_5000', nameKey: 'actions_5000', descriptionKey: 'actions_5000',
    icon: '🌟', category: 'actions', rarity: 'legendary', goldReward: 2000, xpReward: 2500,
    check: (s) => s.totalActions >= 5000,
  },
  {
    key: 'daily_50', nameKey: 'daily_50', descriptionKey: 'daily_50',
    icon: '⚡', category: 'actions', rarity: 'rare', goldReward: 100, xpReward: 200,
    check: (s) => s.todayActions >= 50,
  },
  {
    key: 'daily_100', nameKey: 'daily_100', descriptionKey: 'daily_100',
    icon: '💀', category: 'actions', rarity: 'epic', goldReward: 300, xpReward: 500,
    check: (s) => s.todayActions >= 100,
  },

  // === INCOME ===
  {
    key: 'income_10k', nameKey: 'income_10k', descriptionKey: 'income_10k',
    icon: '💵', category: 'income', rarity: 'common', goldReward: 50, xpReward: 100,
    check: (s) => s.totalIncome >= 10000,
  },
  {
    key: 'income_50k', nameKey: 'income_50k', descriptionKey: 'income_50k',
    icon: '💰', category: 'income', rarity: 'rare', goldReward: 200, xpReward: 400,
    check: (s) => s.totalIncome >= 50000,
  },
  {
    key: 'income_150k', nameKey: 'income_150k', descriptionKey: 'income_150k',
    icon: '🏆', category: 'income', rarity: 'epic', goldReward: 1000, xpReward: 1500,
    check: (s) => s.totalIncome >= 150000,
  },
  {
    key: 'income_500k', nameKey: 'income_500k', descriptionKey: 'income_500k',
    icon: '👑', category: 'income', rarity: 'legendary', goldReward: 3000, xpReward: 5000,
    check: (s) => s.totalIncome >= 500000,
  },
  {
    key: 'income_1m', nameKey: 'income_1m', descriptionKey: 'income_1m',
    icon: '🌟', category: 'income', rarity: 'legendary', goldReward: 10000, xpReward: 10000,
    check: (s) => s.totalIncome >= 1000000,
  },
  {
    key: 'sales_5', nameKey: 'sales_5', descriptionKey: 'sales_5',
    icon: '🤝', category: 'income', rarity: 'common', goldReward: 50, xpReward: 100,
    check: (s) => s.totalSales >= 5,
  },
  {
    key: 'sales_25', nameKey: 'sales_25', descriptionKey: 'sales_25',
    icon: '💎', category: 'income', rarity: 'rare', goldReward: 300, xpReward: 500,
    check: (s) => s.totalSales >= 25,
  },
  {
    key: 'sales_100', nameKey: 'sales_100', descriptionKey: 'sales_100',
    icon: '🦈', category: 'income', rarity: 'epic', goldReward: 1000, xpReward: 2000,
    check: (s) => s.totalSales >= 100,
  },

  // === STREAK ===
  {
    key: 'streak_3', nameKey: 'streak_3', descriptionKey: 'streak_3',
    icon: '🔥', category: 'streak', rarity: 'common', goldReward: 30, xpReward: 50,
    check: (s) => s.streakBest >= 3,
  },
  {
    key: 'streak_7', nameKey: 'streak_7', descriptionKey: 'streak_7',
    icon: '💪', category: 'streak', rarity: 'rare', goldReward: 100, xpReward: 200,
    check: (s) => s.streakBest >= 7,
  },
  {
    key: 'streak_14', nameKey: 'streak_14', descriptionKey: 'streak_14',
    icon: '🔥', category: 'streak', rarity: 'epic', goldReward: 300, xpReward: 500,
    check: (s) => s.streakBest >= 14,
  },
  {
    key: 'streak_30', nameKey: 'streak_30', descriptionKey: 'streak_30',
    icon: '⚡', category: 'streak', rarity: 'legendary', goldReward: 1000, xpReward: 2000,
    check: (s) => s.streakBest >= 30,
  },

  // === LEVEL ===
  {
    key: 'level_5', nameKey: 'level_5', descriptionKey: 'level_5',
    icon: '🏹', category: 'level', rarity: 'common', goldReward: 50, xpReward: 0,
    check: (s) => s.level >= 5,
  },
  {
    key: 'level_10', nameKey: 'level_10', descriptionKey: 'level_10',
    icon: '⚔️', category: 'level', rarity: 'rare', goldReward: 200, xpReward: 0,
    check: (s) => s.level >= 10,
  },
  {
    key: 'level_20', nameKey: 'level_20', descriptionKey: 'level_20',
    icon: '🛡️', category: 'level', rarity: 'epic', goldReward: 500, xpReward: 0,
    check: (s) => s.level >= 20,
  },
  {
    key: 'level_30', nameKey: 'level_30', descriptionKey: 'level_30',
    icon: '⚡', category: 'level', rarity: 'legendary', goldReward: 2000, xpReward: 0,
    check: (s) => s.level >= 30,
  },

  // === SPECIAL ===
  {
    key: 'focus_first', nameKey: 'focus_first', descriptionKey: 'focus_first',
    icon: '🎯', category: 'special', rarity: 'common', goldReward: 25, xpReward: 50,
    check: (s) => s.sessionsToday >= 1,
  },
  {
    key: 'gold_1000', nameKey: 'gold_1000', descriptionKey: 'gold_1000',
    icon: '🪙', category: 'special', rarity: 'rare', goldReward: 100, xpReward: 100,
    check: (s) => s.totalGoldEarned >= 1000,
  },
  {
    key: 'xp_10000', nameKey: 'xp_10000', descriptionKey: 'xp_10000',
    icon: '✨', category: 'special', rarity: 'epic', goldReward: 500, xpReward: 500,
    check: (s) => s.totalXpEarned >= 10000,
  },
];