'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Guild,
  GuildWithMembers,
  GuildMember,
  GuildMessage,
  GuildQuest,
  CreateGuildInput,
  CreateGuildQuestInput,
} from '@/types/guilds';

interface RequestWithName {
  id: string;
  guild_id: string;
  user_id: string;
  message: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  display_name?: string;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Ошибка');
  return data as T;
}

// Моя гильдия
export function useMyGuild() {
  return useQuery({
    queryKey: ['my-guild'],
    queryFn: () =>
      fetchJSON<{ guild: GuildWithMembers | null; membership: GuildMember | null }>('/api/guilds/my'),
  });
}

// Список публичных гильдий
export function usePublicGuilds(search?: string) {
  return useQuery({
    queryKey: ['public-guilds', search],
    queryFn: () => {
      const params = new URLSearchParams({ public: 'true' });
      if (search) params.set('search', search);
      return fetchJSON<(Guild & { member_count: number })[]>(`/api/guilds?${params}`);
    },
  });
}

// Создать гильдию
export function useCreateGuild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGuildInput) =>
      fetchJSON<Guild>('/api/guilds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-guild'] });
      void queryClient.invalidateQueries({ queryKey: ['public-guilds'] });
    },
  });
}

// Вступить в гильдию
export function useJoinGuild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { guild_id?: string; invite_code?: string }) =>
      fetchJSON<{ success: boolean; joined?: boolean; request_sent?: boolean }>('/api/guilds/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-guild'] });
      void queryClient.invalidateQueries({ queryKey: ['public-guilds'] });
    },
  });
}

// Покинуть гильдию
export function useLeaveGuild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJSON<{ success: boolean }>('/api/guilds/leave', { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-guild'] });
    },
  });
}

// Управление участниками
export function useManageMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { member_id: string; action: 'kick' | 'promote'; role?: 'officer' | 'member' }) =>
      fetchJSON<{ success: boolean }>('/api/guilds/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-guild'] });
    },
  });
}

// Заявки
export function useGuildRequests() {
  return useQuery({
    queryKey: ['guild-requests'],
    queryFn: () => fetchJSON<RequestWithName[]>('/api/guilds/requests'),
    refetchInterval: 10000,
  });
}

export function useHandleRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { request_id: string; action: 'accept' | 'reject' }) =>
      fetchJSON<{ success: boolean }>('/api/guilds/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['guild-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['my-guild'] });
    },
  });
}

// Чат
export function useGuildChat() {
  return useQuery({
    queryKey: ['guild-chat'],
    queryFn: () => fetchJSON<GuildMessage[]>('/api/guilds/chat'),
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      fetchJSON<GuildMessage>('/api/guilds/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['guild-chat'] });
    },
  });
}

// Квесты гильдии
export function useGuildQuests() {
  return useQuery({
    queryKey: ['guild-quests'],
    queryFn: () => fetchJSON<GuildQuest[]>('/api/guilds/quests'),
  });
}

export function useCreateGuildQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGuildQuestInput) =>
      fetchJSON<GuildQuest>('/api/guilds/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['guild-quests'] });
    },
  });
}

export function useContributeQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { quest_id: string; value: number }) =>
      fetchJSON<{ success: boolean; completed: boolean }>('/api/guilds/quests/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['guild-quests'] });
      void queryClient.invalidateQueries({ queryKey: ['my-guild'] });
    },
  });
}