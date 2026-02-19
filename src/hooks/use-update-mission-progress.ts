"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateProgressRequest {
  missionType: "complete_quests" | "focus_minutes" | "earn_income" | "login_streak" | "boss_damage";
  increment: number;
}

interface UpdateProgressResult {
  updated: number;
}

export function useUpdateMissionProgress() {
  const qc = useQueryClient();

  return useMutation<UpdateProgressResult, Error, UpdateProgressRequest>({
    mutationFn: async ({ missionType, increment }) => {
      const res = await fetch("/api/daily-missions/update-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mission_type: missionType,
          increment,
        }),
      });

      if (!res.ok) {
        const err: unknown = await res.json().catch(() => ({}));
        const msg =
          typeof err === "object" && err !== null && "error" in err
            ? String((err as Record<string, unknown>).error)
            : "Failed to update progress";
        throw new Error(msg);
      }

      return res.json() as Promise<UpdateProgressResult>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["daily-missions"] });
    },
  });
}