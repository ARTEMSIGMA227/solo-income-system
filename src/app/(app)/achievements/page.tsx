'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getLevelInfo } from '@/lib/xp';
import { ACHIEVEMENTS, getRarityColor, getRarityLabel, getAchievementName, getAchievementDescription } from '@/lib/achievements';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';
import type { Stats, Profile, Achievement } from '@/types/database';
import type { AchievementStats } from '@/lib/achievements';

export default function AchievementsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unlocked, setUnlocked] = useState<Achievement[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [todayActions, setTodayActions] = useState(0);
  const { t } = useT();

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
      setProfile(p);

      const { data: a } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id);
      setUnlocked(a || []);

      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
      const { data: ct } = await supabase
        .from('completions')
        .select('count_done')
        .eq('user_id', user.id)
        .eq('completion_date', today);
      setTodayActions(ct?.reduce((sum, c) => sum + c.count_done, 0) || 0);

      setLoading(false);
    }
    load();
  }, []);

  async function claimAchievement(achievementKey: string) {
    if (!userId || !stats) return;
    const def = ACHIEVEMENTS.find((a) => a.key === achievementKey);
    if (!def) return;

    const supabase = createClient();
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
    const achName = getAchievementName(def.key, t);

    const { data: newAch } = await supabase
      .from('achievements')
      .insert({ user_id: userId, achievement_key: achievementKey })
      .select()
      .single();

    if (!newAch) return;

    if (def.xpReward > 0) {
      await supabase.from('xp_events').insert({
        user_id: userId,
        event_type: 'perk_bonus',
        xp_amount: def.xpReward,
        description: `Achievement: ${achName}`,
        event_date: today,
      });
    }

    if (def.goldReward > 0) {
      await supabase.from('gold_events').insert({
        user_id: userId,
        amount: def.goldReward,
        event_type: 'achievement',
        description: `Achievement: ${achName}`,
        event_date: today,
      });
    }

    const newXP = stats.total_xp_earned + def.xpReward;
    const newGold = (stats.gold || 0) + def.goldReward;
    const newTotalGold = (stats.total_gold_earned || 0) + def.goldReward;
    const levelInfo = getLevelInfo(newXP, stats.total_xp_lost);

    await supabase
      .from('stats')
      .update({
        level: levelInfo.level,
        current_xp: levelInfo.currentXP,
        total_xp_earned: newXP,
        gold: newGold,
        total_gold_earned: newTotalGold,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    setStats({
      ...stats,
      total_xp_earned: newXP,
      gold: newGold,
      total_gold_earned: newTotalGold,
      level: levelInfo.level,
      current_xp: levelInfo.currentXP,
    });
    setUnlocked((prev) => [...prev, newAch]);

    toast.success(t.achievements.achievementClaimed(achName, def.xpReward, def.goldReward));
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
        {t.achievements.loading}
      </div>
    );
  }

  const levelInfo = stats
    ? getLevelInfo(stats.total_xp_earned, stats.total_xp_lost)
    : { level: 1 };

  const achievementStats: AchievementStats = {
    totalActions: stats?.total_actions || 0,
    totalIncome: Number(stats?.total_income || 0),
    totalSales: stats?.total_sales || 0,
    totalClients: stats?.total_clients || 0,
    streakCurrent: profile?.streak_current || 0,
    streakBest: profile?.streak_best || 0,
    level: levelInfo.level,
    totalXpEarned: stats?.total_xp_earned || 0,
    totalGoldEarned: stats?.total_gold_earned || 0,
    todayActions,
    sessionsToday: 0,
  };

  const unlockedKeys = new Set(unlocked.map((a) => a.achievement_key));
  const filtered =
    filter === 'all' ? ACHIEVEMENTS : ACHIEVEMENTS.filter((a) => a.category === filter);
  const totalUnlocked = unlocked.length;
  const totalAchievements = ACHIEVEMENTS.length;

  const sorted = [...filtered].sort((a, b) => {
    const aUnlocked = unlockedKeys.has(a.key);
    const bUnlocked = unlockedKeys.has(b.key);
    const aCanClaim = !aUnlocked && a.check(achievementStats);
    const bCanClaim = !bUnlocked && b.check(achievementStats);

    if (aCanClaim && !bCanClaim) return -1;
    if (!aCanClaim && bCanClaim) return 1;
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return 0;
  });

  const filterOptions = [
    { value: 'all', label: t.achievements.filters.all },
    { value: 'actions', label: t.achievements.filters.actions },
    { value: 'income', label: t.achievements.filters.income },
    { value: 'streak', label: t.achievements.filters.streak },
    { value: 'level', label: t.achievements.filters.level },
    { value: 'special', label: t.achievements.filters.special },
  ];

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>🏆 {t.achievements.title}</h1>
        <div style={{ fontSize: '14px', color: '#94a3b8' }}>
          {totalUnlocked}/{totalAchievements}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
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
              width: `${Math.round((totalUnlocked / totalAchievements) * 100)}%`,
              height: '100%',
              borderRadius: '4px',
              background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
            }}
          />
        </div>
      </div>

      <div
        style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}
      >
        {filterOptions.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: filter === f.value ? '#7c3aed20' : '#16161f',
              border: `1px solid ${filter === f.value ? '#7c3aed' : '#1e1e2e'}`,
              color: '#e2e8f0',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {sorted.map((ach) => {
        const isUnlocked = unlockedKeys.has(ach.key);
        const canClaim = !isUnlocked && ach.check(achievementStats);
        const color = getRarityColor(ach.rarity);
        const achName = getAchievementName(ach.key, t);
        const achDesc = getAchievementDescription(ach.key, t);

        return (
          <div
            key={ach.key}
            style={{
              backgroundColor: isUnlocked
                ? '#12201a'
                : canClaim
                  ? '#1a1a0f'
                  : '#12121a',
              border: `1px solid ${isUnlocked ? '#22c55e30' : canClaim ? '#f59e0b30' : '#1e1e2e'}`,
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '8px',
              opacity: isUnlocked || canClaim ? 1 : 0.5,
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div
                style={{
                  fontSize: '28px',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isUnlocked ? '#22c55e15' : '#16161f',
                  borderRadius: '10px',
                  border: `1px solid ${isUnlocked ? '#22c55e30' : '#1e1e2e'}`,
                }}
              >
                {isUnlocked ? ach.icon : '🔒'}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '2px',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{achName}</span>
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: color + '20',
                      color,
                    }}
                  >
                    {getRarityLabel(ach.rarity, t)}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{achDesc}</div>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px' }}>
                  +{ach.xpReward} XP +{ach.goldReward} 🪙
                </div>
              </div>
              {canClaim && (
                <button
                  onClick={() => claimAchievement(ach.key)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#f59e0b',
                    color: '#000',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.achievements.claim}
                </button>
              )}
              {isUnlocked && <div style={{ fontSize: '20px' }}>✅</div>}
            </div>
          </div>
        );
      })}

      <div style={{ height: '80px' }} />
    </div>
  );
}