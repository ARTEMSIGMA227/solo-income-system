import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface ProfileRow {
  id: string;
  display_name: string;
  daily_actions_target: number;
  penalty_xp: number;
  streak_current: number;
  streak_best: number;
  consecutive_misses: number;
  timezone: string;
}

interface StatsRow {
  user_id: string;
  level: number;
  current_xp: number;
  total_xp_earned: number;
  total_xp_lost: number;
  total_actions: number;
  total_income: number;
  total_sales: number;
}

interface CompletionRow {
  count_done: number;
}

interface IncomeRow {
  amount: number;
}

function getTodayForTz(tz: string): string {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: tz });
  } catch {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 1. Все профили
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, display_name, daily_actions_target, penalty_xp, streak_current, streak_best, consecutive_misses, timezone');

  if (profErr || !profiles || profiles.length === 0) {
    return NextResponse.json({ processed: 0, reason: 'no_profiles' });
  }

  const typedProfiles = profiles as ProfileRow[];
  let processed = 0;
  let penalized = 0;
  let streaksUpdated = 0;

  for (const prof of typedProfiles) {
    const today = getTodayForTz(prof.timezone);

    // 2. Действия за сегодня
    const { data: completions } = await supabase
      .from('completions')
      .select('count_done')
      .eq('user_id', prof.id)
      .eq('completion_date', today);

    const todayActions = (completions as CompletionRow[] | null)?.reduce(
      (sum, c) => sum + c.count_done, 0,
    ) ?? 0;

    // 3. Доход за сегодня
    const { data: incomes } = await supabase
      .from('income_events')
      .select('amount')
      .eq('user_id', prof.id)
      .eq('event_date', today);

    const todayIncome = (incomes as IncomeRow[] | null)?.reduce(
      (sum, i) => sum + Number(i.amount), 0,
    ) ?? 0;

    // 4. Статы юзера
    const { data: statsData } = await supabase
      .from('stats')
      .select('*')
      .eq('user_id', prof.id)
      .single();

    const stats = statsData as StatsRow | null;

    // 5. Проверяем — уже есть summary за сегодня?
    const { data: existingSummary } = await supabase
      .from('daily_summary')
      .select('id')
      .eq('user_id', prof.id)
      .eq('summary_date', today);

    if (existingSummary && existingSummary.length > 0) {
      continue; // уже обработан
    }

    const target = prof.daily_actions_target || 30;
    const completed = todayActions >= target;

    // 6. Записать daily_summary
    await supabase.from('daily_summary').insert({
      user_id: prof.id,
      summary_date: today,
      actions_done: todayActions,
      actions_target: target,
      income: todayIncome,
      completed,
    });

    // 7. Обновить серию
    if (todayActions > 0) {
      // Был ли streak_checkin сегодня (клиент мог уже отметить)
      const { data: checkinCheck } = await supabase
        .from('xp_events')
        .select('id')
        .eq('user_id', prof.id)
        .eq('event_type', 'streak_checkin')
        .eq('event_date', today);

      if (!checkinCheck || checkinCheck.length === 0) {
        // Проверяем вчера
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getTodayForTz(prof.timezone);
        // Нужно вчерашнюю дату, а не сегодняшнюю — пересчитаем
        const yd = new Date(new Date().toLocaleString('en-US', { timeZone: prof.timezone }));
        yd.setDate(yd.getDate() - 1);
        const yesterdayDate = yd.toLocaleDateString('en-CA');

        const { data: ydComp } = await supabase
          .from('completions')
          .select('count_done')
          .eq('user_id', prof.id)
          .eq('completion_date', yesterdayDate);

        const hadYesterday = (ydComp as CompletionRow[] | null)?.reduce(
          (s, c) => s + c.count_done, 0,
        ) ?? 0;

        const newStreak = hadYesterday > 0 ? prof.streak_current + 1 : 1;
        const newBest = Math.max(newStreak, prof.streak_best);

        await supabase.from('profiles').update({
          streak_current: newStreak,
          streak_best: newBest,
          consecutive_misses: 0,
          updated_at: new Date().toISOString(),
        }).eq('id', prof.id);

        await supabase.from('xp_events').insert({
          user_id: prof.id,
          event_type: 'streak_checkin',
          xp_amount: 0,
          description: `Серия: день ${newStreak} (cron)`,
          event_date: today,
        });

        streaksUpdated++;
      }
    }

    // 8. Штраф если не выполнил план
    if (!completed && stats) {
      // Проверяем — уже был штраф?
      const { data: penaltyCheck } = await supabase
        .from('xp_events')
        .select('id')
        .eq('user_id', prof.id)
        .eq('event_type', 'penalty_miss')
        .eq('event_date', today);

      if (!penaltyCheck || penaltyCheck.length === 0) {
        const penaltyXP = prof.penalty_xp || 100;
        const newMisses = prof.consecutive_misses + 1;

        // Записать штраф
        await supabase.from('xp_events').insert({
          user_id: prof.id,
          event_type: 'penalty_miss',
          xp_amount: -penaltyXP,
          description: `Не выполнен план: ${todayActions}/${target} (cron)`,
          event_date: today,
        });

        // Обновить профиль
        const profileUpdate: Record<string, unknown> = {
          consecutive_misses: newMisses,
          streak_current: 0,
          updated_at: new Date().toISOString(),
        };

        // 3 пропуска подряд — потеря уровня
        if (newMisses >= 3) {
          profileUpdate.consecutive_misses = 0;
        }

        await supabase.from('profiles').update(profileUpdate).eq('id', prof.id);

        // Обновить статы
        const statsUpdate: Record<string, unknown> = {
          total_xp_lost: stats.total_xp_lost + penaltyXP,
          updated_at: new Date().toISOString(),
        };

        if (newMisses >= 3) {
          statsUpdate.level = Math.max(stats.level - 1, 1);
          statsUpdate.current_xp = 0;
        }

        await supabase.from('stats').update(statsUpdate).eq('user_id', prof.id);

        penalized++;
      }
    }

    processed++;
  }

  return NextResponse.json({
    processed,
    penalized,
    streaksUpdated,
    date: new Date().toISOString(),
  });
}