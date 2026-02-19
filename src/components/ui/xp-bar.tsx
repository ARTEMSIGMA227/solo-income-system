"use client";

import { useUserLevel } from "@/hooks/use-user-level";

interface XPBarProps {
  compact?: boolean;
}

export function XPBar({ compact = false }: XPBarProps) {
  const { data: level, isLoading } = useUserLevel();

  if (isLoading) {
    return (
      <div className={`${compact ? "h-6" : "h-10"} animate-pulse rounded-lg bg-white/5`} />
    );
  }

  if (!level) return null;

  const pct =
    level.xp_to_next_level > 0
      ? Math.min((level.xp / level.xp_to_next_level) * 100, 100)
      : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs font-bold text-violet-400">
          Lv.{level.level}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-[10px] tabular-nums text-gray-500">
          {level.xp}/{level.xp_to_next_level}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-violet-400">Lv.{level.level}</span>
        <span className="text-[10px] tabular-nums text-gray-500">
          {level.xp} / {level.xp_to_next_level} XP
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 via-violet-500 to-violet-400 transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}