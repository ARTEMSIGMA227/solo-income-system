import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

    const { data, error } = await supabase.rpc("assign_daily_missions", {
      p_user_id: user.id,
      p_date: today,
    });

    if (error) {
      console.error("assign_daily_missions error:", error);
      return NextResponse.json({ error: "Failed to assign" }, { status: 500 });
    }

    return NextResponse.json({ assigned: data });
  } catch (err) {
    console.error("POST /api/daily-missions/assign error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}