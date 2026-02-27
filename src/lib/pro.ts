import { isPerkUnlocked } from './ranks';

// ==================== ЛИМИТЫ ====================
export const PRO_LIMITS = {
  // Навыки
  FREE_MAX_SKILLS: 5,
  FREE_MAX_GOALS_PER_SKILL: 3,
  FREE_MAX_SKILL_NOTES: 5,
  FREE_MAX_GOAL_NOTES: 3,
  FREE_MAX_SKILL_GROUPS: 2,

  // Квесты и боссы
  FREE_MAX_ACTIVE_QUESTS: 3,
  FREE_MAX_ACTIVE_BOSSES: 1,
  FREE_MAX_DAILY_MISSIONS: 3,
  PRO_MAX_DAILY_MISSIONS: 5,

  // Фокус
  FREE_MAX_FOCUS_PER_DAY: 3,

  // Аналитика
  FREE_ANALYTICS_DAYS: 7,
  PRO_ANALYTICS_DAYS: 365,

  // AI Советник
  FREE_AI_PER_DAY: 3,

  // Гильдии
  FREE_MAX_GUILDS: 1,

  // Множители
  FREE_XP_MULTIPLIER: 1,
  FREE_GOLD_MULTIPLIER: 1,
  PRO_XP_MULTIPLIER: 1.5,
  PRO_GOLD_MULTIPLIER: 1.5,
};

// ==================== ПРОВЕРКИ КОЛИЧЕСТВА ====================

export function canCreateSkill(count: number, isPro: boolean): boolean {
  return isPro || count < PRO_LIMITS.FREE_MAX_SKILLS;
}

export function canCreateGoal(count: number, isPro: boolean): boolean {
  return isPro || count < PRO_LIMITS.FREE_MAX_GOALS_PER_SKILL;
}

export function canCreateSkillGroup(count: number, isPro: boolean): boolean {
  return isPro || count < PRO_LIMITS.FREE_MAX_SKILL_GROUPS;
}

export function canCreateQuest(count: number, isPro: boolean): boolean {
  return isPro || count < PRO_LIMITS.FREE_MAX_ACTIVE_QUESTS;
}

export function canCreateBoss(count: number, isPro: boolean): boolean {
  return isPro || count < PRO_LIMITS.FREE_MAX_ACTIVE_BOSSES;
}

export function canAddSkillNote(count: number, isPro: boolean): boolean {
  return isPro || count < PRO_LIMITS.FREE_MAX_SKILL_NOTES;
}

export function canAddGoalNote(count: number, isPro: boolean): boolean {
  return isPro || count < PRO_LIMITS.FREE_MAX_GOAL_NOTES;
}

// ==================== ПРОВЕРКИ ФУНКЦИЙ ====================

export function canUseFocus(sessionsToday: number, isPro: boolean): boolean {
  return isPro || sessionsToday < PRO_LIMITS.FREE_MAX_FOCUS_PER_DAY;
}

export function canUseAI(requestsToday: number, isPro: boolean): boolean {
  return isPro || requestsToday < PRO_LIMITS.FREE_AI_PER_DAY;
}

export function canExportPdf(isPro: boolean, level: number): boolean {
  return isPro || isPerkUnlocked('pdf_export', level);
}

export function canBuyLootbox(isPro: boolean): boolean {
  return isPro;
}

export function canUseTemplates(isPro: boolean): boolean {
  return isPro;
}

export function canCreateGuild(guildCount: number, isPro: boolean): boolean {
  return isPro || guildCount < PRO_LIMITS.FREE_MAX_GUILDS;
}

export function canUseTelegram(isPro: boolean): boolean {
  return isPro;
}

// ==================== МНОЖИТЕЛИ ====================

export function getXPMultiplier(isPro: boolean, level: number): number {
  if (isPro) return PRO_LIMITS.PRO_XP_MULTIPLIER;
  if (isPerkUnlocked('xp_multiplier', level)) return 1.2;
  return PRO_LIMITS.FREE_XP_MULTIPLIER;
}

export function getGoldMultiplier(isPro: boolean, level: number): number {
  if (isPro) return PRO_LIMITS.PRO_GOLD_MULTIPLIER;
  if (isPerkUnlocked('gold_multiplier', level)) return 1.2;
  return PRO_LIMITS.FREE_GOLD_MULTIPLIER;
}

// ==================== АНАЛИТИКА ====================

export function getAnalyticsDays(isPro: boolean, level: number): number {
  if (isPro) return PRO_LIMITS.PRO_ANALYTICS_DAYS;
  if (isPerkUnlocked('full_analytics', level)) return 365;
  if (isPerkUnlocked('extended_analytics', level)) return 30;
  if (isPerkUnlocked('basic_analytics', level)) return 7;
  return 3;
}

export function getDailyMissionsLimit(isPro: boolean): number {
  return isPro ? PRO_LIMITS.PRO_MAX_DAILY_MISSIONS : PRO_LIMITS.FREE_MAX_DAILY_MISSIONS;
}

// ==================== СВОДКА ЛИМИТОВ ====================

export function getLimitsInfo(isPro: boolean, level: number) {
  return {
    skills: isPro ? '∞' : String(PRO_LIMITS.FREE_MAX_SKILLS),
    goalsPerSkill: isPro ? '∞' : String(PRO_LIMITS.FREE_MAX_GOALS_PER_SKILL),
    quests: isPro ? '∞' : String(PRO_LIMITS.FREE_MAX_ACTIVE_QUESTS),
    bosses: isPro ? '∞' : String(PRO_LIMITS.FREE_MAX_ACTIVE_BOSSES),
    focus: isPro ? '∞' : String(PRO_LIMITS.FREE_MAX_FOCUS_PER_DAY) + '/day',
    ai: isPro ? '∞' : String(PRO_LIMITS.FREE_AI_PER_DAY) + '/day',
    analyticsDays: getAnalyticsDays(isPro, level),
    xpMultiplier: getXPMultiplier(isPro, level),
    goldMultiplier: getGoldMultiplier(isPro, level),
    templates: isPro,
    pdfExport: canExportPdf(isPro, level),
    telegram: isPro,
    lootboxShop: isPro,
  };
}