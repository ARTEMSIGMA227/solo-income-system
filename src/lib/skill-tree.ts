export interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  branch: SkillBranch;
  maxLevel: 3;
  requires: string[];
  effects: SkillEffect[];
  position: { row: number; col: number };
}

export interface SkillEffect {
  type: SkillEffectType;
  value: number;
  perLevel: number;
  description: string;
}

export type SkillEffectType =
  | 'xp_bonus_percent'
  | 'gold_bonus_percent'
  | 'xp_bonus_flat'
  | 'gold_bonus_flat'
  | 'streak_shield_days'
  | 'penalty_reduction_percent'
  | 'daily_gold_passive'
  | 'xp_multiplier_actions'
  | 'crit_chance_percent'
  | 'boss_damage_bonus'
  | 'mission_slot'
  | 'shop_discount_percent';

export type SkillBranch =
  | 'communication'
  | 'intellect'
  | 'discipline'
  | 'precision'
  | 'willpower'
  | 'defense';

export interface UserSkills {
  allocated: Record<string, number>;
  totalPoints: number;
  usedPoints: number;
  availablePoints: number;
}

export const SKILL_BRANCHES: Record<SkillBranch, { name: string; icon: string; color: string; description: string }> = {
  communication: {
    name: 'Коммуникация',
    icon: '🗣️',
    color: '#3b82f6',
    description: 'Искусство общения и влияния',
  },
  intellect: {
    name: 'Интеллект',
    icon: '🧠',
    color: '#a78bfa',
    description: 'Знания, анализ и стратегия',
  },
  discipline: {
    name: 'Дисциплина',
    icon: '⚡',
    color: '#f59e0b',
    description: 'Привычки и управление временем',
  },
  precision: {
    name: 'Точность',
    icon: '🎯',
    color: '#ef4444',
    description: 'Планирование и эффективность',
  },
  willpower: {
    name: 'Сила воли',
    icon: '🔥',
    color: '#f97316',
    description: 'Стойкость и преодоление',
  },
  defense: {
    name: 'Защита',
    icon: '🛡️',
    color: '#22c55e',
    description: 'Стабильность и безопасность',
  },
};

export const SKILL_NODES: SkillNode[] = [
  // === COMMUNICATION ===
  {
    id: 'comm_persuasion',
    name: 'Убеждение',
    description: 'Увеличивает XP за звонки и касания',
    icon: '💬',
    branch: 'communication',
    maxLevel: 3,
    requires: [],
    effects: [
      { type: 'xp_bonus_percent', value: 5, perLevel: 5, description: '+{value}% XP за действия типа action' },
    ],
    position: { row: 3, col: 0 },
  },
  {
    id: 'comm_networking',
    name: 'Нетворкинг',
    description: 'Пассивный доход золота от связей',
    icon: '🤝',
    branch: 'communication',
    maxLevel: 3,
    requires: ['comm_persuasion'],
    effects: [
      { type: 'daily_gold_passive', value: 3, perLevel: 3, description: '+{value} 🪙/день пассивно' },
    ],
    position: { row: 2, col: 0 },
  },
  {
    id: 'comm_negotiation',
    name: 'Переговоры',
    description: 'Бонус золота за продажи',
    icon: '⚖️',
    branch: 'communication',
    maxLevel: 3,
    requires: ['comm_networking'],
    effects: [
      { type: 'gold_bonus_percent', value: 10, perLevel: 10, description: '+{value}% золота за продажи' },
    ],
    position: { row: 1, col: 0 },
  },
  {
    id: 'comm_leadership',
    name: 'Лидерство',
    description: 'Бонусный урон боссам + доп. слот миссий',
    icon: '👑',
    branch: 'communication',
    maxLevel: 3,
    requires: ['comm_negotiation'],
    effects: [
      { type: 'boss_damage_bonus', value: 10, perLevel: 10, description: '+{value}% урона боссам' },
      { type: 'mission_slot', value: 1, perLevel: 0, description: '+1 слот ежедневных миссий (на Lv.3)' },
    ],
    position: { row: 0, col: 0 },
  },

  // === INTELLECT ===
  {
    id: 'int_learning',
    name: 'Обучение',
    description: 'Увеличивает XP за задачи',
    icon: '📚',
    branch: 'intellect',
    maxLevel: 3,
    requires: [],
    effects: [
      { type: 'xp_bonus_percent', value: 5, perLevel: 5, description: '+{value}% XP за задачи' },
    ],
    position: { row: 3, col: 1 },
  },
  {
    id: 'int_analytics',
    name: 'Аналитика',
    description: 'Шанс критического XP (×2)',
    icon: '📊',
    branch: 'intellect',
    maxLevel: 3,
    requires: ['int_learning'],
    effects: [
      { type: 'crit_chance_percent', value: 5, perLevel: 5, description: '{value}% шанс ×2 XP' },
    ],
    position: { row: 2, col: 1 },
  },
  {
    id: 'int_strategy',
    name: 'Стратегия',
    description: 'Бонус XP за выполнение плана дня',
    icon: '♟️',
    branch: 'intellect',
    maxLevel: 3,
    requires: ['int_analytics'],
    effects: [
      { type: 'xp_bonus_flat', value: 20, perLevel: 20, description: '+{value} XP при закрытии дня' },
    ],
    position: { row: 1, col: 1 },
  },
  {
    id: 'int_focus',
    name: 'Фокус',
    description: 'XP множитель для сложных задач',
    icon: '🔬',
    branch: 'intellect',
    maxLevel: 3,
    requires: ['int_strategy'],
    effects: [
      { type: 'xp_multiplier_actions', value: 15, perLevel: 15, description: '+{value}% XP за hard_task' },
    ],
    position: { row: 0, col: 1 },
  },

  // === DISCIPLINE ===
  {
    id: 'disc_habits',
    name: 'Привычки',
    description: 'Бонус XP за серию дней',
    icon: '🔄',
    branch: 'discipline',
    maxLevel: 3,
    requires: [],
    effects: [
      { type: 'xp_bonus_flat', value: 5, perLevel: 5, description: '+{value} XP за каждый день серии' },
    ],
    position: { row: 3, col: 2 },
  },
  {
    id: 'disc_time',
    name: 'Тайм-менеджмент',
    description: 'Бонус за ранние действия (до 10:00)',
    icon: '⏰',
    branch: 'discipline',
    maxLevel: 3,
    requires: ['disc_habits'],
    effects: [
      { type: 'xp_bonus_percent', value: 10, perLevel: 10, description: '+{value}% XP за действия до 10:00' },
    ],
    position: { row: 2, col: 2 },
  },
  {
    id: 'disc_endurance',
    name: 'Выносливость',
    description: 'Снижает штраф за пропуск',
    icon: '🏋️',
    branch: 'discipline',
    maxLevel: 3,
    requires: ['disc_time'],
    effects: [
      { type: 'penalty_reduction_percent', value: 10, perLevel: 10, description: '-{value}% к штрафу за пропуск' },
    ],
    position: { row: 1, col: 2 },
  },
  {
    id: 'disc_recovery',
    name: 'Восстановление',
    description: 'Щит серии — защита от потери',
    icon: '💎',
    branch: 'discipline',
    maxLevel: 3,
    requires: ['disc_endurance'],
    effects: [
      { type: 'streak_shield_days', value: 1, perLevel: 1, description: '{value} дней защиты серии/месяц' },
    ],
    position: { row: 0, col: 2 },
  },

  // === PRECISION ===
  {
    id: 'prec_planning',
    name: 'Планирование',
    description: 'Золото за выполнение плана дня',
    icon: '📋',
    branch: 'precision',
    maxLevel: 3,
    requires: [],
    effects: [
      { type: 'gold_bonus_flat', value: 5, perLevel: 5, description: '+{value} 🪙 при закрытии дня' },
    ],
    position: { row: 3, col: 3 },
  },
  {
    id: 'prec_priorities',
    name: 'Приоритеты',
    description: 'Бонус XP за первые 5 действий дня',
    icon: '🎖️',
    branch: 'precision',
    maxLevel: 3,
    requires: ['prec_planning'],
    effects: [
      { type: 'xp_bonus_percent', value: 15, perLevel: 15, description: '+{value}% XP для первых 5 действий' },
    ],
    position: { row: 2, col: 3 },
  },
  {
    id: 'prec_efficiency',
    name: 'Эффективность',
    description: 'Скидка в магазине',
    icon: '⚙️',
    branch: 'precision',
    maxLevel: 3,
    requires: ['prec_priorities'],
    effects: [
      { type: 'shop_discount_percent', value: 5, perLevel: 5, description: '-{value}% цена в магазине' },
    ],
    position: { row: 1, col: 3 },
  },
  {
    id: 'prec_mastery',
    name: 'Перфекционизм',
    description: 'Двойное золото за идеальные дни (100%+ плана)',
    icon: '💠',
    branch: 'precision',
    maxLevel: 3,
    requires: ['prec_efficiency'],
    effects: [
      { type: 'gold_bonus_percent', value: 25, perLevel: 25, description: '+{value}% золота при 100%+ плана' },
    ],
    position: { row: 0, col: 3 },
  },

  // === WILLPOWER ===
  {
    id: 'will_stress',
    name: 'Стрессоустойчивость',
    description: 'Меньше штраф при пропуске',
    icon: '🧊',
    branch: 'willpower',
    maxLevel: 3,
    requires: [],
    effects: [
      { type: 'penalty_reduction_percent', value: 8, perLevel: 8, description: '-{value}% штраф XP' },
    ],
    position: { row: 3, col: 4 },
  },
  {
    id: 'will_risk',
    name: 'Управление риском',
    description: 'Увеличивает шанс крита',
    icon: '🎲',
    branch: 'willpower',
    maxLevel: 3,
    requires: ['will_stress'],
    effects: [
      { type: 'crit_chance_percent', value: 3, perLevel: 3, description: '+{value}% шанс крит. XP' },
    ],
    position: { row: 2, col: 4 },
  },
  {
    id: 'will_adapt',
    name: 'Адаптация',
    description: 'XP бонус растёт за каждый день серии',
    icon: '🦎',
    branch: 'willpower',
    maxLevel: 3,
    requires: ['will_risk'],
    effects: [
      { type: 'xp_bonus_percent', value: 2, perLevel: 2, description: '+{value}% XP за каждый день серии (макс 30%)' },
    ],
    position: { row: 1, col: 4 },
  },
  {
    id: 'will_tenacity',
    name: 'Упорство',
    description: 'Бонусный урон боссам при низком HP',
    icon: '💪',
    branch: 'willpower',
    maxLevel: 3,
    requires: ['will_adapt'],
    effects: [
      { type: 'boss_damage_bonus', value: 15, perLevel: 15, description: '+{value}% урон боссу когда HP <30%' },
    ],
    position: { row: 0, col: 4 },
  },

  // === DEFENSE ===
  {
    id: 'def_finance',
    name: 'Финансы',
    description: 'Пассивный доход золота',
    icon: '🏦',
    branch: 'defense',
    maxLevel: 3,
    requires: [],
    effects: [
      { type: 'daily_gold_passive', value: 5, perLevel: 5, description: '+{value} 🪙/день пассивно' },
    ],
    position: { row: 3, col: 5 },
  },
  {
    id: 'def_health',
    name: 'Здоровье',
    description: 'Снижает потерю XP при level down',
    icon: '❤️',
    branch: 'defense',
    maxLevel: 3,
    requires: ['def_finance'],
    effects: [
      { type: 'penalty_reduction_percent', value: 15, perLevel: 15, description: '-{value}% потеря XP при level down' },
    ],
    position: { row: 2, col: 5 },
  },
  {
    id: 'def_balance',
    name: 'Баланс',
    description: 'Щит серии + пассивный XP',
    icon: '☯️',
    branch: 'defense',
    maxLevel: 3,
    requires: ['def_health'],
    effects: [
      { type: 'streak_shield_days', value: 1, perLevel: 1, description: '+{value} день защиты серии/месяц' },
      { type: 'xp_bonus_flat', value: 5, perLevel: 5, description: '+{value} XP/день пассивно' },
    ],
    position: { row: 1, col: 5 },
  },
  {
    id: 'def_fortress',
    name: 'Крепость',
    description: 'Максимальная защита — штрафы минимальны',
    icon: '🏰',
    branch: 'defense',
    maxLevel: 3,
    requires: ['def_balance'],
    effects: [
      { type: 'penalty_reduction_percent', value: 20, perLevel: 20, description: '-{value}% все штрафы' },
      { type: 'daily_gold_passive', value: 10, perLevel: 10, description: '+{value} 🪙/день пассивно' },
    ],
    position: { row: 0, col: 5 },
  },
];

export function getSkillNode(id: string): SkillNode | undefined {
  return SKILL_NODES.find((n) => n.id === id);
}

export function getSkillsByBranch(branch: SkillBranch): SkillNode[] {
  return SKILL_NODES.filter((n) => n.branch === branch);
}

export function canAllocate(
  nodeId: string,
  allocated: Record<string, number>,
  availablePoints: number
): { can: boolean; reason: string } {
  const node = getSkillNode(nodeId);
  if (!node) return { can: false, reason: 'Навык не найден' };

  const currentLevel = allocated[nodeId] || 0;
  if (currentLevel >= node.maxLevel) return { can: false, reason: 'Максимальный уровень' };
  if (availablePoints <= 0) return { can: false, reason: 'Нет очков навыков' };

  for (const reqId of node.requires) {
    const reqLevel = allocated[reqId] || 0;
    if (reqLevel === 0) {
      const reqNode = getSkillNode(reqId);
      return { can: false, reason: `Требуется: ${reqNode?.name || reqId}` };
    }
  }

  return { can: true, reason: '' };
}

export function calculateEffects(allocated: Record<string, number>): Record<SkillEffectType, number> {
  const totals: Record<string, number> = {};

  for (const node of SKILL_NODES) {
    const level = allocated[node.id] || 0;
    if (level === 0) continue;

    for (const effect of node.effects) {
      const key = effect.type;
      const val = effect.value + effect.perLevel * (level - 1);
      totals[key] = (totals[key] || 0) + val;
    }
  }

  return totals as Record<SkillEffectType, number>;
}

export function getSkillPointsForLevel(level: number): number {
  // 1 point per level starting from level 2
  return Math.max(level - 1, 0);
}

export function getUsedPoints(allocated: Record<string, number>): number {
  return Object.values(allocated).reduce((sum, lvl) => sum + lvl, 0);
}