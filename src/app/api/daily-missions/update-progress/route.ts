import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const MISSION_TYPE_VALUES = [
  "complete_quests",
  "focus_minutes",
  "earn_income",
  "login_streak",
  "boss_damage",
] as const;

const Schema = z.object({
  mission_type: z.enum(MISSION_TYPE_VALUES),
  increment: z.number().int().min(1).max(100000),
});

interface MissionData {
  mission_type: string;
  target_value: number;
}

interface EntryRow {
  id: string;
  progress: number;
  completed: boolean;
  mission: MissionData | MissionData[] | null;
}

function extractMission(raw: MissionData | MissionData[] | null): MissionData | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

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

    const { mission_type, increment } = parsed.data;
    const today = new Date().toISOString().slice(0, 10);

    const { data: entries, error: fetchErr } = await supabase
      .from("user_daily_missions")
      .select("id, progress, completed, mission:daily_missions(mission_type, target_value)")
      .eq("user_id", user.id)
      .eq("assigned_date", today)
      .eq("completed", false);

    if (fetchErr || !entries) {
      return NextResponse.json({ updated: 0 });
    }

    let updated = 0;

    for (const entry of entries as EntryRow[]) {
      const mission = extractMission(entry.mission);
      if (!mission || mission.mission_type !== mission_type) continue;

      const newProgress = Math.min(entry.progress + increment, mission.target_value);
      const nowCompleted = newProgress >= mission.target_value;

      const { error: upErr } = await supabase
        .from("user_daily_missions")
        .update({
          progress: newProgress,
          completed: nowCompleted,
          completed_at: nowCompleted ? new Date().toISOString() : null,
        })
        .eq("id", entry.id);

      if (!upErr) updated++;
    }

    return NextResponse.json({ updated });
  } catch (err) {
    console.error("POST /api/daily-missions/update-progress error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}