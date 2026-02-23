import type { SupabaseClient } from '@supabase/supabase-js'

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function todayStr(): string {
  return toDateStr(new Date())
}

export interface StreakInfo {
  current: number
  best: number
  isAtRisk: boolean
  lastDate: string | null
}

/**
 * Читает серию из profiles + completions.
 * - Есть completions сегодня → серия жива, не под угрозой
 * - Нет completions сегодня → серия жива, но под угрозой
 * - streak_current === 0 → серия не начата
 */
export async function getStreakDisplay(
  supabase: SupabaseClient,
  userId: string
): Promise<StreakInfo> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_current, streak_best')
    .eq('id', userId)
    .single()

  if (!profile) {
    return { current: 0, best: 0, isAtRisk: false, lastDate: null }
  }

  const current = (profile.streak_current as number) ?? 0
  const best = (profile.streak_best as number) ?? 0

  if (current === 0) {
    return { current: 0, best, isAtRisk: false, lastDate: null }
  }

  const today = todayStr()

  // Check if user already did actions today
  const { data: todayCompletions } = await supabase
    .from('completions')
    .select('id')
    .eq('user_id', userId)
    .eq('completion_date', today)
    .limit(1)

  const didActionToday = todayCompletions && todayCompletions.length > 0
  const isAtRisk = !didActionToday

  return { current, best, isAtRisk, lastDate: didActionToday ? today : null }
}

/**
 * Записывает активность и обновляет серию в profiles.
 * Вызывай при: завершении квеста, босса, привычки, челленджа.
 *
 * Примечание: page.tsx уже управляет серией через streak_checkin,
 * эта функция — для вызова из других мест (API routes, etc.)
 */
export async function recordActivity(
  supabase: SupabaseClient,
  userId: string
): Promise<{ current: number; best: number }> {
  const today = todayStr()

  // Check if already recorded today
  const { data: check } = await supabase
    .from('xp_events')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', 'streak_checkin')
    .eq('event_date', today)
    .limit(1)

  if (check && check.length > 0) {
    // Already recorded today — just return current values
    const { data: p } = await supabase
      .from('profiles')
      .select('streak_current, streak_best')
      .eq('id', userId)
      .single()

    return {
      current: (p?.streak_current as number) ?? 0,
      best: (p?.streak_best as number) ?? 0,
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_current, streak_best')
    .eq('id', userId)
    .single()

  const oldStreak = (profile?.streak_current as number) ?? 0
  const oldBest = (profile?.streak_best as number) ?? 0

  // Check yesterday's completions to decide if streak continues
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toDateStr(yesterday)

  const { data: yd } = await supabase
    .from('completions')
    .select('count_done')
    .eq('user_id', userId)
    .eq('completion_date', yesterdayStr)

  const hadYesterday = (yd?.reduce((s, c) => s + c.count_done, 0) || 0) > 0
  const newStreak = hadYesterday ? oldStreak + 1 : 1
  const newBest = Math.max(oldBest, newStreak)

  await supabase
    .from('profiles')
    .update({
      streak_current: newStreak,
      streak_best: newBest,
      consecutive_misses: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  await supabase.from('xp_events').insert({
    user_id: userId,
    event_type: 'streak_checkin',
    xp_amount: 0,
    description: `Streak: day ${newStreak}`,
    event_date: today,
  })

  return { current: newStreak, best: newBest }
}
