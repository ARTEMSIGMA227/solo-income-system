'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getLevelInfo } from '@/lib/xp';
import { XP_REWARDS } from '@/lib/constants';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';
import { useProfile } from '@/hooks/use-profile';
import { canUseFocus, PRO_LIMITS } from '@/lib/pro';
import { ProLimitBadge } from '@/components/ui/pro-gate';
import type { Stats, Profile } from '@/types/database';

export default function FocusPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [localProfile, setLocalProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [selectedMinutes, setSelectedMinutes] = useState(90);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { t, locale } = useT();
  const { data: proProfile } = useProfile();

  const isPro = proProfile?.is_pro === true;
  const canStart = canUseFocus(sessionsToday, isPro);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: s } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setStats(s);

      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setLocalProfile(p);
      if (p) setSelectedMinutes(p.focus_duration_minutes || 90);

      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
      const { data: todayEvents } = await supabase
        .from('xp_events')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_type', 'focus_bonus')
        .eq('event_date', today);
      setSessionsToday(todayEvents?.length || 0);

      setLoading(false);
    }
    load();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startTimer() {
    if (!canStart) {
      toast.error(
        locale === 'ru'
          ? `Лимит: ${PRO_LIMITS.FREE_MAX_FOCUS_PER_DAY} сессий/день. Оформите PRO для безлимита!`
          : `Limit: ${PRO_LIMITS.FREE_MAX_FOCUS_PER_DAY} sessions/day. Get PRO for unlimited!`
      );
      return;
    }

    const seconds = selectedMinutes * 60;
    setTimeLeft(seconds);
    setTotalTime(seconds);
    setIsRunning(true);
    setIsPaused(false);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function pauseTimer() {
    if (isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setIsPaused(false);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPaused(true);
    }
  }

  function stopTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(0);
  }

  async function handleComplete() {
    if (!userId || !stats) return;
    setIsRunning(false);
    setIsPaused(false);

    const supabase = createClient();
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
    const xp = XP_REWARDS.focus_bonus;
    const gold = 25;

    await supabase.from('xp_events').insert({
      user_id: userId,
      event_type: 'focus_bonus',
      xp_amount: xp,
      description: t.focus.blockDesc(selectedMinutes),
      event_date: today,
    });

    await supabase.from('gold_events').insert({
      user_id: userId,
      amount: gold,
      event_type: 'quest_reward',
      description: t.focus.blockDesc(selectedMinutes),
      event_date: today,
    });

    const newTotalEarned = stats.total_xp_earned + xp;
    const newGold = (stats.gold || 0) + gold;
    const newTotalGold = (stats.total_gold_earned || 0) + gold;
    const levelInfo = getLevelInfo(newTotalEarned, stats.total_xp_lost);

    await supabase
      .from('stats')
      .update({
        level: levelInfo.level,
        current_xp: levelInfo.currentXP,
        total_xp_earned: newTotalEarned,
        gold: newGold,
        total_gold_earned: newTotalGold,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    setStats({
      ...stats,
      level: levelInfo.level,
      current_xp: levelInfo.currentXP,
      total_xp_earned: newTotalEarned,
      gold: newGold,
      total_gold_earned: newTotalGold,
    });

    setSessionsToday((prev) => prev + 1);
    toast.success(t.focus.blockComplete(selectedMinutes, xp, gold));

    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          color: '#a78bfa',
        }}
      >
        {t.focus.loading}
      </div>
    );
  }

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0f',
        color: '#e2e8f0',
        padding: '16px',
        maxWidth: '600px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', alignSelf: 'flex-start', width: '100%' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
          {t.focus.title}
        </h1>
        <ProLimitBadge
          current={sessionsToday}
          max={PRO_LIMITS.FREE_MAX_FOCUS_PER_DAY}
          isPro={isPro}
        />
      </div>
      <div
        style={{
          fontSize: '13px',
          color: '#94a3b8',
          marginBottom: '24px',
          alignSelf: 'flex-start',
        }}
      >
        {t.focus.sessionsToday}: {sessionsToday}{!isPro ? `/${PRO_LIMITS.FREE_MAX_FOCUS_PER_DAY}` : ''} | +{XP_REWARDS.focus_bonus} XP +25 🪙{' '}
        {t.focus.perBlock}
      </div>

      {/* Circular timer */}
      <div
        style={{ position: 'relative', width: '280px', height: '280px', marginBottom: '24px' }}
      >
        <svg width="280" height="280" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="140" cy="140" r="120" stroke="#1e1e2e" strokeWidth="8" fill="none" />
          <circle
            cx="140"
            cy="140"
            r="120"
            stroke={isRunning ? (isPaused ? '#eab308' : '#7c3aed') : '#1e1e2e'}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: isRunning ? '48px' : '40px',
              fontWeight: 800,
              color: isRunning ? (isPaused ? '#eab308' : '#a78bfa') : '#e2e8f0',
              fontFamily: 'monospace',
            }}
          >
            {isRunning ? formatTime(timeLeft) : formatTime(selectedMinutes * 60)}
          </div>
          {isRunning && (
            <div
              style={{
                fontSize: '12px',
                color: isPaused ? '#eab308' : '#94a3b8',
                marginTop: '4px',
              }}
            >
              {isPaused ? t.focus.paused : t.focus.focusing}
            </div>
          )}
        </div>
      </div>

      {/* Duration selector */}
      {!isRunning && (
        <div style={{ marginBottom: '24px', width: '100%' }}>
          <div
            style={{
              fontSize: '13px',
              color: '#94a3b8',
              marginBottom: '8px',
              textAlign: 'center',
            }}
          >
            {t.focus.duration}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {[25, 45, 60, 90, 120].map((min) => (
              <button
                key={min}
                onClick={() => setSelectedMinutes(min)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  backgroundColor: selectedMinutes === min ? '#7c3aed' : '#16161f',
                  border: `1px solid ${selectedMinutes === min ? '#7c3aed' : '#1e1e2e'}`,
                  color: selectedMinutes === min ? '#fff' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {min}{t.focus.minutes}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '300px' }}>
        {!isRunning ? (
          <button
            onClick={startTimer}
            disabled={!canStart}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: canStart ? '#7c3aed' : '#1e1e2e',
              color: canStart ? '#fff' : '#475569',
              cursor: canStart ? 'pointer' : 'not-allowed',
              fontSize: '18px',
              fontWeight: 700,
              opacity: canStart ? 1 : 0.6,
            }}
          >
            {canStart ? t.focus.start : `🔒 ${t.focus.start}`}
          </button>
        ) : (
          <>
            <button
              onClick={pauseTimer}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: isPaused ? '#22c55e' : '#eab308',
                color: '#000',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 700,
              }}
            >
              {isPaused ? t.focus.resume : t.focus.pause}
            </button>
            <button
              onClick={stopTimer}
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#ef4444',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 700,
              }}
            >
              {t.focus.stop}
            </button>
          </>
        )}
      </div>

      {/* Limit warning */}
      {!canStart && !isRunning && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: '#7c3aed10',
            border: '1px solid #7c3aed30',
            borderRadius: '10px',
            textAlign: 'center',
            width: '100%',
            maxWidth: '300px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#a78bfa', marginBottom: '4px' }}>
            {locale === 'ru'
              ? `Лимит ${PRO_LIMITS.FREE_MAX_FOCUS_PER_DAY} сессии/день исчерпан`
              : `${PRO_LIMITS.FREE_MAX_FOCUS_PER_DAY} sessions/day limit reached`}
          </div>
          <a
            href="/subscription"
            style={{
              fontSize: '12px',
              color: '#c084fc',
              textDecoration: 'underline',
            }}
          >
            {locale === 'ru' ? '👑 Безлимит с PRO' : '👑 Unlimited with PRO'}
          </a>
        </div>
      )}

      {/* Rules */}
      <div
        style={{
          backgroundColor: '#12121a',
          border: '1px solid #1e1e2e',
          borderRadius: '12px',
          padding: '16px',
          marginTop: '24px',
          width: '100%',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
          {t.focus.rules.title}
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.8 }}>
          • {t.focus.rules.rule1}
          <br />
          • {t.focus.rules.rule2}
          <br />
          • {t.focus.rules.rule3}
          <br />
          • {t.focus.rules.rule4}
          <br />• {t.focus.rules.rule5(XP_REWARDS.focus_bonus, 25)}
        </div>
      </div>

      <div style={{ height: '80px' }} />
    </div>
  );
}