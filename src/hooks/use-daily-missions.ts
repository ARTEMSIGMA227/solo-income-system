"use client";

import { useQuery } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { UserDailyMission } from "@/types/daily-mission";

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyMissions() {
  return useQuery<UserDailyMission[]>({
    queryKey: ["daily-missions", todayUTC()],
    queryFn: async () => {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const today = todayUTC();

      const { data, error } = await supabase
        .from("user_daily_missions")
        .select("*, mission:daily_missions(*)")
        .eq("user_id", user.id)
        .eq("assigned_date", today)
        .order("created_at");

      if (error) {
        // Если нет миссий — попробуем назначить через API
        if (error.code === "PGRST116") return [];
        throw error;
      }

      if (!data || data.length === 0) {
        // Триггерим назначение
        await fetch("/api/daily-missions/assign", { method: "POST" });

        const { data: retry, error: retryErr } = await supabase
          .from("user_daily_missions")
          .select("*, mission:daily_missions(*)")
          .eq("user_id", user.id)
          .eq("assigned_date", today)
          .order("created_at");

        if (retryErr) throw retryErr;
        return (retry ?? []) as UserDailyMission[];
      }

      return data as UserDailyMission[];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}