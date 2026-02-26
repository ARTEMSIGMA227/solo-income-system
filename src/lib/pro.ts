export const PRO_LIMITS = {
  FREE_MAX_SKILLS: 5,
  FREE_MAX_GOALS_PER_SKILL: 10,
  PRO_MAX_SKILLS: 100,
  PRO_MAX_GOALS_PER_SKILL: 100,
};

export function canCreateSkill(skillCount: number, isPro: boolean): boolean {
  return isPro || skillCount < PRO_LIMITS.FREE_MAX_SKILLS;
}

export function canCreateGoal(goalCount: number, isPro: boolean): boolean {
  return isPro || goalCount < PRO_LIMITS.FREE_MAX_GOALS_PER_SKILL;
}