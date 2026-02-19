"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AddXPRequest, AddXPResult } from "@/types/user-level";

export function useAddXP() {
  const qc = useQueryClient();

  return useMutation<AddXPResult, Error, AddXPRequest>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/xp/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err: unknown = await res.json().catch(() => ({}));
        const msg =
          typeof err === "object" && err !== null && "error" in err
            ? String((err as Record<string, unknown>).error)
            : "Failed to add XP";
        throw new Error(msg);
      }
      return res.json() as Promise<AddXPResult>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["user-level"] });
    },
  });
}