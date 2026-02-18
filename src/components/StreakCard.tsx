"use client";

import { useStreak } from "@/hooks/useStreak";

export function StreakCard() {
  const { current, checkedToday, isLoading, doCheckin, isChecking } =
    useStreak();

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Серия</p>
          <p className="mt-1 text-3xl font-bold text-white">
            {isLoading ? "…" : `${current} 🔥`}
          </p>
          <p className="text-xs text-zinc-500">
            {current === 0
              ? "Отметь день, чтобы начать"
              : `${current} ${current === 1 ? "день" : current < 5 ? "дня" : "дней"} подряд`}
          </p>
        </div>

        <button
          onClick={() => doCheckin()}
          disabled={checkedToday || isChecking}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition
            ${
              checkedToday
                ? "bg-green-900/40 text-green-400 cursor-default"
                : "bg-green-600 text-white hover:bg-green-500 active:scale-95"
            }`}
        >
          {checkedToday ? "✓ Сегодня ✔" : isChecking ? "…" : "Отметить день"}
        </button>
      </div>
    </div>
  );
}