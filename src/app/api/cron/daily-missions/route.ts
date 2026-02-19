import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    // Проверяем CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().slice(0, 10);

    // Получаем всех пользователей
    const { data: profiles, error: profilesErr } = await supabase
      .from("profiles")
      .select("id");

    if (profilesErr || !profiles) {
      console.error("Failed to fetch profiles:", profilesErr);
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
    }

    let assigned = 0;
    let skipped = 0;

    for (const profile of profiles) {
      const { data: count } = await supabase.rpc("assign_daily_missions", {
        p_user_id: profile.id,
        p_date: today,
      });

      if (typeof count === "number" && count > 0) {
        assigned++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      date: today,
      total_users: profiles.length,
      assigned,
      skipped,
    });
  } catch (err) {
    console.error("CRON daily-missions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}