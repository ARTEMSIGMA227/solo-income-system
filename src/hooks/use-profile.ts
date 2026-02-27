'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export interface Profile {
  id: string
  display_name: string
  timezone: string
  daily_income_target: number
  monthly_income_target: number
  daily_actions_target: number
  penalty_xp: number
  streak_current: number
  streak_best: number
  consecutive_misses: number
  focus_duration_minutes: number
  notifications_enabled: boolean
  streak_shield_active: boolean
  is_pro: boolean
  pro_until: string | null
  created_at: string
  updated_at: string
}

export type ProfileUpdate = Partial<
  Omit<Profile, 'id' | 'created_at' | 'updated_at'>
>

async function fetchProfile(): Promise<Profile> {
  const supabase = createBrowserSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Profile
}

async function updateProfile(updates: ProfileUpdate): Promise<Profile> {
  const supabase = createBrowserSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Profile
}

export function useProfile() {
  return useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation<Profile, Error, ProfileUpdate>({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data)
    },
  })
}