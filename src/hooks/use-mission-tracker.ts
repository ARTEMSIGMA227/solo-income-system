"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useMissionTracker() {
  const queryClient = useQueryClient();

  const trackProgress = useCallback(
    async (missionType: string, increment: number): Promise<void> => {
      try {
        await fetch("/api/daily-missions/update-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mission_type: missionType, increment }),
        });
        void queryClient.invalidateQueries({ queryKey: ["daily-missions"] });
      } catch {
        // silent
      }
    },
    [queryClient],
  );

  return { trackProgress };
}