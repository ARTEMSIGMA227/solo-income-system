// src/app/api/streak/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("streak_current, streak_best, consecutive_misses")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json(
      { error: "Profile not found", details: error },
      { status: 404 },
    );
  }

  return NextResponse.json(profile);
}

export async function POST() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check if already checked in today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: existing } = await supabase
    .from("xp_events")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_type", "streak_checkin")
    .gte("created_at", todayStart.toISOString())
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ message: "Already checked in today" });
  }

  // Get current profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_current, streak_best")
    .eq("id", user.id)
    .single();

  const currentStreak = (profile?.streak_current ?? 0) + 1;
  const bestStreak = Math.max(currentStreak, profile?.streak_best ?? 0);

  // Update profile
  await supabase
    .from("profiles")
    .update({
      streak_current: currentStreak,
      streak_best: bestStreak,
      consecutive_misses: 0,
    })
    .eq("id", user.id);

  // Mark checkin
  await supabase.from("xp_events").insert({
    user_id: user.id,
    event_type: "streak_checkin",
    xp_amount: 0,
  });

  return NextResponse.json({
    streak_current: currentStreak,
    streak_best: bestStreak,
  });
}