export interface Guild {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  leader_id: string;
  invite_code: string;
  max_members: number;
  total_xp: number;
  level: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuildMember {
  id: string;
  guild_id: string;
  user_id: string;
  role: 'leader' | 'officer' | 'member';
  xp_contributed: number;
  joined_at: string;
}

export interface GuildMemberWithProfile extends GuildMember {
  email?: string;
  display_name?: string;
}

export interface GuildMessage {
  id: string;
  guild_id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name?: string;
}

export interface GuildQuest {
  id: string;
  guild_id: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  xp_reward: number;
  gold_reward: number;
  status: 'active' | 'completed' | 'failed' | 'expired';
  expires_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface GuildQuestContribution {
  id: string;
  quest_id: string;
  user_id: string;
  value: number;
  created_at: string;
}

export interface GuildJoinRequest {
  id: string;
  guild_id: string;
  user_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  resolved_at: string | null;
}

export interface GuildWithMembers extends Guild {
  member_count: number;
  members: GuildMemberWithProfile[];
}

export interface CreateGuildInput {
  name: string;
  description?: string;
  is_public?: boolean;
  max_members?: number;
}

export interface CreateGuildQuestInput {
  title: string;
  description?: string;
  target_value: number;
  xp_reward: number;
  gold_reward: number;
  expires_at?: string;
}