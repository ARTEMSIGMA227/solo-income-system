import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  loadSkillEffectsServer,
  getExtraMissionSlotsFromEffects,
} from "@/lib/skill-effects-server";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().slice(0, 10);

    // Check if already assigned today
    const { data: existing } = await supabase
      .from("user_daily_missions")
      .select("id")
      .eq("user_id", user.id)
      .eq("assigned_date", today);

    if (existing && existing.length > 0) {
      return NextResponse.json({ assigned: existing.length });
    }

    // Call base RPC (assigns default 3 missions)
    const { data, error } = await supabase.rpc("assign_daily_missions", {
      p_user_id: user.id,
      p_date: today,
    });

    if (error) {
      console.error("assign_daily_missions error:", error);
      return NextResponse.json({ error: "Failed to assign" }, { status: 500 });
    }

    // Check skill bonus slots
    const effects = await loadSkillEffectsServer(supabase, user.id);
    const extraSlots = getExtraMissionSlotsFromEffects(effects);

    let totalAssigned = typeof data === "number" ? data : 3;

    if (extraSlots > 0) {
      // Get already assigned mission IDs to avoid duplicates
      const { data: assignedMissions } = await supabase
        .from("user_daily_missions")
        .select("mission_id")
        .eq("user_id", user.id)
        .eq("assigned_date", today);

      const assignedIds = (assignedMissions || []).map(
        (m: { mission_id: string }) => m.mission_id
      );

      // Get available missions not yet assigned
      const { data: availableMissions } = await supabase
        .from("daily_missions")
        .select("id")
        .eq("is_active", true)
        .not("id", "in", `(${assignedIds.join(",")})`);

      if (availableMissions && availableMissions.length > 0) {
        // Shuffle and pick extra missions
        const shuffled = availableMissions.sort(() => Math.random() - 0.5);
        const toAdd = shuffled.slice(0, extraSlots);

        const inserts = toAdd.map((m: { id: string }) => ({
          user_id: user.id,
          mission_id: m.id,
          assigned_date: today,
          progress: 0,
          completed: false,
          claimed: false,
        }));

        if (inserts.length > 0) {
          const { error: insertErr } = await supabase
            .from("user_daily_missions")
            .insert(inserts);

          if (!insertErr) {
            totalAssigned += inserts.length;
          } else {
            console.error("Extra mission insert error:", insertErr);
          }
        }
      }
    }

    return NextResponse.json({ assigned: totalAssigned, extra_slots: extraSlots });
  } catch (err) {
    console.error("POST /api/daily-missions/assign error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}