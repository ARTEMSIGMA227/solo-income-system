import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface LeaderboardEntry {
  id: string
  display_name: string
  streak_current: number
  streak_best: number
  daily_income_target: number
}

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, display_name, streak_current, streak_best, daily_income_target'
    )
    .order('streak_current', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const entries: LeaderboardEntry[] = (data ?? []).map((row) => ({
    id: row.id as string,
    display_name: row.display_name as string,
    streak_current: row.streak_current as number,
    streak_best: row.streak_best as number,
    daily_income_target: row.daily_income_target as number,
  }))

  return NextResponse.json(entries)
}