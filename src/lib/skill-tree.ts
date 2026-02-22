import type { TranslationDictionary } from './i18n/types';

export interface SkillNode {
  id: string;
  nameKey: string;
  descriptionKey: string;
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
  descriptionKey: string;
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

export interface SkillBranchInfo {
  nameKey: string;
  icon: string;
  color: string;
  descriptionKey: string;
}

export const SKILL_BRANCHES: Record<SkillBranch, SkillBranchInfo> = {
  communication: {
    nameKey: 'communication',
    icon: '🗣️',
    color: '#3b82f6',
    descriptionKey: 'communication',
  },
  intellect: {
    nameKey: 'intellect',
    icon: '🧠',
    color: '#a78bfa',
    descriptionKey: 'intellect',
  },
  discipline: {
    nameKey: 'discipline',
    icon: '⚡',
    color: '#f59e0b',
    descriptionKey: 'discipline',
  },
  precision: {
    nameKey: 'precision',
    icon: '🎯',
    color: '#ef4444',
    descriptionKey: 'precision',
  },
  willpower: {
    nameKey: 'willpower',
    icon: '🔥',
    color: '#f97316',
    descriptionKey: 'willpower',
  },
  defense: {
    nameKey: 'defense',
    icon: '🛡️',
    color: '#22c55e',
    descriptionKey: 'defense',
  },
};

export function getBranchName(branch: SkillBranch, t: TranslationDictionary): string {
  return t.skillTreeLib.branchNames[branch] ?? branch;
}

export function getBranchDescription(branch: SkillBranch, t: TranslationDictionary): string {
  return t.skillTreeLib.branchDescriptions[branch] ?? branch;
}

export function getSkillName(id: string, t: TranslationDictionary): string {
  return t.skillTreeLib.skillNames[id] ?? id;
}

export function getSkillDescription(id: string, t: TranslationDictionary): string {
  return t.skillTreeLib.skillDescriptions[id] ?? id;
}

export function getEffectDescription(key: string, value: number, t: TranslationDictionary): string {
  const template = t.skillTreeLib.effectDescriptions[key];
  if (!template) return key;
  return template.replace('{value}', String(value));
}

export const SKILL_NODES: SkillNode[] = [
  // === COMMUNICATION ===
  {
    id: 'comm_persuasion',
    nameKey: 'comm_persuasion',
    descriptionKey: 'comm_persuasion',
    icon: '💬',
    branch: 'communication',
    maxLevel: 3,
    requires: [],
    effects: [
      { type: 'xp_bonus_percent', value: 5, perLevel: 5, descriptionKey: 'comm_persuasion_eff' },
    ],
    position: { row: 3, col: 0 },
  },
  {
    id: 'comm_networking',
    nameKey: 'comm_networking',
    descriptionKey: 'comm_networking',
    icon: '🤝',
    branch: 'communication',
    maxLevel: 3,
    requires: ['comm_persuasion'],
    effects: [
      { type: 'daily_gold_passive', value: 3, perLevel: 3, descriptionKey: 'comm_networking_eff' },
    ],
    position: { row: 2, col: 0 },
  },
  {
    id: 'comm_negotiation',
    nameKey: 'comm_negotiation',
    descriptionKey: 'comm_negotiation',
    icon: '⚖️',
    branch: 'communication',
    maxLevel: 3,
    requires: ['comm_networking'],
    effects: [
      { type: 'gold_bonus_percent', value: 10, perLevel: 10, descriptionKey: 'comm_negotiation_eff' },
    ],
    position: { row: 1, col: 0 },
  },
  {
    id: 'comm_leadership',
    nameKey: 'comm_leadership',
    descriptionKey: 'comm_leadership',
    icon: '👑',
    branch: 'communication',
    maxLevel: 3,
    requires: ['comm_negotiation'],
    effects: [
      { type: 'boss_damage_bonus', value: 10, perLevel: 10, descriptionKey: 'comm_leadership_eff1' },
      { type: 'mission_slot', value: 1, perLevel: 0, descriptionKey: 'comm_leadership_eff2' },
    ],
    position: { row: 0, col: 0 },
  },

  // === INTELLECT ===
  {
    id: 'int_learning',
    nameKey: 'int_learning',
    descriptionKey: 'int_learning',
    icon: '📚',
    branch: 'intellect',
    maxLevel: 3,
    requires: [],
    effects: [
      { type: 'xp_bonus_percent', value: 5, perLevel: 5, descriptionKey: 'int_learning_eff' },
    ],
    position: { row: 3, col: 1 },
  },
  {
    id: 'int_analytics',
    nameKey: 'int_analytics',
    descriptionKey: 'int_analytics',
    icon: '📊',
    branch: 'intellect',
    maxLevel: 3,
    requires: ['int_learning'],
    effects: [
      { type: 'crit_chance_percent', value: 5, perLevel: 5, descriptionKey: 'int_analytics_eff' },
    ],
    position: { row: 2, col: 1 },
  },
  {
    id: 'int_strategy',
    nameKey: 'int_strategy',
    descriptionKey: 'int_strategy',
    icon: '♟️',
    branch: 'intellect',
    maxLevel: 3,
    requires: ['int_analytics'],
    effects: [
      { type: 'xp_bonus_flat', value: 20, perLevel: 20, descriptionKey: 'int_strategy_eff' },
    ],
    position: { row: 1, col: 1 },
  },
  {
    id: 'int_focus',
    nameKey: 'int_focus',
    descriptionKey: 'int_focus',
    icon: '🔬',
    branch: 'intellect',
    maxLevel: 3,
    requires: ['int_strategy'],
    effects: [
      { type: 'xp_multiplier_actions', value: 15, perLevel: 15, descriptionKey: 'int_focus_eff' },
    ],
    position: { row: 0, col: 1 },
  },

  // === DISCIPLINE ===
  {
    id: 'disc_habits',
    nameKey: 'disc_habits',
    descriptionKey: 'disc_habits',
    icon: '🔄',
    branch: 'discipline',
    maxLevel: 3,
    requires: [],
    effects: [
      { type: 'xp_bonus_flat', value: 5, perLevel: 5, descriptionKey: 'disc_habits_eff' },
    ],
    position: { row: 3, col: 2 },
  },
  {
    id: 'disc_time',
    nameKey: 'disc_time',
    descriptionKey: 'disc_time',
    icon: '⏰',
    branch: 'discipline',
    maxLevel: 3,
    requires: ['disc_habits'],
    effects: [
      { type: 'xp_bonus_percent', value: 10, perLevel: 10, descriptionKey: 'disc_time_eff' },
    ],
    position: { row: 2, col: 2 },
  },
  {
    id: 'disc_endurance',
    nameKey: 'disc_endurance',
    descriptionKey: 'disc_endurance',
    icon: '🏋️',
    branch: 'discipline',
    maxLevel: 3,
    requires: ['disc_time'],
    effects: [
      { type: 'penalty_reduction_percent', value: 10, perLevel: 10, descriptionKey: 'disc_endurance_eff' },
    ],
    position: { row: 1, col: 2 },
  },
  {
    id: 'disc_recovery',
    nameKey: 'disc_recovery',
    descriptionKey: 'disc_recovery',
    icon: '💎',
    branch: 'discipline',
    maxLevel: 3,
    requires: ['disc_endurance'],
    effects: [
      { type: 'streak_shield_days', value: 1, perLevel: 1, descriptionKey: 'disc_recovery_eff' },
    ],
    position: { row: 0, col: 2 },
  },

  // === PRECISION ===
  {
    id: 'prec_planning',
    nameKey: 'prec_planning',
    descriptionKey: 'prec_planning',
    icon: '📋',
    branch: 'precision',
    maxLevel: 3,
    requires: [],
    effects: [
      { type: 'gold_bonus_flat', value: 5, perLevel: 5, descriptionKey: 'prec_planning_eff' },
    ],
    position: { row: 3, col: 3 },
  },
  {
    id: 'prec_priorities',
    nameKey: 'prec_priorities',
    descriptionKey: 'prec_priorities',
    icon: '🎖️',
    branch: 'precision',
    maxLevel: 3,
    requires: ['prec_planning'],
    effects: [
      { type: 'xp_bonus_percent', value: 15, perLevel: 15, descriptionKey: 'prec_priorities_eff' },
    ],
    position: { row: 2, col: 3 },
  },
  {
    id: 'prec_efficiency',
    nameKey: 'prec_efficiency',
    descriptionKey: 'prec_efficiency',
    icon: '⚙️',
    branch: 'precision',
    maxLevel: 3,
    requires: ['prec_priorities'],
    effects: [
      { type: 'shop_discount_percent', value: 5, perLevel: 5, descriptionKey: 'prec_efficiency_eff' },
    ],
    position: { row: 1, col: 3 },
  },
  {
    id: 'prec_mastery',
    nameKey: 'prec_mastery',
    descriptionKey: 'prec_mastery',
    icon: '💠',
    branch: 'precision',
    maxLevel: 3,
    requires: ['prec_efficiency'],
    effects: [
      { type: 'gold_bonus_percent', value: 25, perLevel: 25, descriptionKey: 'prec_mastery_eff' },
    ],
    position: { row: 0, col: 3 },
  },

  // === WILLPOWER ===
  {
    id: 'will_stress',
    nameKey: 'will_stress',
    descriptionKey: 'will_stress',
    icon: '🧊',
    branch: 'willpower',
    maxLevel: 3,
    requires: [],
    effects: [
      { type: 'penalty_reduction_percent', value: 8, perLevel: 8, descriptionKey: 'will_stress_eff' },
    ],
    position: { row: 3, col: 4 },
  },
  {
    id: 'will_risk',
    nameKey: 'will_risk',
    descriptionKey: 'will_risk',
    icon: '🎲',
    branch: 'willpower',
    maxLevel: 3,
    requires: ['will_stress'],
    effects: [
      { type: 'crit_chance_percent', value: 3, perLevel: 3, descriptionKey: 'will_risk_eff' },
    ],
    position: { row: 2, col: 4 },
  },
  {
    id: 'will_adapt',
    nameKey: 'will_adapt',
    descriptionKey: 'will_adapt',
    icon: '🦎',
    branch: 'willpower',
    maxLevel: 3,
    requires: ['will_risk'],
    effects: [
      { type: 'xp_bonus_percent', value: 2, perLevel: 2, descriptionKey: 'will_adapt_eff' },
    ],
    position: { row: 1, col: 4 },
  },
  {
    id: 'will_tenacity',
    nameKey: 'will_tenacity',
    descriptionKey: 'will_tenacity',
    icon: '💪',
    branch: 'willpower',
    maxLevel: 3,
    requires: ['will_adapt'],
    effects: [
      { type: 'boss_damage_bonus', value: 15, perLevel: 15, descriptionKey: 'will_tenacity_eff' },
    ],
    position: { row: 0, col: 4 },
  },

  // === DEFENSE ===
  {
    id: 'def_finance',
    nameKey: 'def_finance',
    descriptionKey: 'def_finance',
    icon: '🏦',
    branch: 'defense',
    maxLevel: 3,
    requires: [],
    effects: [
      { type: 'daily_gold_passive', value: 5, perLevel: 5, descriptionKey: 'def_finance_eff' },
    ],
    position: { row: 3, col: 5 },
  },
  {
    id: 'def_health',
    nameKey: 'def_health',
    descriptionKey: 'def_health',
    icon: '❤️',
    branch: 'defense',
    maxLevel: 3,
    requires: ['def_finance'],
    effects: [
      { type: 'penalty_reduction_percent', value: 15, perLevel: 15, descriptionKey: 'def_health_eff' },
    ],
    position: { row: 2, col: 5 },
  },
  {
    id: 'def_balance',
    nameKey: 'def_balance',
    descriptionKey: 'def_balance',
    icon: '☯️',
    branch: 'defense',
    maxLevel: 3,
    requires: ['def_health'],
    effects: [
      { type: 'streak_shield_days', value: 1, perLevel: 1, descriptionKey: 'def_balance_eff1' },
      { type: 'xp_bonus_flat', value: 5, perLevel: 5, descriptionKey: 'def_balance_eff2' },
    ],
    position: { row: 1, col: 5 },
  },
  {
    id: 'def_fortress',
    nameKey: 'def_fortress',
    descriptionKey: 'def_fortress',
    icon: '🏰',
    branch: 'defense',
    maxLevel: 3,
    requires: ['def_balance'],
    effects: [
      { type: 'penalty_reduction_percent', value: 20, perLevel: 20, descriptionKey: 'def_fortress_eff1' },
      { type: 'daily_gold_passive', value: 10, perLevel: 10, descriptionKey: 'def_fortress_eff2' },
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
  availablePoints: number,
  t?: TranslationDictionary
): { can: boolean; reason: string } {
  const node = getSkillNode(nodeId);
  if (!node) return { can: false, reason: t?.skillTreeLib.canAllocateReasons.notFound ?? 'Skill not found' };

  const currentLevel = allocated[nodeId] || 0;
  if (currentLevel >= node.maxLevel) return { can: false, reason: t?.skillTreeLib.canAllocateReasons.maxLevel ?? 'Max level' };
  if (availablePoints <= 0) return { can: false, reason: t?.skillTreeLib.canAllocateReasons.noPoints ?? 'No skill points' };

  for (const reqId of node.requires) {
    const reqLevel = allocated[reqId] || 0;
    if (reqLevel === 0) {
      const reqNode = getSkillNode(reqId);
      const reqName = t ? getSkillName(reqId, t) : (reqNode?.nameKey || reqId);
      return { can: false, reason: t?.skillTreeLib.canAllocateReasons.requires(reqName) ?? `Requires: ${reqName}` };
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
  return Math.max(level - 1, 0);
}

export function getUsedPoints(allocated: Record<string, number>): number {
  return Object.values(allocated).reduce((sum, lvl) => sum + lvl, 0);
}