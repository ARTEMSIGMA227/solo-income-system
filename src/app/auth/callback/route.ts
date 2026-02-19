import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server component — ignore
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Fallback: если триггер не создал профиль
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        const displayName =
          data.user.user_metadata?.display_name ??
          data.user.email?.split('@')[0] ??
          'Hunter'

        await supabase.from('profiles').insert({
          id: data.user.id,
          display_name: displayName,
          timezone: (data.user.user_metadata?.timezone as string) ?? 'UTC',
          daily_income_target: 10000,
          monthly_income_target: 300000,
          daily_actions_target: 5,
          penalty_xp: 100,
          streak_current: 0,
          streak_best: 0,
          consecutive_misses: 0,
          focus_duration_minutes: 25,
          notifications_enabled: true,
          streak_shield_active: false,
        })
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', requestUrl.origin))
}