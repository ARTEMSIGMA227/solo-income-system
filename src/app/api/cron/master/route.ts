import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════
// Master CRON — runs once per day at 00:00 UTC (Vercel Hobby)
// Combines: daily-missions + daily-summary
// Notifications (3x/day) handled by Supabase pg_cron + pg_net
// ═══════════════════════════════════════════════════════════════

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

function getYesterdayForTz(tz: string): string {
  try {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
    now.setDate(now.getDate() - 1);
    return now.toLocaleDateString("en-CA");
  } catch {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    return now.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
  }
}

function getTodayForTz(tz: string): string {
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: tz });
  } catch {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const results = {
    dailyMissions: { assigned: 0, skipped: 0, error: null as string | null },
    dailySummary: { processed: 0, penalized: 0, streaksUpdated: 0, error: null as string | null },
    timestamp: new Date().toISOString(),
  };

  // ═══════════════════════════════════════
  // PHASE 1: Daily Missions Assignment
  // ═══════════════════════════════════════
  try {
    const { data: profiles, error: profilesErr } = await supabase
      .from("profiles")
      .select("id");

    if (profilesErr || !profiles) {
      results.dailyMissions.error = profilesErr?.message ?? "No profiles";
    } else {
      const today = new Date().toISOString().slice(0, 10);

      for (const profile of profiles) {
        const { data: count } = await supabase.rpc("assign_daily_missions", {
          p_user_id: profile.id,
          p_date: today,
        });

        if (typeof count === "number" && count > 0) {
          results.dailyMissions.assigned++;
        } else {
          results.dailyMissions.skipped++;
        }
      }
    }
  } catch (err) {
    results.dailyMissions.error = err instanceof Error ? err.message : "Unknown error";
  }

  // ═══════════════════════════════════════
  // PHASE 2: Daily Summary (for yesterday)
  // Cron fires at 00:00 UTC — summarize the day that just ended
  // ═══════════════════════════════════════
  try {
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select(
        "id, display_name, daily_actions_target, penalty_xp, streak_current, streak_best, consecutive_misses, timezone",
      );

    if (profErr || !profiles || profiles.length === 0) {
      results.dailySummary.error = profErr?.message ?? "No profiles";
    } else {
      const typedProfiles = profiles as ProfileRow[];

      for (const prof of typedProfiles) {
        const tz = prof.timezone || "Europe/Berlin";
        // Summary для вчерашнего дня (cron в 00:00 UTC → подводим итог прошедшего дня)
        const summaryDate = getYesterdayForTz(tz);

        // Проверяем — уже есть summary?
        const { data: existingSummary } = await supabase
          .from("daily_summary")
          .select("id")
          .eq("user_id", prof.id)
          .eq("summary_date", summaryDate);

        if (existingSummary && existingSummary.length > 0) {
          continue;
        }

        // Действия за вчера
        const { data: completions } = await supabase
          .from("completions")
          .select("count_done")
          .eq("user_id", prof.id)
          .eq("completion_date", summaryDate);

        const todayActions =
          (completions as CompletionRow[] | null)?.reduce((sum, c) => sum + c.count_done, 0) ?? 0;

        // Доход за вчера
        const { data: incomes } = await supabase
          .from("income_events")
          .select("amount")
          .eq("user_id", prof.id)
          .eq("event_date", summaryDate);

        const todayIncome =
          (incomes as IncomeRow[] | null)?.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0;

        // Статы
        const { data: statsData } = await supabase
          .from("stats")
          .select("*")
          .eq("user_id", prof.id)
          .single();

        const stats = statsData as StatsRow | null;

        const target = prof.daily_actions_target || 30;
        const completed = todayActions >= target;

        // Записать summary
        await supabase.from("daily_summary").insert({
          user_id: prof.id,
          summary_date: summaryDate,
          actions_done: todayActions,
          actions_target: target,
          income: todayIncome,
          completed,
        });

        // Обновить серию
        if (todayActions > 0) {
          const { data: checkinCheck } = await supabase
            .from("xp_events")
            .select("id")
            .eq("user_id", prof.id)
            .eq("event_type", "streak_checkin")
            .eq("event_date", summaryDate);

          if (!checkinCheck || checkinCheck.length === 0) {
            // Проверяем позавчера
            const twoDaysAgo = new Date(
              new Date().toLocaleString("en-US", { timeZone: tz }),
            );
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            const twoDaysAgoDate = twoDaysAgo.toLocaleDateString("en-CA");

            const { data: prevComp } = await supabase
              .from("completions")
              .select("count_done")
              .eq("user_id", prof.id)
              .eq("completion_date", twoDaysAgoDate);

            const hadPrevDay =
              (prevComp as CompletionRow[] | null)?.reduce((s, c) => s + c.count_done, 0) ?? 0;

            const newStreak = hadPrevDay > 0 ? prof.streak_current + 1 : 1;
            const newBest = Math.max(newStreak, prof.streak_best);

            await supabase
              .from("profiles")
              .update({
                streak_current: newStreak,
                streak_best: newBest,
                consecutive_misses: 0,
                updated_at: new Date().toISOString(),
              })
              .eq("id", prof.id);

            await supabase.from("xp_events").insert({
              user_id: prof.id,
              event_type: "streak_checkin",
              xp_amount: 0,
              description: `Серия: день ${newStreak} (cron)`,
              event_date: summaryDate,
            });

            results.dailySummary.streaksUpdated++;
          }
        }

        // Штраф если не выполнил план
        if (!completed && stats) {
          const { data: penaltyCheck } = await supabase
            .from("xp_events")
            .select("id")
            .eq("user_id", prof.id)
            .eq("event_type", "penalty_miss")
            .eq("event_date", summaryDate);

          if (!penaltyCheck || penaltyCheck.length === 0) {
            const penaltyXP = prof.penalty_xp || 100;
            const newMisses = prof.consecutive_misses + 1;

            await supabase.from("xp_events").insert({
              user_id: prof.id,
              event_type: "penalty_miss",
              xp_amount: -penaltyXP,
              description: `Не выполнен план: ${todayActions}/${target} (cron)`,
              event_date: summaryDate,
            });

            const profileUpdate: Record<string, unknown> = {
              consecutive_misses: newMisses,
              streak_current: 0,
              updated_at: new Date().toISOString(),
            };

            if (newMisses >= 3) {
              profileUpdate.consecutive_misses = 0;
            }

            await supabase.from("profiles").update(profileUpdate).eq("id", prof.id);

            const statsUpdate: Record<string, unknown> = {
              total_xp_lost: stats.total_xp_lost + penaltyXP,
              updated_at: new Date().toISOString(),
            };

            if (newMisses >= 3) {
              statsUpdate.level = Math.max(stats.level - 1, 1);
              statsUpdate.current_xp = 0;
            }

            await supabase.from("stats").update(statsUpdate).eq("user_id", prof.id);

            results.dailySummary.penalized++;
          }
        }

        results.dailySummary.processed++;
      }
    }
  } catch (err) {
    results.dailySummary.error = err instanceof Error ? err.message : "Unknown error";
  }

  return NextResponse.json(results);
}
