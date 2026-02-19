"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface UserClass {
  id: string;
  class_name: string;
  selected_at: string;
  class_bonuses: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useUserClass() {
  return useQuery<UserClass | null>({
    queryKey: ["user-class"],
    queryFn: async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
          .from("user_classes")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          // Таблица не существует или запись не найдена — не крашим
          if (
            error.code === "PGRST116" ||
            error.code === "42P01" ||
            error.message?.includes("406") ||
            error.message?.includes("Not Acceptable")
          ) {
            return null;
          }
          console.warn("useUserClass error:", error.message);
          return null;
        }
        return data as UserClass;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}