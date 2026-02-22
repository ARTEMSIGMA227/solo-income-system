'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getStreakDisplay } from '@/lib/streak'
import { useT } from '@/lib/i18n'

export default function StreakBanner({ userId }: { userId: string }) {
  const supabase = createClient()
  const { t, locale } = useT()

  function pluralDays(n: number): string {
    if (locale !== 'ru') {
      return n === 1 ? t.effects.streakDay1 : t.effects.streakDay5plus;
    }
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return t.effects.streakDay1
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return t.effects.streakDay234
    return t.effects.streakDay5plus
  }

  const { data } = useQuery({
    queryKey: ['streak-display', userId],
    queryFn: () => getStreakDisplay(supabase, userId),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  if (!data) return null

  const { current, best, isAtRisk } = data

  return (
    <div
      className={`relative rounded-xl p-4 border flex items-center justify-between ${
        isAtRisk
          ? 'bg-orange-950/30 border-orange-700/60'
          : 'bg-zinc-900 border-zinc-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{current > 0 ? '🔥' : '❄️'}</span>
        <div>
          <p className="text-xl font-bold text-white">
            {current} {pluralDays(current)}
          </p>
          <p className="text-xs text-zinc-400">
            {current > 0 ? t.streakBanner.currentStreak : t.streakBanner.notStarted}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-base font-semibold text-zinc-300">🏆 {best}</p>
        <p className="text-xs text-zinc-500">{t.effects.streakRecord}</p>
      </div>

      {isAtRisk && (
        <div className="w-full mt-3 absolute -bottom-5 left-0 flex justify-center">
          <span className="bg-orange-600 text-white text-[10px] px-3 py-1 rounded-full font-medium shadow-lg">
            {t.streakBanner.atRiskWarning}
          </span>
        </div>
      )}
    </div>
  )
}
