import type { TranslationDictionary } from './i18n/types';

export interface ChallengeTemplate {
  titleKey: string;
  descriptionKey: string;
  xpReward: number;
  targetCount: number;
}

export interface ChallengeResolved {
  title: string;
  description: string;
  xpReward: number;
  targetCount: number;
}

const TEMPLATES: ChallengeTemplate[] = [
  { titleKey: 'calls_10', descriptionKey: 'calls_10', xpReward: 100, targetCount: 10 },
  { titleKey: 'first_sale', descriptionKey: 'first_sale', xpReward: 150, targetCount: 1 },
  { titleKey: 'quests_5', descriptionKey: 'quests_5', xpReward: 75, targetCount: 5 },
  { titleKey: 'action_marathon', descriptionKey: 'action_marathon', xpReward: 100, targetCount: 40 },
  { titleKey: 'no_breaks', descriptionKey: 'no_breaks', xpReward: 80, targetCount: 1 },
  { titleKey: 'touches_3', descriptionKey: 'touches_3', xpReward: 60, targetCount: 3 },
  { titleKey: 'double_hit', descriptionKey: 'double_hit', xpReward: 120, targetCount: 2 },
  { titleKey: 'breakthrough', descriptionKey: 'breakthrough', xpReward: 100, targetCount: 200 },
  { titleKey: 'reflection', descriptionKey: 'reflection', xpReward: 50, targetCount: 1 },
  { titleKey: 'boss_hit', descriptionKey: 'boss_hit', xpReward: 80, targetCount: 1 },
];

export function getDailyChallenge(userId: string, date: string, t: TranslationDictionary): ChallengeResolved {
  // Deterministic random based on date + userId
  let hash = 0;
  const seed = date + userId;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % TEMPLATES.length;
  const template = TEMPLATES[index];

  return {
    title: t.challengesLib.templates.title[template.titleKey] ?? template.titleKey,
    description: t.challengesLib.templates.description[template.descriptionKey] ?? template.descriptionKey,
    xpReward: template.xpReward,
    targetCount: template.targetCount,
  };
}