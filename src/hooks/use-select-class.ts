"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { HunterClassName } from "@/types/hunter-class";
import type { UserClass } from "@/types/hunter-class";

interface SelectClassRequest {
  className: HunterClassName;
}

export function useSelectClass() {
  const qc = useQueryClient();

  return useMutation<UserClass, Error, SelectClassRequest>({
    mutationFn: async ({ className }) => {
      const res = await fetch("/api/class/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_name: className }),
      });
      if (!res.ok) {
        const err: unknown = await res.json().catch(() => ({}));
        const msg =
          typeof err === "object" && err !== null && "error" in err
            ? String((err as Record<string, unknown>).error)
            : "Failed to select class";
        throw new Error(msg);
      }
      return res.json() as Promise<UserClass>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["user-class"] });
    },
  });
}