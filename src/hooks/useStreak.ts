"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface StreakData {
  current: number;
  checkedToday: boolean;
}

async function fetchStreak(): Promise<StreakData> {
  const res = await fetch("/api/streak");
  if (!res.ok) throw new Error("streak fetch failed");
  return res.json() as Promise<StreakData>;
}

async function checkin(): Promise<StreakData> {
  const res = await fetch("/api/streak", { method: "POST" });
  if (!res.ok) throw new Error("checkin failed");
  return res.json() as Promise<StreakData>;
}

export function useStreak() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["streak"],
    queryFn: fetchStreak,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: checkin,
    onSuccess: (data) => {
      qc.setQueryData(["streak"], data);
    },
  });

  return {
    current: query.data?.current ?? 0,
    checkedToday: query.data?.checkedToday ?? false,
    isLoading: query.isLoading,
    doCheckin: mutation.mutate,
    isChecking: mutation.isPending,
  };
}