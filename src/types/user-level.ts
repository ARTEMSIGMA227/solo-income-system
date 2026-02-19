export interface UserLevel {
  id: string;
  xp: number;
  level: number;
  xp_to_next_level: number;
  created_at: string;
  updated_at: string;
}

export interface AddXPResult {
  xp: number;
  level: number;
  xp_to_next_level: number;
  leveled_up: boolean;
  old_level: number;
}

export interface AddXPRequest {
  amount: number;
  reason?: string;
}