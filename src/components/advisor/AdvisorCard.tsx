"use client";

import { useState, useEffect, useCallback } from "react";
import { generateAdvice } from "@/lib/advisor";
import { createBrowserClient } from "@supabase/ssr";

interface QuestRow {
  completed_at: string | null;
  difficulty: string;
  xp_reward: number;
  category: string;
}

interface ProfileRow {
  level: number;
  streak: number;
  total_xp: number;
  gold: number;
}

interface BossRow {
  defeated: boolean;
  boss_name: string;
}

interface AdviceState {
  greeting: string;
  tips: string[];
  motivation: string;
  focusArea: string;
}

export function AdvisorCard() {
  const [advice, setAdvice] = useState<AdviceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadAdvice = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [profileRes, questsRes, bossesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("level, streak, total_xp, gold")
          .eq("id", user.id)
          .single(),
        supabase
          .from("quests")
          .select("completed_at, difficulty, xp_reward, category")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("boss_fights")
          .select("defeated, boss_name")
          .eq("user_id", user.id),
      ]);

      const profile = profileRes.data as ProfileRow | null;
      const quests = (questsRes.data ?? []) as QuestRow[];
      const bosses = (bossesRes.data ?? []) as BossRow[];

      const result = generateAdvice(profile, quests, bosses);
      setAdvice(result);
    } catch (error) {
      console.error("Advisor error:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadAdvice();
  }, [loadAdvice]);

  if (loading) {
    return (
      <div className="rounded-xl border border-purple-500/30 bg-gray-900/50 p-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <span className="text-sm text-gray-400">
            Советник анализирует данные...
          </span>
        </div>
      </div>
    );
  }

  if (!advice) return null;

  const focusColors: Record<string, string> = {
    "streak-recovery": "border-red-500/50 bg-red-950/20",
    quests: "border-blue-500/50 bg-blue-950/20",
    boss: "border-orange-500/50 bg-orange-950/20",
    onboarding: "border-green-500/50 bg-green-950/20",
    general: "border-purple-500/50 bg-purple-950/20",
  };

  const borderClass =
    focusColors[advice.focusArea] ?? focusColors.general;

  return (
    <div
      className={`rounded-xl border ${borderClass} p-4 transition-all duration-300`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h3 className="text-sm font-bold text-white">
            AI-Советник
          </h3>
        </div>
        <button
          onClick={() => void loadAdvice()}
          className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          title="Обновить совет"
        >
          🔄
        </button>
      </div>

      {/* Greeting */}
      <p className="mb-3 text-sm font-medium text-gray-200">
        {advice.greeting}
      </p>

      {/* Tips */}
      <div className="space-y-2">
        {advice.tips
          .slice(0, expanded ? undefined : 2)
          .map((tip, i) => (
            <p key={i} className="text-xs leading-relaxed text-gray-300">
              {tip}
            </p>
          ))}
      </div>

      {advice.tips.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-purple-400 hover:text-purple-300"
        >
          {expanded
            ? "Свернуть"
            : `Ещё ${advice.tips.length - 2} советов...`}
        </button>
      )}

      {/* Motivation */}
      <div className="mt-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2">
        <p className="text-xs italic text-gray-400">
          &quot;{advice.motivation}&quot;
        </p>
      </div>
    </div>
  );
}