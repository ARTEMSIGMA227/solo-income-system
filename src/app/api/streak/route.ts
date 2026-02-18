import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateStreak } from "@/lib/streak";

// GET — получить текущую серию
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("daily_checkins")
    .select("check_date")
    .eq("user_id", user.id)
    .order("check_date", { ascending: false })
    .limit(400);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dates = (data ?? []).map(
    (r: { check_date: string }) => r.check_date,
  );
  const result = calculateStreak(dates);

  return NextResponse.json(result);
}

// POST — отметить сегодняшний день
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from("daily_checkins")
    .upsert(
      { user_id: user.id, check_date: today },
      { onConflict: "user_id,check_date" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // вернуть обновлённую серию
  const { data } = await supabase
    .from("daily_checkins")
    .select("check_date")
    .eq("user_id", user.id)
    .order("check_date", { ascending: false })
    .limit(400);

  const dates = (data ?? []).map(
    (r: { check_date: string }) => r.check_date,
  );
  const result = calculateStreak(dates);

  return NextResponse.json(result);
}