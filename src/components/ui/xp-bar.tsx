'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';

function xpToNextLevel(level: number): number {
  return 500 + level * 250;
}

interface StatsLevel {
  level: number;
  currentXP: number;
  xpToNext: number;
}

function useStatsLevel() {
  return useQuery<StatsLevel | null>({
    queryKey: ['stats-level'],
    queryFn: async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data } = await supabase
          .from('stats')
          .select('level, current_xp')
          .eq('user_id', user.id)
          .maybeSingle();

        // Если строки нет — создаём
        if (!data) {
          const { data: created } = await supabase
            .from('stats')
            .insert({ user_id: user.id, level: 1, current_xp: 0 })
            .select('level, current_xp')
            .maybeSingle();

          const lvl = created?.level ?? 1;
          return { level: lvl, currentXP: created?.current_xp ?? 0, xpToNext: xpToNextLevel(lvl) };
        }

        const level = data.level || 1;
        const currentXP = data.current_xp || 0;
        const xpToNext = xpToNextLevel(level);

        return { level, currentXP, xpToNext };
      } catch {
        return null;
      }
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

interface XPBarProps {
  compact?: boolean;
}

export function XPBar({ compact = false }: XPBarProps) {
  const { t } = useT();
  const { data: level, isLoading } = useStatsLevel();
  const [pulse, setPulse] = useState(false);
  const prevXP = useRef<number | null>(null);

  useEffect(() => {
    if (level && prevXP.current !== null && level.currentXP !== prevXP.current) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 800);
      return () => clearTimeout(timer);
    }
    if (level) prevXP.current = level.currentXP;
  }, [level]);

  if (isLoading) {
    return (
      <div className={`${compact ? 'h-6' : 'h-10'} animate-pulse rounded-lg bg-white/5`} />
    );
  }

  if (!level) return null;

  const pct =
    level.xpToNext > 0
      ? Math.min((level.currentXP / level.xpToNext) * 100, 100)
      : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`shrink-0 text-xs font-bold text-violet-400 transition-transform duration-300 ${pulse ? 'scale-125' : 'scale-100'}`}>
          {t.xpBar.level}{level.level}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              boxShadow: pulse ? '0 0 12px #7c3aed80' : 'none',
            }}
          />
        </div>
        <span className={`shrink-0 text-[10px] tabular-nums transition-colors duration-300 ${pulse ? 'text-violet-400' : 'text-gray-500'}`}>
          {level.currentXP}/{level.xpToNext}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold transition-all duration-300 ${pulse ? 'text-violet-300 scale-110' : 'text-violet-400 scale-100'}`}>
          {t.xpBar.level}{level.level}
        </span>
        <span className={`text-[10px] tabular-nums transition-colors duration-300 ${pulse ? 'text-violet-400' : 'text-gray-500'}`}>
          {level.currentXP} / {level.xpToNext} XP
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 via-violet-500 to-violet-400 transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            boxShadow: pulse ? '0 0 16px #7c3aed60' : 'none',
          }}
        />
      </div>
    </div>
  );
}