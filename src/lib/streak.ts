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

function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toDateStr(d)
}

export interface StreakInfo {
  current: number
  best: number
  isAtRisk: boolean
  lastDate: string | null
}

/**
 * Читает серию БЕЗ мутации.
 * - last = today  → серия жива, не под угрозой
 * - last = yesterday → серия жива, под угрозой
 * - иначе → серия = 0
 */
export async function getStreakDisplay(
  supabase: SupabaseClient,
  userId: string
): Promise<StreakInfo> {
  const { data } = await supabase
    .from('stats')
    .select('current_streak, longest_streak, last_activity_date')
    .eq('user_id', userId)
    .single()

  if (!data) {
    return { current: 0, best: 0, isAtRisk: false, lastDate: null }
  }

  const last = (data.last_activity_date as string | null) ?? null
  const streak = (data.current_streak as number) ?? 0
  const best = (data.longest_streak as number) ?? 0

  if (!last) {
    return { current: 0, best, isAtRisk: false, lastDate: null }
  }

  const today = todayStr()
  const yesterday = yesterdayStr()

  if (last === today) {
    return { current: streak, best, isAtRisk: false, lastDate: last }
  }

  if (last === yesterday) {
    return { current: streak, best, isAtRisk: true, lastDate: last }
  }

  // Пропуск ≥ 2 дней — серия сгорела (но в БД не трогаем, обнулим при следующем действии)
  return { current: 0, best, isAtRisk: false, lastDate: last }
}

/**
 * Записывает активность и обновляет серию.
 * Вызывай при: завершении квеста, босса, привычки, челленджа.
 *
 * - last = today     → ничего не меняем
 * - last = yesterday → streak + 1
 * - иначе            → streak = 1
 */
export async function recordActivity(
  supabase: SupabaseClient,
  userId: string
): Promise<{ current: number; best: number }> {
  const today = todayStr()
  const yesterday = yesterdayStr()

  const { data } = await supabase
    .from('stats')
    .select('current_streak, longest_streak, last_activity_date')
    .eq('user_id', userId)
    .single()

  const last = (data?.last_activity_date as string | null) ?? null
  const oldStreak = (data?.current_streak as number) ?? 0
  const oldBest = (data?.longest_streak as number) ?? 0

  // Уже отмечено сегодня
  if (last === today) {
    return { current: oldStreak, best: oldBest }
  }

  let newStreak: number

  if (last === yesterday) {
    // Продлеваем серию
    newStreak = oldStreak + 1
  } else {
    // Пропуск или первый день
    newStreak = 1
  }

  const newBest = Math.max(oldBest, newStreak)

  await supabase
    .from('stats')
    .update({
      current_streak: newStreak,
      longest_streak: newBest,
      last_activity_date: today,
    })
    .eq('user_id', userId)

  return { current: newStreak, best: newBest }
}