// src/lib/map-data.ts

export type TerritoryStatus = 'locked' | 'foggy' | 'available' | 'in_progress' | 'captured';

export type BiomeType =
  | 'plains'
  | 'forest'
  | 'desert'
  | 'mountain'
  | 'swamp'
  | 'snow'
  | 'magical'
  | 'crystal';

export interface TerritoryReward {
  type: 'xp_bonus' | 'gold_bonus' | 'passive_gold' | 'skill_points' | 'title';
  value: number | string;
  labelKey: string; // i18n key — resolved at render time
}

export interface TerritoryRequirement {
  type: 'level' | 'skill_branch' | 'territory' | 'streak';
  value: string | number;
  labelKey: string; // i18n key — resolved at render time
}

export interface TerritoryConnection {
  targetId: string;
  bidirectional: boolean;
}

export interface Territory {
  id: string;
  nameKey: string; // key into t.map.territories_names
  descriptionKey: string; // key into t.map.territories_descriptions
  icon: string;
  color: string;
  bgGradient: string;
  biome: BiomeType;
  position: { x: number; y: number };
  requiredXP: number;
  maxLevel: number;
  requirements: TerritoryRequirement[];
  rewards: TerritoryReward[];
  connections: TerritoryConnection[];
  skillBranch: string | null;
  loreKey: string; // key into t.map.territories_lore
}

export const TERRITORIES: Territory[] = [
  {
    id: 'starter_village',
    nameKey: 'starter_village',
    descriptionKey: 'starter_village',
    icon: '🏘️',
    color: '#22c55e',
    bgGradient: 'from-green-900/40 to-green-800/20',
    biome: 'plains',
    position: { x: 50, y: 85 },
    requiredXP: 500,
    maxLevel: 5,
    requirements: [],
    rewards: [
      { type: 'xp_bonus', value: 5, labelKey: 'xp_bonus_5' },
      { type: 'gold_bonus', value: 50, labelKey: 'gold_bonus_50' },
    ],
    connections: [
      { targetId: 'trade_outpost', bidirectional: true },
      { targetId: 'discipline_fort', bidirectional: true },
    ],
    skillBranch: null,
    loreKey: 'starter_village',
  },
  {
    id: 'trade_outpost',
    nameKey: 'trade_outpost',
    descriptionKey: 'trade_outpost',
    icon: '🏪',
    color: '#f59e0b',
    bgGradient: 'from-amber-900/40 to-amber-800/20',
    biome: 'forest',
    position: { x: 25, y: 65 },
    requiredXP: 1000,
    maxLevel: 5,
    requirements: [
      { type: 'territory', value: 'starter_village', labelKey: 'req_capture_starter_village' },
      { type: 'level', value: 3, labelKey: 'req_level_3' },
    ],
    rewards: [
      { type: 'gold_bonus', value: 10, labelKey: 'gold_bonus_10_pct' },
      { type: 'passive_gold', value: 5, labelKey: 'passive_gold_5' },
    ],
    connections: [
      { targetId: 'starter_village', bidirectional: true },
      { targetId: 'intellect_library', bidirectional: true },
      { targetId: 'shadow_market', bidirectional: true },
    ],
    skillBranch: 'communication',
    loreKey: 'trade_outpost',
  },
  {
    id: 'discipline_fort',
    nameKey: 'discipline_fort',
    descriptionKey: 'discipline_fort',
    icon: '🏰',
    color: '#ef4444',
    bgGradient: 'from-red-900/40 to-red-800/20',
    biome: 'mountain',
    position: { x: 75, y: 65 },
    requiredXP: 1000,
    maxLevel: 5,
    requirements: [
      { type: 'territory', value: 'starter_village', labelKey: 'req_capture_starter_village' },
      { type: 'streak', value: 3, labelKey: 'req_streak_3' },
    ],
    rewards: [
      { type: 'xp_bonus', value: 10, labelKey: 'xp_bonus_10' },
      { type: 'title', value: 'fort_guard', labelKey: 'title_fort_guard' },
    ],
    connections: [
      { targetId: 'starter_village', bidirectional: true },
      { targetId: 'willpower_peak', bidirectional: true },
      { targetId: 'precision_workshop', bidirectional: true },
    ],
    skillBranch: 'discipline',
    loreKey: 'discipline_fort',
  },
  {
    id: 'intellect_library',
    nameKey: 'intellect_library',
    descriptionKey: 'intellect_library',
    icon: '📚',
    color: '#6366f1',
    bgGradient: 'from-indigo-900/40 to-indigo-800/20',
    biome: 'magical',
    position: { x: 15, y: 40 },
    requiredXP: 1500,
    maxLevel: 5,
    requirements: [
      { type: 'territory', value: 'trade_outpost', labelKey: 'req_capture_trade_outpost' },
      { type: 'skill_branch', value: 'intellect', labelKey: 'req_skill_intellect_2' },
    ],
    rewards: [
      { type: 'xp_bonus', value: 15, labelKey: 'xp_bonus_15' },
      { type: 'skill_points', value: 1, labelKey: 'skill_point_1' },
    ],
    connections: [
      { targetId: 'trade_outpost', bidirectional: true },
      { targetId: 'crystal_citadel', bidirectional: true },
    ],
    skillBranch: 'intellect',
    loreKey: 'intellect_library',
  },
  {
    id: 'willpower_peak',
    nameKey: 'willpower_peak',
    descriptionKey: 'willpower_peak',
    icon: '⛰️',
    color: '#8b5cf6',
    bgGradient: 'from-violet-900/40 to-violet-800/20',
    biome: 'snow',
    position: { x: 85, y: 40 },
    requiredXP: 1500,
    maxLevel: 5,
    requirements: [
      { type: 'territory', value: 'discipline_fort', labelKey: 'req_capture_discipline_fort' },
      { type: 'level', value: 5, labelKey: 'req_level_5' },
    ],
    rewards: [
      { type: 'xp_bonus', value: 10, labelKey: 'xp_bonus_10_streak' },
      { type: 'passive_gold', value: 10, labelKey: 'passive_gold_10' },
    ],
    connections: [
      { targetId: 'discipline_fort', bidirectional: true },
      { targetId: 'crystal_citadel', bidirectional: true },
    ],
    skillBranch: 'willpower',
    loreKey: 'willpower_peak',
  },
  {
    id: 'precision_workshop',
    nameKey: 'precision_workshop',
    descriptionKey: 'precision_workshop',
    icon: '⚙️',
    color: '#06b6d4',
    bgGradient: 'from-cyan-900/40 to-cyan-800/20',
    biome: 'desert',
    position: { x: 60, y: 40 },
    requiredXP: 1200,
    maxLevel: 5,
    requirements: [
      { type: 'territory', value: 'discipline_fort', labelKey: 'req_capture_discipline_fort' },
      { type: 'skill_branch', value: 'precision', labelKey: 'req_skill_precision_1' },
    ],
    rewards: [
      { type: 'xp_bonus', value: 8, labelKey: 'xp_bonus_8' },
      { type: 'gold_bonus', value: 5, labelKey: 'gold_bonus_5_pct' },
    ],
    connections: [
      { targetId: 'discipline_fort', bidirectional: true },
      { targetId: 'crystal_citadel', bidirectional: true },
    ],
    skillBranch: 'precision',
    loreKey: 'precision_workshop',
  },
  {
    id: 'shadow_market',
    nameKey: 'shadow_market',
    descriptionKey: 'shadow_market',
    icon: '🌑',
    color: '#71717a',
    bgGradient: 'from-zinc-900/40 to-zinc-800/20',
    biome: 'swamp',
    position: { x: 30, y: 20 },
    requiredXP: 2000,
    maxLevel: 5,
    requirements: [
      { type: 'territory', value: 'trade_outpost', labelKey: 'req_capture_trade_outpost' },
      { type: 'territory', value: 'intellect_library', labelKey: 'req_capture_intellect_library' },
      { type: 'level', value: 7, labelKey: 'req_level_7' },
    ],
    rewards: [
      { type: 'gold_bonus', value: 20, labelKey: 'gold_bonus_20_pct' },
      { type: 'title', value: 'shadow_trader', labelKey: 'title_shadow_trader' },
    ],
    connections: [
      { targetId: 'trade_outpost', bidirectional: true },
      { targetId: 'crystal_citadel', bidirectional: true },
    ],
    skillBranch: 'defense',
    loreKey: 'shadow_market',
  },
  {
    id: 'crystal_citadel',
    nameKey: 'crystal_citadel',
    descriptionKey: 'crystal_citadel',
    icon: '💎',
    color: '#ec4899',
    bgGradient: 'from-pink-900/40 to-fuchsia-900/20',
    biome: 'crystal',
    position: { x: 50, y: 5 },
    requiredXP: 5000,
    maxLevel: 5,
    requirements: [
      { type: 'territory', value: 'intellect_library', labelKey: 'req_capture_intellect_library' },
      { type: 'territory', value: 'willpower_peak', labelKey: 'req_capture_willpower_peak' },
      { type: 'territory', value: 'precision_workshop', labelKey: 'req_capture_precision_workshop' },
      { type: 'territory', value: 'shadow_market', labelKey: 'req_capture_shadow_market' },
      { type: 'level', value: 10, labelKey: 'req_level_10' },
    ],
    rewards: [
      { type: 'xp_bonus', value: 25, labelKey: 'xp_bonus_25' },
      { type: 'passive_gold', value: 25, labelKey: 'passive_gold_25' },
      { type: 'title', value: 'citadel_lord', labelKey: 'title_citadel_lord' },
    ],
    connections: [
      { targetId: 'intellect_library', bidirectional: true },
      { targetId: 'willpower_peak', bidirectional: true },
      { targetId: 'precision_workshop', bidirectional: true },
      { targetId: 'shadow_market', bidirectional: true },
    ],
    skillBranch: null,
    loreKey: 'crystal_citadel',
  },
];

export function getTerritoryById(id: string): Territory | undefined {
  return TERRITORIES.find((t) => t.id === id);
}

export function getConnectedTerritories(id: string): Territory[] {
  const territory = getTerritoryById(id);
  if (!territory) return [];
  const connectedIds = territory.connections.map((c) => c.targetId);
  return TERRITORIES.filter((t) => connectedIds.includes(t.id));
}

export function calculateTerritoryXPForLevel(baseXP: number, level: number): number {
  return Math.floor(baseXP * Math.pow(1.5, level));
}

export const BIOME_CONFIG: Record<BiomeType, { accent: string; label: string }> = {
  plains:   { accent: '#22c55e', label: 'Plains' },
  forest:   { accent: '#16a34a', label: 'Forest' },
  desert:   { accent: '#d97706', label: 'Desert' },
  mountain: { accent: '#ef4444', label: 'Mountain' },
  swamp:    { accent: '#71717a', label: 'Swamp' },
  snow:     { accent: '#8b5cf6', label: 'Snow' },
  magical:  { accent: '#6366f1', label: 'Magical' },
  crystal:  { accent: '#ec4899', label: 'Crystal' },
};