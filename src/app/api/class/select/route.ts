import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";
import { CLASS_INFO } from "@/types/hunter-class";

const HUNTER_CLASS_VALUES = ["striker", "healer", "mage", "assassin", "tank"] as const;

const Schema = z.object({
  class_name: z.enum(HUNTER_CLASS_VALUES),
});

const CHANGE_COOLDOWN_DAYS = 30;

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
        { error: "Invalid class name", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { class_name } = parsed.data;
    const info = CLASS_INFO[class_name];

    // Проверяем существующий класс
    const { data: existing } = await supabase
      .from("user_classes")
      .select("*")
      .eq("id", user.id)
      .single();

    if (existing) {
      // Проверяем cooldown
      const selectedAt = new Date(existing.selected_at as string);
      const now = new Date();
      const diffDays = (now.getTime() - selectedAt.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays < CHANGE_COOLDOWN_DAYS) {
        const remaining = Math.ceil(CHANGE_COOLDOWN_DAYS - diffDays);
        return NextResponse.json(
          {
            error: `Сменить класс можно через ${remaining} дн.`,
          },
          { status: 429 }
        );
      }

      // Обновляем
      const { data: updated, error } = await supabase
        .from("user_classes")
        .update({
          class_name,
          class_bonuses: info.bonuses,
          selected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("update class error:", error);
        return NextResponse.json({ error: "Failed to update class" }, { status: 500 });
      }

      return NextResponse.json(updated);
    }

    // Создаём новый
    const { data: created, error } = await supabase
      .from("user_classes")
      .insert({
        id: user.id,
        class_name,
        class_bonuses: info.bonuses,
        selected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("insert class error:", error);
      return NextResponse.json({ error: "Failed to select class" }, { status: 500 });
    }

    return NextResponse.json(created);
  } catch (err) {
    console.error("POST /api/class/select error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}