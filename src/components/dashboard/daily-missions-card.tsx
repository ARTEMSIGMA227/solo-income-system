"use client";

import { useState, useEffect } from "react";
import { useDailyMissions } from "@/hooks/use-daily-missions";
import { useClaimMission } from "@/hooks/use-claim-mission";
import { useToast } from "@/hooks/use-toast";
import {
  DIFFICULTY_CONFIG,
  ALL_COMPLETE_BONUS_XP,
  type UserDailyMission,
} from "@/types/daily-mission";
import { Clock, Gift, CheckCircle2, Sparkles } from "lucide-react";

function useResetTimer() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function calc() {
      const now = new Date();
      const tomorrow = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
      );
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    }

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

function MissionRow({ entry }: { entry: UserDailyMission }) {
  const claimMission = useClaimMission();
  const { toast } = useToast();

  const mission = entry.mission;
  const diffCfg = DIFFICULTY_CONFIG[mission.difficulty];
  const pct =
    mission.target_value > 0
      ? Math.min((entry.progress / mission.target_value) * 100, 100)
      : 0;

  const handleClaim = () => {
    claimMission.mutate(
      { missionEntryId: entry.id },
      {
        onSuccess: (result) => {
          toast({
            title: `${mission.emoji} +${result.xp_awarded} XP`,
            description: result.gold_awarded > 0
              ? `+${result.gold_awarded} золота`
              : "Награда получена!",
          });

          if (result.all_completed_bonus) {
            toast({
              title: "🏆 Все миссии выполнены!",
              description: `Бонус +${ALL_COMPLETE_BONUS_XP} XP`,
            });
          }

          if (result.leveled_up) {
            toast({
              title: "🎉 Level Up!",
              description: `Уровень ${result.new_level}!`,
            });
          }
        },
        onError: (error) => {
          toast({
            title: "Ошибка",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        entry.claimed
          ? "border-white/5 bg-white/[0.01] opacity-60"
          : entry.completed
            ? `${diffCfg.borderColor} ${diffCfg.bgColor}`
            : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Emoji */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl">
          {entry.claimed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            mission.emoji
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white">{mission.title}</h4>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${diffCfg.bgColor} ${diffCfg.color}`}
            >
              {diffCfg.label}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-gray-400">{mission.description}</p>

          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  entry.completed
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-violet-600 to-violet-400"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] tabular-nums text-gray-500">
              {entry.progress}/{mission.target_value}
            </span>
          </div>

          {/* Rewards */}
          <div className="mt-1.5 flex items-center gap-3 text-[10px] text-gray-500">
            <span>⚡ {mission.xp_reward} XP</span>
            {mission.gold_reward > 0 && <span>🪙 {mission.gold_reward}</span>}
          </div>
        </div>

        {/* Claim button */}
        {entry.completed && !entry.claimed && (
          <button
            type="button"
            onClick={handleClaim}
            disabled={claimMission.isPending}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-500 disabled:opacity-50"
          >
            {claimMission.isPending ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Gift className="h-3.5 w-3.5" />
            )}
            Забрать
          </button>
        )}

        {entry.claimed && (
          <span className="shrink-0 text-xs font-medium text-emerald-400">✓</span>
        )}
      </div>
    </div>
  );
}

export function DailyMissionsCard() {
  const { data: missions, isLoading } = useDailyMissions();
  const timeLeft = useResetTimer();

  const completedCount = missions?.filter((m) => m.completed).length ?? 0;
  const claimedCount = missions?.filter((m) => m.claimed).length ?? 0;
  const totalCount = missions?.length ?? 0;
  const allClaimed = totalCount > 0 && claimedCount === totalCount;

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="h-6 w-48 animate-pulse rounded bg-white/5" />
        <div className="h-20 animate-pulse rounded-xl bg-white/5" />
        <div className="h-20 animate-pulse rounded-xl bg-white/5" />
        <div className="h-20 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  if (!missions || missions.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-400" />
          <h3 className="text-sm font-bold text-white">Ежедневные миссии</h3>
        </div>
        <p className="mt-3 text-center text-sm text-gray-500">
          Миссии на сегодня ещё не назначены. Обновите страницу.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-400" />
          <h3 className="text-sm font-bold text-white">Ежедневные миссии</h3>
          <span className="rounded-full bg-violet-600/20 px-2 py-0.5 text-[10px] font-bold text-violet-400">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="h-3.5 w-3.5" />
          <span className="tabular-nums">{timeLeft}</span>
        </div>
      </div>

      {/* All complete banner */}
      {allClaimed && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-600/10 p-3">
          <span className="text-xl">🏆</span>
          <div>
            <p className="text-sm font-bold text-emerald-400">Все миссии выполнены!</p>
            <p className="text-[10px] text-emerald-400/60">
              Бонус +{ALL_COMPLETE_BONUS_XP} XP получен
            </p>
          </div>
        </div>
      )}

      {/* Mission list */}
      <div className="space-y-2">
        {missions.map((entry) => (
          <MissionRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}