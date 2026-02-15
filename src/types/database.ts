export interface Profile {
  id: string;
  display_name: string;
  timezone: string;
  daily_income_target: number;
  monthly_income_target: number;
  daily_actions_target: number;
  penalty_xp: number;
  streak_current: number;
  streak_best: number;
  consecutive_misses: number;
  focus_duration_minutes: number;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  id: string;
  user_id: string;
  level: number;
  current_xp: number;
  total_xp_earned: number;
  total_xp_lost: number;
  total_sales: number;
  total_clients: number;
  total_income: number;
  total_actions: number;
  gold: number;
  total_gold_earned: number;
  total_gold_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Quest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  quest_type: 'daily_mandatory' | 'daily_optional' | 'weekly' | 'custom';
  category: 'income_action' | 'strategy' | 'skill' | 'fitness' | 'other';
  xp_reward: number;
  is_template: boolean;
  target_count: number;
  is_active: boolean;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  category: 'income_action' | 'strategy' | 'skill' | 'fitness' | 'other';
  frequency: 'daily' | 'weekday' | 'weekly';
  xp_reward: number;
  streak_current: number;
  streak_best: number;
  is_active: boolean;
  created_at: string;
}

export interface Completion {
  id: string;
  user_id: string;
  quest_id: string | null;
  habit_id: string | null;
  completion_date: string;
  count_done: number;
  notes: string | null;
  created_at: string;
  synced: boolean;
  offline_id: string | null;
}

export interface XPEvent {
  id: string;
  user_id: string;
  event_type:
    | 'action'
    | 'task'
    | 'hard_task'
    | 'sale'
    | 'client_closed'
    | 'daily_complete'
    | 'overperform_bonus'
    | 'boss_killed'
    | 'penalty_miss'
    | 'penalty_streak'
    | 'perk_bonus'
    | 'focus_bonus'
    | 'manual_adjustment';
  xp_amount: number;
  multiplier: number;
  description: string | null;
  reference_id: string | null;
  event_date: string;
  created_at: string;
}

export interface Boss {
  id: string;
  user_id: string;
  title: string;
  boss_type: 'weekly' | 'monthly';
  description: string | null;
  requirements: BossRequirement[];
  xp_reward: number;
  is_defeated: boolean;
  deadline: string;
  defeated_at: string | null;
  created_at: string;
}

export interface BossRequirement {
  metric: 'actions' | 'clients' | 'income' | 'sales';
  target: number;
}

export interface PerkUnlock {
  id: string;
  user_id: string;
  perk_key: string;
  unlocked_at_level: number;
  is_active: boolean;
  created_at: string;
}

export interface IncomeEvent {
  id: string;
  user_id: string;
  amount: number;
  source: 'sale' | 'contract' | 'freelance' | 'bonus' | 'other';
  client_name: string | null;
  description: string | null;
  event_date: string;
  created_at: string;
}

export interface DailySummary {
  id: string;
  user_id: string;
  summary_date: string;
  total_actions: number;
  mandatory_completed: boolean;
  xp_earned: number;
  xp_lost: number;
  income_today: number;
  status: 'green' | 'yellow' | 'red' | 'pending';
  multiplier_applied: number;
  notes: string | null;
  created_at: string;
}

export interface CharacterConfig {
  id: string;
  user_id: string;
  use_custom_image: boolean;
  custom_image_url: string | null;
  body_type: string;
  skin_color: string;
  hair_style: string;
  hair_color: string;
  eye_color: string;
  outfit_color: string;
  level_images: LevelImages;
  created_at: string;
  updated_at: string;
}

export interface LevelImages {
  novice?: string;
  hunter?: string;
  warrior?: string;
  knight?: string;
  srank?: string;
  monarch?: string;
}

export interface ShopItem {
  id: string;
  item_key: string;
  name: string;
  description: string;
  category: 'potion' | 'artifact' | 'scroll';
  price: number;
  icon: string;
  effect_type: string;
  effect_value: number;
  duration_hours: number | null;
  max_stack: number;
  min_level: number;
  is_available: boolean;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_key: string;
  quantity: number;
  is_active: boolean;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface GoldEvent {
  id: string;
  user_id: string;
  amount: number;
  event_type: string;
  description: string | null;
  event_date: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
}