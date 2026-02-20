export type TerritoryStatus = 'locked' | 'foggy' | 'available' | 'in_progress' | 'captured';

export type BiomeType = 'plains' | 'forest' | 'desert' | 'mountain' | 'swamp' | 'snow' | 'magical' | 'crystal';

export interface TerritoryReward {
  type: 'xp_bonus' | 'gold_bonus' | 'passive_gold' | 'skill_points' | 'title';
  value: number | string;
  label: string;
}

export interface TerritoryRequirement {
  type: 'level' | 'skill_branch' | 'territory' | 'streak';
  value: string | number;
  label: string;
}

export interface TerritoryConnection {
  targetId: string;
  bidirectional: boolean;
}

export interface Territory {
  id: string;
  name: string;
  description: string;
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
  lore: string;
}

export const BIOME_CONFIG: Record<BiomeType, {
  label: string;
  accent: string;
  bgTint: string;
}> = {
  plains:  { label: 'Равнины',           accent: '#7cb342', bgTint: 'rgba(124,179,66,0.06)' },
  forest:  { label: 'Лес',              accent: '#4a7c2e', bgTint: 'rgba(74,124,46,0.06)' },
  desert:  { label: 'Пустыня',          accent: '#c49a3c', bgTint: 'rgba(196,154,60,0.06)' },
  mountain:{ label: 'Горы',             accent: '#8d7b6b', bgTint: 'rgba(141,123,107,0.06)' },
  swamp:   { label: 'Болота',           accent: '#5e7a5e', bgTint: 'rgba(94,122,94,0.06)' },
  snow:    { label: 'Снежные вершины',  accent: '#a8b8c8', bgTint: 'rgba(168,184,200,0.06)' },
  magical: { label: 'Магические земли', accent: '#8b6cc1', bgTint: 'rgba(139,108,193,0.06)' },
  crystal: { label: 'Кристальный',      accent: '#d46ca8', bgTint: 'rgba(212,108,168,0.06)' },
};

export const TERRITORIES: Territory[] = [
  {
    id: 'starter_village',
    name: 'Деревня Начала',
    description: 'Место, где начинается путь каждого охотника за доходом.',
    icon: '🏘️',
    color: '#22c55e',
    bgGradient: 'from-green-900/40 to-green-800/20',
    biome: 'plains',
    position: { x: 50, y: 85 },
    requiredXP: 500,
    maxLevel: 5,
    requirements: [],
    rewards: [
      { type: 'xp_bonus', value: 5, label: '+5% XP ко всем действиям' },
      { type: 'gold_bonus', value: 50, label: '50 🪙 за захват' },
    ],
    connections: [
      { targetId: 'trade_outpost', bidirectional: true },
      { targetId: 'discipline_fort', bidirectional: true },
    ],
    skillBranch: null,
    lore: 'Тихая деревня на краю мира. Здесь ты делаешь первые шаги к величию.',
  },
  {
    id: 'trade_outpost',
    name: 'Торговый Аванпост',
    description: 'Центр коммерции. Навыки продаж решают всё.',
    icon: '🏪',
    color: '#f59e0b',
    bgGradient: 'from-amber-900/40 to-amber-800/20',
    biome: 'forest',
    position: { x: 25, y: 65 },
    requiredXP: 1000,
    maxLevel: 5,
    requirements: [
      { type: 'territory', value: 'starter_village', label: 'Захватить Деревню Начала' },
      { type: 'level', value: 3, label: 'Уровень 3+' },
    ],
    rewards: [
      { type: 'gold_bonus', value: 10, label: '+10% 🪙 за продажи' },
      { type: 'passive_gold', value: 5, label: '+5 🪙/день пассивно' },
    ],
    connections: [
      { targetId: 'starter_village', bidirectional: true },
      { targetId: 'intellect_library', bidirectional: true },
      { targetId: 'shadow_market', bidirectional: true },
    ],
    skillBranch: 'communication',
    lore: 'Торговцы со всего мира стекаются сюда. Кто владеет словом — владеет золотом.',
  },
  {
    id: 'discipline_fort',
    name: 'Форт Дисциплины',
    description: 'Военная крепость. Только системные действия приносят результат.',
    icon: '🏰',
    color: '#ef4444',
    bgGradient: 'from-red-900/40 to-red-800/20',
    biome: 'mountain',
    position: { x: 75, y: 65 },
    requiredXP: 1000,
    maxLevel: 5,
    requirements: [
      { type: 'territory', value: 'starter_village', label: 'Захватить Деревню Начала' },
      { type: 'streak', value: 3, label: 'Streak 3+ дней' },
    ],
    rewards: [
      { type: 'xp_bonus', value: 10, label: '+10% XP за дисциплину' },
      { type: 'title', value: 'Страж Форта', label: 'Титул "Страж Форта"' },
    ],
    connections: [
      { targetId: 'starter_village', bidirectional: true },
      { targetId: 'willpower_peak', bidirectional: true },
      { targetId: 'precision_workshop', bidirectional: true },
    ],
    skillBranch: 'discipline',
    lore: 'Здесь тренируются самые стойкие. Каждый день — бой с собой.',
  },
  {
    id: 'intellect_library',
    name: 'Библиотека Знаний',
    description: 'Хранилище мудрости. Учись, чтобы зарабатывать умнее.',
    icon: '📚',
    color: '#6366f1',
    bgGradient: 'from-indigo-900/40 to-indigo-800/20',
    biome: 'magical',
    position: { x: 15, y: 40 },
    requiredXP: 1500,
    maxLevel: 5,
    requirements: [
      { type: 'territory', value: 'trade_outpost', label: 'Захватить Торговый Аванпост' },
      { type: 'skill_branch', value: 'intellect', label: 'Интеллект: 2+ навыка' },
    ],
    rewards: [
      { type: 'xp_bonus', value: 15, label: '+15% XP за обучение' },
      { type: 'skill_points', value: 1, label: '+1 очко навыка' },
    ],
    connections: [
      { targetId: 'trade_outpost', bidirectional: true },
      { targetId: 'crystal_citadel', bidirectional: true },
    ],
    skillBranch: 'intellect',
    lore: 'Бесконечные полки книг. Знание — самая выгодная инвестиция.',
  },
  {
    id: 'willpower_peak',
    name: 'Пик Силы Воли',
    description: 'Горная вершина. Только сильнейшие духом достигают её.',
    icon: '⛰️',
    color: '#8b5cf6',
    bgGradient: 'from-violet-900/40 to-violet-800/20',
    biome: 'snow',
    position: { x: 85, y: 40 },
    requiredXP: 1500,
    maxLevel: 5,
    requirements: [
      { type: 'territory', value: 'discipline_fort', label: 'Захватить Форт Дисциплины' },
      { type: 'level', value: 5, label: 'Уровень 5+' },
    ],
    rewards: [
      { type: 'xp_bonus', value: 10, label: '+10% XP за streak' },
      { type: 'passive_gold', value: 10, label: '+10 🪙/день пассивно' },
    ],
    connections: [
      { targetId: 'discipline_fort', bidirectional: true },
      { targetId: 'crystal_citadel', bidirectional: true },
    ],
    skillBranch: 'willpower',
    lore: 'Ветра здесь сбивают с ног, но вид с вершины стоит каждого шага.',
  },
  {
    id: 'precision_workshop',
    name: 'Мастерская Точности',
    description: 'Кузница мастерства. Детали решают исход.',
    icon: '⚙️',
    color: '#06b6d4',
    bgGradient: 'from-cyan-900/40 to-cyan-800/20',
    biome: 'desert',
    position: { x: 60, y: 40 },
    requiredXP: 1200,
    maxLevel: 5,
    requirements: [
      { type: 'territory', value: 'discipline_fort', label: 'Захватить Форт Дисциплины' },
      { type: 'skill_branch', value: 'precision', label: 'Точность: 1+ навык' },
    ],
    rewards: [
      { type: 'xp_bonus', value: 8, label: '+8% XP за точные действия' },
      { type: 'gold_bonus', value: 5, label: '+5% 🪙 бонус' },
    ],
    connections: [
      { targetId: 'discipline_fort', bidirectional: true },
      { targetId: 'crystal_citadel', bidirectional: true },
    ],
    skillBranch: 'precision',
    lore: 'Каждая шестерёнка на своём месте. Мастерство не терпит небрежности.',
  },
  {
    id: 'shadow_market',
    name: 'Теневой Рынок',
    description: 'Скрытые сделки и секретные бонусы для посвящённых.',
    icon: '🌑',
    color: '#71717a',
    bgGradient: 'from-zinc-900/40 to-zinc-800/20',
    biome: 'swamp',
    position: { x: 30, y: 20 },
    requiredXP: 2000,
    maxLevel: 5,
    requirements: [
      { type: 'territory', value: 'trade_outpost', label: 'Захватить Торговый Аванпост' },
      { type: 'territory', value: 'intellect_library', label: 'Захватить Библиотеку Знаний' },
      { type: 'level', value: 7, label: 'Уровень 7+' },
    ],
    rewards: [
      { type: 'gold_bonus', value: 20, label: '+20% 🪙 за скрытые действия' },
      { type: 'title', value: 'Теневой Торговец', label: 'Титул "Теневой Торговец"' },
    ],
    connections: [
      { targetId: 'trade_outpost', bidirectional: true },
      { targetId: 'crystal_citadel', bidirectional: true },
    ],
    skillBranch: 'defense',
    lore: 'Не все пути к богатству освещены солнцем. Тени знают свои секреты.',
  },
  {
    id: 'crystal_citadel',
    name: 'Кристальная Цитадель',
    description: 'Финальная территория. Вершина мастерства и дохода.',
    icon: '💎',
    color: '#ec4899',
    bgGradient: 'from-pink-900/40 to-fuchsia-900/20',
    biome: 'crystal',
    position: { x: 50, y: 5 },
    requiredXP: 5000,
    maxLevel: 5,
    requirements: [
      { type: 'territory', value: 'intellect_library', label: 'Захватить Библиотеку Знаний' },
      { type: 'territory', value: 'willpower_peak', label: 'Захватить Пик Силы Воли' },
      { type: 'territory', value: 'precision_workshop', label: 'Захватить Мастерскую Точности' },
      { type: 'territory', value: 'shadow_market', label: 'Захватить Теневой Рынок' },
      { type: 'level', value: 10, label: 'Уровень 10+' },
    ],
    rewards: [
      { type: 'xp_bonus', value: 25, label: '+25% XP ко всему' },
      { type: 'passive_gold', value: 25, label: '+25 🪙/день пассивно' },
      { type: 'title', value: 'Повелитель Цитадели', label: 'Титул "Повелитель Цитадели"' },
    ],
    connections: [
      { targetId: 'intellect_library', bidirectional: true },
      { targetId: 'willpower_peak', bidirectional: true },
      { targetId: 'precision_workshop', bidirectional: true },
      { targetId: 'shadow_market', bidirectional: true },
    ],
    skillBranch: null,
    lore: 'Цитадель сияет кристальным светом. Только достигший вершины во всём может войти.',
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
