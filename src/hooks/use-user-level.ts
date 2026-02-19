"use client";

import { useQuery } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { UserLevel } from "@/types/user-level";

export function useUserLevel() {
  return useQuery<UserLevel | null>({
    queryKey: ["user-level"],
    queryFn: async () => {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_levels")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          const { data: created, error: insertErr } = await supabase
            .from("user_levels")
            .insert({ id: user.id })
            .select()
            .single();
          if (insertErr) throw insertErr;
          return created as UserLevel;
        }
        throw error;
      }
      return data as UserLevel;
    },
    staleTime: 30_000,
  });
}