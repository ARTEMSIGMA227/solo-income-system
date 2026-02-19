import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const Schema = z.object({
  mission_entry_id: z.string().uuid(),
});

const ALL_COMPLETE_BONUS_XP = 50;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { mission_entry_id } = parsed.data;

    // Получаем запись
    const { data: entry, error: fetchErr } = await supabase
      .from("user_daily_missions")
      .select("*, mission:daily_missions(*)")
      .eq("id", mission_entry_id)
      .eq("user_id", user.id)
      .single();

    if (fetchErr || !entry) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    const typedEntry = entry as {
      id: string;
      completed: boolean;
      claimed: boolean;
      assigned_date: string;
      mission: { xp_reward: number; gold_reward: number };
    };

    if (!typedEntry.completed) {
      return NextResponse.json({ error: "Mission not completed" }, { status: 400 });
    }

    if (typedEntry.claimed) {
      return NextResponse.json({ error: "Already claimed" }, { status: 400 });
    }

    // Помечаем как claimed
    const { error: updateErr } = await supabase
      .from("user_daily_missions")
      .update({
        claimed: true,
        claimed_at: new Date().toISOString(),
      })
      .eq("id", mission_entry_id);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to claim" }, { status: 500 });
    }

    // Начисляем XP
    let totalXP = typedEntry.mission.xp_reward;
    const goldAwarded = typedEntry.mission.gold_reward;

    // Проверяем, все ли миссии за сегодня выполнены и забраны
    const { data: allMissions } = await supabase
      .from("user_daily_missions")
      .select("completed, claimed")
      .eq("user_id", user.id)
      .eq("assigned_date", typedEntry.assigned_date);

    const allCompleted =
      allMissions !== null &&
      allMissions.length >= 3 &&
      allMissions.every(
        (m: { completed: boolean; claimed: boolean }) => m.completed && m.claimed
      );

    if (allCompleted) {
      totalXP += ALL_COMPLETE_BONUS_XP;
    }

    // Начисляем XP через RPC
    const { data: xpResult, error: xpErr } = await supabase.rpc("add_xp", {
      p_user_id: user.id,
      p_amount: totalXP,
    });

    if (xpErr) {
      console.error("add_xp error:", xpErr);
    }

    const xpData = xpResult as {
      leveled_up: boolean;
      level: number;
    } | null;

    const result = {
      xp_awarded: totalXP,
      gold_awarded: goldAwarded,
      all_completed_bonus: allCompleted,
      leveled_up: xpData?.leveled_up ?? false,
      new_level: xpData?.level ?? 0,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/daily-missions/claim error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}