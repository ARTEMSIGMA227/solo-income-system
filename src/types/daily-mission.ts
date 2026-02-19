export const MISSION_TYPES = [
  "complete_quests",
  "focus_minutes",
  "earn_income",
  "login_streak",
  "boss_damage",
] as const;
export type MissionType = (typeof MISSION_TYPES)[number];

export const MISSION_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type MissionDifficulty = (typeof MISSION_DIFFICULTIES)[number];

export interface DailyMission {
  id: string;
  slug: string;
  title: string;
  description: string;
  emoji: string;
  mission_type: MissionType;
  target_value: number;
  xp_reward: number;
  gold_reward: number;
  difficulty: MissionDifficulty;
  is_active: boolean;
  created_at: string;
}

export interface UserDailyMission {
  id: string;
  user_id: string;
  mission_id: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  assigned_date: string;
  completed_at: string | null;
  claimed_at: string | null;
  created_at: string;
  mission: DailyMission;
}

export interface ClaimResult {
  xp_awarded: number;
  gold_awarded: number;
  all_completed_bonus: boolean;
  leveled_up: boolean;
  new_level: number;
}

export const DIFFICULTY_CONFIG: Record<
  MissionDifficulty,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  easy: {
    label: "Лёгкая",
    color: "text-emerald-400",
    bgColor: "bg-emerald-600/20",
    borderColor: "border-emerald-500/30",
  },
  medium: {
    label: "Средняя",
    color: "text-yellow-400",
    bgColor: "bg-yellow-600/20",
    borderColor: "border-yellow-500/30",
  },
  hard: {
    label: "Сложная",
    color: "text-red-400",
    bgColor: "bg-red-600/20",
    borderColor: "border-red-500/30",
  },
};

export const ALL_COMPLETE_BONUS_XP = 50;