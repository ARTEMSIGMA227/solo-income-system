import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const Schema = z.object({
  amount: z.number().int().min(1).max(10000),
  reason: z.string().max(200).optional(),
});

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

    const { data, error } = await supabase.rpc("add_xp", {
      p_user_id: user.id,
      p_amount: parsed.data.amount,
    });

    if (error) {
      console.error("add_xp RPC error:", error);
      return NextResponse.json({ error: "Failed to add XP" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("POST /api/xp/add error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}