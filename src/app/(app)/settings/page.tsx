'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useProfile, useUpdateProfile, type ProfileUpdate } from '@/hooks/use-profile'
import { profileUpdateSchema } from '@/lib/validations/profile'
import { toast } from '@/components/ui/toaster'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const TIMEZONES = [
  'UTC',
  'Europe/Moscow',
  'Europe/Kiev',
  'Europe/Minsk',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
] as const

const FOCUS_PRESETS = [15, 25, 30, 45, 60, 90, 120] as const

export default function SettingsPage() {
  const router = useRouter()
  const { data: profile, isLoading, error } = useProfile()
  const updateMutation = useUpdateProfile()

  const [displayName, setDisplayName] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [dailyIncomeTarget, setDailyIncomeTarget] = useState(10000)
  const [monthlyIncomeTarget, setMonthlyIncomeTarget] = useState(300000)
  const [dailyActionsTarget, setDailyActionsTarget] = useState(5)
  const [penaltyXp, setPenaltyXp] = useState(100)
  const [focusDuration, setFocusDuration] = useState(25)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [streakShieldActive, setStreakShieldActive] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name)
      setTimezone(profile.timezone)
      setDailyIncomeTarget(profile.daily_income_target)
      setMonthlyIncomeTarget(profile.monthly_income_target)
      setDailyActionsTarget(profile.daily_actions_target)
      setPenaltyXp(profile.penalty_xp)
      setFocusDuration(profile.focus_duration_minutes)
      setNotificationsEnabled(profile.notifications_enabled)
      setStreakShieldActive(profile.streak_shield_active)
    }
  }, [profile])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setValidationErrors({})

    const updates: ProfileUpdate = {
      display_name: displayName,
      timezone,
      daily_income_target: dailyIncomeTarget,
      monthly_income_target: monthlyIncomeTarget,
      daily_actions_target: dailyActionsTarget,
      penalty_xp: penaltyXp,
      focus_duration_minutes: focusDuration,
      notifications_enabled: notificationsEnabled,
      streak_shield_active: streakShieldActive,
    }

    const parsed = profileUpdateSchema.safeParse(updates)

    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.')
        if (path && !errors[path]) {
          errors[path] = issue.message
        }
      }
      setValidationErrors(errors)
      toast('Исправьте ошибки в форме', 'error')
      return
    }

    updateMutation.mutate(parsed.data as ProfileUpdate, {
      onSuccess: () => {
        toast('Настройки сохранены!', 'success')
      },
      onError: (err) => {
        toast(`Ошибка: ${err.message}`, 'error')
      },
    })
  }

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <p className="text-gray-400">Загрузка настроек...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="rounded-lg bg-red-900/30 p-6 text-center">
          <p className="text-red-400">Ошибка загрузки профиля</p>
          <p className="mt-1 text-sm text-red-500">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">⚙️ Настройки</h1>
          <p className="mt-1 text-gray-400">
            Настройте систему под себя, Охотник
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Профиль */}
          <Section title="👤 Профиль">
            <Field
              label="Имя охотника"
              error={validationErrors['display_name']}
            >
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="Ваше имя"
              />
            </Field>

            <Field label="Таймзона" error={validationErrors['timezone']}>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </Field>
          </Section>

          {/* Цели */}
          <Section title="🎯 Цели">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Дневной доход (₽)"
                error={validationErrors['daily_income_target']}
              >
                <input
                  type="number"
                  value={dailyIncomeTarget}
                  onChange={(e) =>
                    setDailyIncomeTarget(Number(e.target.value))
                  }
                  min={0}
                  max={10_000_000}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </Field>

              <Field
                label="Месячный доход (₽)"
                error={validationErrors['monthly_income_target']}
              >
                <input
                  type="number"
                  value={monthlyIncomeTarget}
                  onChange={(e) =>
                    setMonthlyIncomeTarget(Number(e.target.value))
                  }
                  min={0}
                  max={100_000_000}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </Field>

              <Field
                label="Действий в день"
                error={validationErrors['daily_actions_target']}
              >
                <input
                  type="number"
                  value={dailyActionsTarget}
                  onChange={(e) =>
                    setDailyActionsTarget(Number(e.target.value))
                  }
                  min={1}
                  max={100}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </Field>

              <Field
                label="Штраф XP за пропуск"
                error={validationErrors['penalty_xp']}
              >
                <input
                  type="number"
                  value={penaltyXp}
                  onChange={(e) => setPenaltyXp(Number(e.target.value))}
                  min={0}
                  max={10_000}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </Field>
            </div>
          </Section>

          {/* Фокус */}
          <Section title="🎯 Фокус-таймер">
            <Field
              label="Длительность сессии (мин)"
              error={validationErrors['focus_duration_minutes']}
            >
              <div className="flex flex-wrap gap-2">
                {FOCUS_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFocusDuration(preset)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      focusDuration === preset
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {preset} мин
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={focusDuration}
                onChange={(e) => setFocusDuration(Number(e.target.value))}
                min={1}
                max={240}
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </Field>
          </Section>

          {/* Переключатели */}
          <Section title="🔔 Уведомления и защита">
            <Toggle
              label="Push-уведомления"
              description="Получать напоминания о квестах и стриках"
              checked={notificationsEnabled}
              onChange={setNotificationsEnabled}
            />
            <Toggle
              label="Щит стрика"
              description="Защитить стрик от одного пропуска"
              checked={streakShieldActive}
              onChange={setStreakShieldActive}
            />
          </Section>

          {/* Статистика стрика (read-only) */}
          {profile && (
            <Section title="🔥 Стрик">
              <div className="grid grid-cols-3 gap-4">
                <StatCard
                  label="Текущий"
                  value={profile.streak_current}
                  icon="🔥"
                />
                <StatCard
                  label="Лучший"
                  value={profile.streak_best}
                  icon="🏆"
                />
                <StatCard
                  label="Пропуски подряд"
                  value={profile.consecutive_misses}
                  icon="💀"
                />
              </div>
            </Section>
          )}

          {/* Кнопки */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Сохранение...
                </span>
              ) : (
                '💾 Сохранить настройки'
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-red-800 px-6 py-3 font-semibold text-red-400 transition hover:bg-red-900/30"
            >
              🚪 Выйти
            </button>
          </div>
        </form>

        {/* Мета-инфо */}
        {profile && (
          <div className="mt-8 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
            <p className="text-xs text-gray-500">
              ID: {profile.id}
            </p>
            <p className="text-xs text-gray-500">
              Создан: {new Date(profile.created_at).toLocaleDateString('ru-RU')}
            </p>
            <p className="text-xs text-gray-500">
              Обновлён:{' '}
              {new Date(profile.updated_at).toLocaleString('ru-RU')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ========== Sub-components ========== */

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-300">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-4">
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors ${
          checked ? 'bg-purple-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: string
}) {
  return (
    <div className="rounded-lg bg-gray-800/50 p-4 text-center">
      <p className="text-2xl">{icon}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}