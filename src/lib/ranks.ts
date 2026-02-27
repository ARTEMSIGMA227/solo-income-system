export interface HunterRank {
  id: string;
  label: string;
  minLevel: number;
  maxLevel: number;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
  glow?: string;
}

export const HUNTER_RANKS: HunterRank[] = [
  { id: 'E', label: 'E', minLevel: 1, maxLevel: 4, color: '#9CA3AF', bgColor: '#9CA3AF15', borderColor: '#9CA3AF30', emoji: '🗡️' },
  { id: 'D', label: 'D', minLevel: 5, maxLevel: 9, color: '#60A5FA', bgColor: '#60A5FA15', borderColor: '#60A5FA30', emoji: '⚔️' },
  { id: 'C', label: 'C', minLevel: 10, maxLevel: 19, color: '#34D399', bgColor: '#34D39915', borderColor: '#34D39930', emoji: '🏹' },
  { id: 'B', label: 'B', minLevel: 20, maxLevel: 34, color: '#FBBF24', bgColor: '#FBBF2415', borderColor: '#FBBF2430', emoji: '🔥' },
  { id: 'A', label: 'A', minLevel: 35, maxLevel: 49, color: '#F97316', bgColor: '#F9731615', borderColor: '#F9731630', emoji: '⚡' },
  { id: 'S', label: 'S', minLevel: 50, maxLevel: 74, color: '#EF4444', bgColor: '#EF444415', borderColor: '#EF444430', emoji: '👑', glow: '0 0 12px #EF444440' },
  { id: 'SS', label: 'SS', minLevel: 75, maxLevel: 99, color: '#A855F7', bgColor: '#A855F715', borderColor: '#A855F730', emoji: '🌟', glow: '0 0 16px #A855F740' },
  { id: 'SSS', label: 'SSS', minLevel: 100, maxLevel: 999, color: '#FFD700', bgColor: '#FFD70015', borderColor: '#FFD70030', emoji: '🜲', glow: '0 0 20px #FFD70050' },
];

export function getRankByLevel(level: number): HunterRank {
  for (let i = HUNTER_RANKS.length - 1; i >= 0; i--) {
    if (level >= HUNTER_RANKS[i].minLevel) return HUNTER_RANKS[i];
  }
  return HUNTER_RANKS[0];
}

export function getNextRank(level: number): HunterRank | null {
  const current = getRankByLevel(level);
  const idx = HUNTER_RANKS.findIndex(r => r.id === current.id);
  return idx < HUNTER_RANKS.length - 1 ? HUNTER_RANKS[idx + 1] : null;
}

export function getRankProgress(level: number): number {
  const rank = getRankByLevel(level);
  const next = getNextRank(level);
  if (!next) return 100;
  const total = next.minLevel - rank.minLevel;
  const current = level - rank.minLevel;
  return Math.min(100, Math.round((current / total) * 100));
}

export interface HunterPerk {
  id: string;
  unlockLevel: number;
  emoji: string;
  category: 'analytics' | 'ai' | 'planning' | 'boost' | 'special';
}

export const HUNTER_PERKS: HunterPerk[] = [
  { id: 'basic_analytics', unlockLevel: 5, emoji: '📊', category: 'analytics' },
  { id: 'ai_advisor_basic', unlockLevel: 8, emoji: '🤖', category: 'ai' },
  { id: 'extended_analytics', unlockLevel: 12, emoji: '📈', category: 'analytics' },
  { id: 'daily_plan', unlockLevel: 16, emoji: '📋', category: 'planning' },
  { id: 'pdf_export', unlockLevel: 20, emoji: '📄', category: 'analytics' },
  { id: 'ai_advisor_unlimited', unlockLevel: 25, emoji: '🧠', category: 'ai' },
  { id: 'weekly_plan', unlockLevel: 30, emoji: '📅', category: 'planning' },
  { id: 'full_analytics', unlockLevel: 40, emoji: '🔬', category: 'analytics' },
  { id: 'monthly_plan', unlockLevel: 50, emoji: '🗓️', category: 'planning' },
  { id: 'xp_multiplier', unlockLevel: 60, emoji: '⚡', category: 'boost' },
  { id: 'gold_multiplier', unlockLevel: 75, emoji: '💰', category: 'boost' },
  { id: 'shadow_monarch', unlockLevel: 100, emoji: '🜲', category: 'special' },
];

export function getUnlockedPerks(level: number): HunterPerk[] {
  return HUNTER_PERKS.filter(p => level >= p.unlockLevel);
}

export function getLockedPerks(level: number): HunterPerk[] {
  return HUNTER_PERKS.filter(p => level < p.unlockLevel);
}

export function getNextPerk(level: number): HunterPerk | null {
  return HUNTER_PERKS.find(p => p.unlockLevel > level) || null;
}

export function isPerkUnlocked(perkId: string, level: number): boolean {
  const perk = HUNTER_PERKS.find(p => p.id === perkId);
  return perk ? level >= perk.unlockLevel : false;
}