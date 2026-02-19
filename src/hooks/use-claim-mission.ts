"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ClaimResult } from "@/types/daily-mission";

interface ClaimRequest {
  missionEntryId: string;
}

export function useClaimMission() {
  const qc = useQueryClient();

  return useMutation<ClaimResult, Error, ClaimRequest>({
    mutationFn: async ({ missionEntryId }) => {
      const res = await fetch("/api/daily-missions/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission_entry_id: missionEntryId }),
      });

      if (!res.ok) {
        const err: unknown = await res.json().catch(() => ({}));
        const msg =
          typeof err === "object" && err !== null && "error" in err
            ? String((err as Record<string, unknown>).error)
            : "Failed to claim";
        throw new Error(msg);
      }

      return res.json() as Promise<ClaimResult>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["daily-missions"] });
      void qc.invalidateQueries({ queryKey: ["user-level"] });
    },
  });
}