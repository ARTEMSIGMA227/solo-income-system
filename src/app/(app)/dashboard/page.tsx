'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getLevelInfo } from '@/lib/xp';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { XP_REWARDS } from '@/lib/constants';
import { toast } from 'sonner';
import HunterAvatar from '@/components/character/HunterAvatar';
import CharacterEditor from '@/components/character/CharacterEditor';
import type { User } from '@supabase/supabase-js';
import type { Stats, Profile, CharacterConfig } from '@/types/database';
import StreakBanner from '@/components/streak/StreakBanner';
import DeathScreen from '@/components/streak/DeathScreen';
import { AdvisorCard } from '@/components/advisor/AdvisorCard';
import { generateAdvice } from '@/lib/advisor';
import DailyChallenge from './DailyChallenge';
import { DailyMissionsCard } from '@/components/dashboard/daily-missions-card';
import { useMissionTracker } from '@/hooks/use-mission-tracker';
import LevelUpPopup from '@/components/effects/LevelUpPopup';
import { FloatXPContainer, useFloatXP } from '@/components/effects/FloatXP';
import XPBar from '@/components/effects/XPBar';
import { useSkills } from '@/hooks/use-skills';
import { applySkillEffects, applyPenaltyReduction } from '@/lib/skill-effects';

function getToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
}

function getMonthStart(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-01`;
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [charConfig, setCharConfig] = useState<CharacterConfig | null>(null);
  const [todayActions, setTodayActions] = useState(0);
  const [todayIncome, setTodayIncome] = useState(0);
  const [monthIncome, setMonthIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentHour, setCurrentHour] = useState(12);
  const [todayDate, setTodayDate] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [showDeath, setShowDeath] = useState(false);
  const [deathType, setDeathType] = useState<'miss' | 'level_down'>('miss');
  const [deathXP, setDeathXP] = useState(100);
  const [deathMisses, setDeathMisses] = useState(0);
  const [xpPulsing, setXpPulsing] = useState(false);

  const router = useRouter();
  const { trackProgress } = useMissionTracker();
  const { items: floatItems, addFloat } = useFloatXP();
  const [levelUpData, setLevelUpData] = useState<{ level: number; title: string } | null>(null);
  const prevLevelRef = useRef<number | null>(null);
  const dataLoadedRef = useRef(false);

  // Skills — загружаем после получения user/stats
  const {
    effects: skillEffects,
    loading: skillsLoading,
  } = useSkills(user?.id, stats?.level ?? 1);

  // ─── LOAD DATA ───
  useEffect(() => {
    setCurrentHour(new Date().getHours());
    setTodayDate(
      new Date().toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    );

    const supabase = createClient();

    async function loadData() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/auth');
        return;
      }
      setUser(authUser);

      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      setProfile(p);

      const { data: s } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', authUser.id)
        .single();
      if (s) {
        setStats(s);
        prevLevelRef.current = s.level;
      }

      const { data: cc } = await supabase
        .from('character_config')
        .select('*')
        .eq('user_id', authUser.id)
        .single();
      setCharConfig(cc);

      const today = getToday();

      const { data: ct } = await supabase
        .from('completions')
        .select('count_done')
        .eq('user_id', authUser.id)
        .eq('completion_date', today);
      const loadedActions = ct?.reduce((sum, c) => sum + c.count_done, 0) || 0;
      setTodayActions(loadedActions);

      const { data: it } = await supabase
        .from('income_events')
        .select('amount')
        .eq('user_id', authUser.id)
        .eq('event_date', today);
      setTodayIncome(it?.reduce((sum, i) => sum + Number(i.amount), 0) || 0);

      const { data: im } = await supabase
        .from('income_events')
        .select('amount')
        .eq('user_id', authUser.id)
        .gte('event_date', getMonthStart());
      setMonthIncome(im?.reduce((sum, i) => sum + Number(i.amount), 0) || 0);

      const yesterdayStr = getYesterday();

      const { data: yesterdayCompletions } = await supabase
        .from('completions')
        .select('count_done')
        .eq('user_id', authUser.id)
        .eq('completion_date', yesterdayStr);

      const yesterdayActions =
        yesterdayCompletions?.reduce((sum, c) => sum + c.count_done, 0) || 0;
      const target = p?.daily_actions_target || 30;

      let currentProfile = p;

      const { data: penaltyCheck } = await supabase
        .from('xp_events')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('event_type', 'penalty_miss')
        .eq('event_date', yesterdayStr);

      const alreadyPenalized = penaltyCheck && penaltyCheck.length > 0;

      if (yesterdayActions < target && !alreadyPenalized && yesterdayStr !== today) {
        const basePenaltyXP = p?.penalty_xp || 100;
        const newMisses = (p?.consecutive_misses || 0) + 1;

        await supabase.from('xp_events').insert({
          user_id: authUser.id,
          event_type: 'penalty_miss',
          xp_amount: -basePenaltyXP,
          description: `Пропуск дня: ${yesterdayStr}`,
          event_date: yesterdayStr,
        });

        const profileUpdate: Record<string, unknown> = {
          consecutive_misses: newMisses,
          updated_at: new Date().toISOString(),
        };
        if (yesterdayActions === 0) profileUpdate.streak_current = 0;

        await supabase.from('profiles').update(profileUpdate).eq('id', authUser.id);

        const newTotalLost = (s?.total_xp_lost || 0) + basePenaltyXP;
        const updateData: {
          total_xp_lost: number;
          updated_at: string;
          level?: number;
          current_xp?: number;
        } = {
          total_xp_lost: newTotalLost,
          updated_at: new Date().toISOString(),
        };

        if (newMisses >= 3) {
          updateData.level = Math.max((s?.level || 1) - 1, 1);
          updateData.current_xp = 0;
          setDeathType('level_down');
          await supabase
            .from('profiles')
            .update({ consecutive_misses: 0 })
            .eq('id', authUser.id);
        } else {
          setDeathType('miss');
        }

        await supabase.from('stats').update(updateData).eq('user_id', authUser.id);
        setDeathXP(basePenaltyXP);
        setDeathMisses(newMisses);
        setShowDeath(true);

        const { data: freshStats } = await supabase
          .from('stats')
          .select('*')
          .eq('user_id', authUser.id)
          .single();
        if (freshStats) {
          setStats(freshStats);
          prevLevelRef.current = freshStats.level;
        }
        const { data: freshProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        if (freshProfile) {
          currentProfile = freshProfile;
          setProfile(freshProfile);
        }
      }

      if (loadedActions > 0 && currentProfile) {
        const { data: streakCheck } = await supabase
          .from('xp_events')
          .select('id')
          .eq('user_id', authUser.id)
          .eq('event_type', 'streak_checkin')
          .eq('event_date', today);

        if (!streakCheck || streakCheck.length === 0) {
          const hadYesterday = yesterdayActions > 0;
          const currentStreak = currentProfile.streak_current || 0;
          const newStreak = hadYesterday ? currentStreak + 1 : 1;
          const newBest = Math.max(newStreak, currentProfile.streak_best || 0);

          await supabase
            .from('profiles')
            .update({
              streak_current: newStreak,
              streak_best: newBest,
              consecutive_misses: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentProfile.id);

          await supabase.from('xp_events').insert({
            user_id: authUser.id,
            event_type: 'streak_checkin',
            xp_amount: 0,
            description: `Серия: день ${newStreak}`,
            event_date: today,
          });

          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  streak_current: newStreak,
                  streak_best: newBest,
                  consecutive_misses: 0,
                }
              : prev
          );
          void trackProgress('login_streak', 1);
        }
      }

      setLoading(false);
    }

    loadData();
  }, [router, trackProgress]);

  // ─── PASSIVE GOLD FROM SKILLS (once per day) ───
  useEffect(() => {
    if (skillsLoading || !user || !stats || dataLoadedRef.current) return;
    const passiveGold = skillEffects.daily_gold_passive || 0;
    if (passiveGold <= 0) {
      dataLoadedRef.current = true;
      return;
    }

    const supabase = createClient();
    const today = getToday();

    async function grantPassiveGold() {
      const { data: check } = await supabase
        .from('gold_events')
        .select('id')
        .eq('user_id', user!.id)
        .eq('event_type', 'skill_passive')
        .eq('event_date', today);

      if (check && check.length > 0) {
        dataLoadedRef.current = true;
        return;
      }

      await supabase.from('gold_events').insert({
        user_id: user!.id,
        amount: passiveGold,
        event_type: 'skill_passive',
        description: `Пассивный доход (навыки): +${passiveGold}`,
        event_date: today,
      });

      await supabase
        .from('stats')
        .update({
          gold: (stats!.gold || 0) + passiveGold,
          total_gold_earned: (stats!.total_gold_earned || 0) + passiveGold,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user!.id);

      setStats((prev) =>
        prev
          ? {
              ...prev,
              gold: (prev.gold || 0) + passiveGold,
              total_gold_earned: (prev.total_gold_earned || 0) + passiveGold,
            }
          : prev
      );

      toast.info(`🧬 +${passiveGold} 🪙 пассивный доход от навыков`);
      dataLoadedRef.current = true;
    }

    grantPassiveGold();
  }, [skillsLoading, skillEffects, user, stats]);

  // ─── STREAK ON FIRST ACTION ───
  const updateStreakOnFirstAction = useCallback(async () => {
    if (!user || !profile) return;
    const supabase = createClient();
    const today = getToday();

    const { data: check } = await supabase
      .from('xp_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_type', 'streak_checkin')
      .eq('event_date', today);
    if (check && check.length > 0) return;

    const yesterdayStr = getYesterday();

    const { data: yd } = await supabase
      .from('completions')
      .select('count_done')
      .eq('user_id', user.id)
      .eq('completion_date', yesterdayStr);

    const hadYesterday = (yd?.reduce((s, c) => s + c.count_done, 0) || 0) > 0;
    const currentStreak = profile.streak_current || 0;
    const newStreak = hadYesterday ? currentStreak + 1 : 1;
    const newBest = Math.max(newStreak, profile.streak_best || 0);

    await supabase
      .from('profiles')
      .update({
        streak_current: newStreak,
        streak_best: newBest,
        consecutive_misses: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    await supabase.from('xp_events').insert({
      user_id: user.id,
      event_type: 'streak_checkin',
      xp_amount: 0,
      description: `Серия: день ${newStreak}`,
      event_date: today,
    });

    setProfile((prev) =>
      prev
        ? { ...prev, streak_current: newStreak, streak_best: newBest, consecutive_misses: 0 }
        : prev
    );
    if (newStreak > 1) toast(`🔥 Серия: ${newStreak} дней подряд!`, { icon: '🔥' });
    void trackProgress('login_streak', 1);
  }, [user, profile, trackProgress]);

  const triggerXpPulse = useCallback(() => {
    setXpPulsing(true);
    setTimeout(() => setXpPulsing(false), 1500);
  }, []);

  // ─── QUICK ACTION (with skills) ───
  async function quickAction(type: string, label: string, event?: React.MouseEvent) {
    if (!user || !stats || !profile) return;
    const supabase = createClient();
    const today = getToday();
    const baseXP = XP_REWARDS[type as keyof typeof XP_REWARDS] || 5;
    const baseGold = Math.round(baseXP * 0.5);

    const actionType = type as 'action' | 'task' | 'hard_task';
    const { finalXP, finalGold, isCrit, bonusParts } = applySkillEffects(
      baseXP,
      baseGold,
      skillEffects,
      {
        actionType,
        hour: new Date().getHours(),
        todayActions,
        streak: profile.streak_current || 0,
        dailyTarget: profile.daily_actions_target || 30,
      }
    );

    await supabase
      .from('completions')
      .insert({ user_id: user.id, completion_date: today, count_done: 1, notes: label });
    await supabase.from('xp_events').insert({
      user_id: user.id,
      event_type: type,
      xp_amount: finalXP,
      description: label,
      event_date: today,
    });
    await supabase.from('gold_events').insert({
      user_id: user.id,
      amount: finalGold,
      event_type: 'quest_reward',
      description: label,
      event_date: today,
    });

    const newTotalEarned = stats.total_xp_earned + finalXP;
    const newActions = stats.total_actions + 1;
    const newGold = (stats.gold || 0) + finalGold;
    const newTotalGold = (stats.total_gold_earned || 0) + finalGold;
    const levelInfo = getLevelInfo(newTotalEarned, stats.total_xp_lost);

    const oldLevel = stats.level;
    const newLevel = levelInfo.level;

    await supabase
      .from('stats')
      .update({
        level: newLevel,
        current_xp: levelInfo.currentXP,
        total_xp_earned: newTotalEarned,
        total_actions: newActions,
        gold: newGold,
        total_gold_earned: newTotalGold,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    setStats({
      ...stats,
      level: newLevel,
      current_xp: levelInfo.currentXP,
      total_xp_earned: newTotalEarned,
      total_actions: newActions,
      gold: newGold,
      total_gold_earned: newTotalGold,
    });

    if (todayActions === 0) await updateStreakOnFirstAction();
    setTodayActions((prev) => prev + 1);

    // Toast with skill bonuses
    const bonusText = bonusParts.length > 0 ? ` (${bonusParts.join(', ')})` : '';
    toast.success(`+${finalXP} XP  +${finalGold} 🪙 — ${label}${bonusText}`);

    if (isCrit) {
      setTimeout(() => {
        toast('⚡ КРИТИЧЕСКИЙ УДАР! XP x2!', {
          icon: '⚡',
          style: { background: '#f59e0b', color: '#000', fontWeight: 700 },
        });
      }, 300);
    }

    // Float effects from button
    const xpColor = isCrit ? '#f59e0b' : '#a78bfa';
    addFloat(`+${finalXP} XP${isCrit ? ' ⚡' : ''}`, xpColor, event);
    setTimeout(() => addFloat(`+${finalGold} 🪙`, '#f59e0b', event), 150);

    triggerXpPulse();

    if (oldLevel < newLevel) {
      setLevelUpData({ level: newLevel, title: levelInfo.title });
    }

    prevLevelRef.current = newLevel;
    void trackProgress('complete_quests', 1);
  }

  // ─── ADD INCOME (with skills) ───
  async function addIncome(event?: React.MouseEvent) {
    if (!user || !stats || !profile) return;
    const amountStr = prompt('Сумма дохода (€):');
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Некорректная сумма');
      return;
    }

    const source =
      prompt('Источник (sale/contract/freelance/bonus/other):', 'sale') || 'sale';
    const supabase = createClient();
    const today = getToday();

    await supabase
      .from('income_events')
      .insert({ user_id: user.id, amount, source, event_date: today });

    const baseXP = XP_REWARDS.sale;
    const baseGold = 50;

    const { finalXP, finalGold, isCrit, bonusParts } = applySkillEffects(
      baseXP,
      baseGold,
      skillEffects,
      {
        actionType: 'sale',
        hour: new Date().getHours(),
        todayActions,
        streak: profile.streak_current || 0,
        dailyTarget: profile.daily_actions_target || 30,
      }
    );

    await supabase.from('xp_events').insert({
      user_id: user.id,
      event_type: 'sale',
      xp_amount: finalXP,
      description: `Доход: ${amount}€`,
      event_date: today,
    });
    await supabase.from('gold_events').insert({
      user_id: user.id,
      amount: finalGold,
      event_type: 'quest_reward',
      description: `Доход: ${amount}€`,
      event_date: today,
    });

    const newTotalEarned = stats.total_xp_earned + finalXP;
    const newIncome = Number(stats.total_income) + amount;
    const newGold = (stats.gold || 0) + finalGold;
    const newTotalGold = (stats.total_gold_earned || 0) + finalGold;
    const levelInfo = getLevelInfo(newTotalEarned, stats.total_xp_lost);

    const oldLevel = stats.level;
    const newLevel = levelInfo.level;

    await supabase
      .from('stats')
      .update({
        level: newLevel,
        current_xp: levelInfo.currentXP,
        total_xp_earned: newTotalEarned,
        total_income: newIncome,
        total_sales: stats.total_sales + 1,
        gold: newGold,
        total_gold_earned: newTotalGold,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    setStats({
      ...stats,
      level: newLevel,
      current_xp: levelInfo.currentXP,
      total_xp_earned: newTotalEarned,
      total_income: newIncome,
      total_sales: stats.total_sales + 1,
      gold: newGold,
      total_gold_earned: newTotalGold,
    });

    if (todayActions === 0) await updateStreakOnFirstAction();
    setTodayIncome((prev) => prev + amount);
    setMonthIncome((prev) => prev + amount);
    setTodayActions((prev) => prev + 1);

    const bonusText = bonusParts.length > 0 ? ` (${bonusParts.join(', ')})` : '';
    toast.success(
      `+${formatCurrency(amount)} доход! +${finalXP} XP +${finalGold} 🪙${bonusText}`
    );

    if (isCrit) {
      setTimeout(() => {
        toast('⚡ КРИТИЧЕСКИЙ УДАР! XP x2!', {
          icon: '⚡',
          style: { background: '#f59e0b', color: '#000', fontWeight: 700 },
        });
      }, 300);
    }

    const xpColor = isCrit ? '#f59e0b' : '#a78bfa';
    addFloat(`+${finalXP} XP${isCrit ? ' ⚡' : ''}`, xpColor, event);
    setTimeout(() => addFloat(`+${finalGold} 🪙`, '#f59e0b', event), 150);
    setTimeout(() => addFloat(`+${formatCurrency(amount)}`, '#22c55e', event), 300);

    triggerXpPulse();

    if (oldLevel < newLevel) {
      setLevelUpData({ level: newLevel, title: levelInfo.title });
    }

    prevLevelRef.current = newLevel;
    void trackProgress('earn_income', amount);
    void trackProgress('complete_quests', 1);
  }

  // ─── LOADING ───
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
          fontSize: '24px',
        }}
      >
        ⚔️ Загрузка...
      </div>
    );
  }

  // ─── COMPUTED ───
  const levelInfo = stats
    ? getLevelInfo(stats.total_xp_earned, stats.total_xp_lost)
    : {
        level: 1,
        currentXP: 0,
        xpToNext: 750,
        progressPercent: 0,
        title: 'Безымянный',
        titleIcon: '👤',
        totalXPEarned: 0,
      };

  const actionsTarget = profile?.daily_actions_target || 30;
  const actionsPercent = Math.min(
    Math.round((todayActions / actionsTarget) * 100),
    100
  );
  const monthTarget = profile?.monthly_income_target || 150000;
  const monthPercent = Math.min(
    Math.round((monthIncome / monthTarget) * 100),
    100
  );

  let dayStatusColor = '#eab308';
  let dayStatusText = '⏳ В процессе';
  if (actionsPercent >= 100) {
    dayStatusColor = '#22c55e';
    dayStatusText = '✅ День закрыт!';
  } else if (currentHour >= 21) {
    dayStatusColor = '#ef4444';
    dayStatusText = '🔴 Мало времени!';
  }

  // Count active skill bonuses for display
  const activeSkillCount = Object.values(skillEffects).filter((v) => v > 0).length;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0f',
        color: '#e2e8f0',
        padding: '16px',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      {/* Effects */}
      <FloatXPContainer items={floatItems} />
      {levelUpData && (
        <LevelUpPopup
          level={levelUpData.level}
          title={levelUpData.title}
          onClose={() => setLevelUpData(null)}
        />
      )}
      {showDeath && (
        <DeathScreen
          type={deathType}
          xpLost={deathXP}
          consecutiveMisses={deathMisses}
          onAccept={() => setShowDeath(false)}
        />
      )}
      {showEditor && user && (
        <CharacterEditor
          userId={user.id}
          config={charConfig}
          onSave={(c) => {
            setCharConfig(c);
            setShowEditor(false);
          }}
          onClose={() => setShowEditor(false)}
        />
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{todayDate}</div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            {profile?.display_name || 'Охотник'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: '#f59e0b20',
              color: '#f59e0b',
              border: '1px solid #f59e0b30',
            }}
          >
            🪙 {formatNumber(stats?.gold || 0)}
          </div>
          {activeSkillCount > 0 && (
            <div
              style={{
                padding: '6px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: '#a78bfa15',
                color: '#a78bfa',
                border: '1px solid #a78bfa30',
              }}
            >
              🧬 {activeSkillCount}
            </div>
          )}
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              color: dayStatusColor,
              backgroundColor: dayStatusColor + '20',
              border: `1px solid ${dayStatusColor}30`,
            }}
          >
            {dayStatusText}
          </div>
        </div>
      </div>

      {/* Avatar */}
      <HunterAvatar
        level={levelInfo.level}
        title={levelInfo.title}
        config={charConfig}
        onEdit={() => setShowEditor(true)}
      />

      {/* Streak */}
      <div style={{ marginTop: '12px' }}>
        <StreakBanner
          streak={profile?.streak_current || 0}
          bestStreak={profile?.streak_best || 0}
        />
      </div>

      {/* XP Bar */}
      <XPBar
        level={levelInfo.level}
        currentXP={levelInfo.currentXP}
        xpToNext={levelInfo.xpToNext}
        progressPercent={levelInfo.progressPercent}
        pulsing={xpPulsing}
      />

      {/* Advisor */}
      {profile &&
        stats &&
        (() => {
          const now = new Date();
          const { greeting, advice } = generateAdvice({
            stats,
            profile,
            todayActions,
            todayIncome,
            monthIncome,
            hour: currentHour,
            dayOfWeek: now.getDay(),
            dayOfMonth: now.getDate(),
            daysInMonth: new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              0
            ).getDate(),
          });
          if (advice.length === 0) return null;
          return <AdvisorCard greeting={greeting} advice={advice} />;
        })()}

      {/* Missions */}
      <div style={{ marginBottom: '12px' }}>
        <DailyMissionsCard />
      </div>
      <DailyChallenge />

      {/* Stats Card */}
      <div
        style={{
          backgroundColor: '#12121a',
          border: '1px solid #1e1e2e',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '12px',
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              marginBottom: '4px',
            }}
          >
            <span>Действия</span>
            <span style={{ color: '#a78bfa' }}>
              {todayActions} / {actionsTarget}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#16161f',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${actionsPercent}%`,
                height: '100%',
                borderRadius: '4px',
                backgroundColor: actionsPercent >= 100 ? '#22c55e' : '#7c3aed',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div
            style={{
              flex: 1,
              backgroundColor: '#16161f',
              borderRadius: '8px',
              padding: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Сегодня</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>
              {formatCurrency(todayIncome)}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: '#16161f',
              borderRadius: '8px',
              padding: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              Месяц ({monthPercent}%)
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#a78bfa' }}>
              {formatCurrency(monthIncome)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          backgroundColor: '#12121a',
          border: '1px solid #1e1e2e',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '12px',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          ⚡ Быстрые действия
          {activeSkillCount > 0 && (
            <span
              style={{
                fontSize: '10px',
                color: '#a78bfa',
                marginLeft: '8px',
                fontWeight: 400,
              }}
            >
              🧬 навыки активны
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { type: 'action', label: 'Звонок', actionLabel: '+1 Звонок', icon: '📞', xp: 5, gold: 2 },
            { type: 'action', label: 'Касание', actionLabel: '+1 Касание', icon: '💬', xp: 5, gold: 2 },
            { type: 'action', label: 'Лид', actionLabel: '+1 Лид', icon: '🎯', xp: 5, gold: 2 },
            { type: 'task', label: 'Задача', actionLabel: 'Задача', icon: '✅', xp: 25, gold: 12 },
            { type: 'hard_task', label: 'Сложная', actionLabel: 'Сложная', icon: '🔥', xp: 50, gold: 25 },
            { type: 'income', label: 'Доход', actionLabel: 'Доход', icon: '💰', xp: 100, gold: 50 },
          ].map((btn, i) => {
            const isIncome = btn.type === 'income';
            return (
              <button
                key={i}
                onClick={(e) => {
                  if (isIncome) {
                    void addIncome(e);
                  } else {
                    void quickAction(btn.type, btn.actionLabel, e);
                  }
                }}
                onPointerDown={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.93)';
                }}
                onPointerUp={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
                onPointerLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
                style={{
                  padding: '12px 8px',
                  backgroundColor: isIncome ? '#1a1a2e' : '#16161f',
                  border: `1px solid ${isIncome ? '#22c55e30' : '#1e1e2e'}`,
                  borderRadius: '10px',
                  color: isIncome ? '#22c55e' : '#e2e8f0',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textAlign: 'center',
                  transition: 'transform 0.1s ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ fontSize: '20px' }}>{btn.icon}</div>
                <div style={{ fontSize: '11px', marginTop: '2px' }}>{btn.label}</div>
                <div
                  style={{
                    fontSize: '10px',
                    color: isIncome ? '#22c55e' : '#7c3aed',
                    marginTop: '2px',
                  }}
                >
                  +{btn.xp} XP
                </div>
                <div style={{ fontSize: '9px', color: '#f59e0b', marginTop: '1px' }}>
                  +{btn.gold} 🪙
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height: '32px' }} />
    </div>
  );
}