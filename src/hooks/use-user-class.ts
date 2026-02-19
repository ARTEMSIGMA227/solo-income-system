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
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data as UserClass;
    },
    staleTime: 60_000,
  });
}