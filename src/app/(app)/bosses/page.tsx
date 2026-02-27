'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber } from '@/lib/utils';
import { getLevelInfo } from '@/lib/xp';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';
import { useProfile } from '@/hooks/use-profile';
import { ProGate, ProLimitBadge } from '@/components/ui/pro-gate';
import { PRO_LIMITS } from '@/lib/pro';
import type { Boss, Stats } from '@/types/database';
import { loadSkillEffectsFromDB, applyBossDamageBonus } from '@/lib/skill-effects';
import type { SkillEffectType } from '@/lib/skill-tree';
import { grantLootbox } from '@/lib/lootbox-rewards';

const BOSS_KEY_MAP: Record<string, string> = {
  weekly: 'routine_guard',
  monthly: 'shadow_monarch',
};

export default function BossesPage() {
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<number>(0);
  const [skillEffects, setSkillEffects] = useState<Partial<Record<SkillEffectType, number>>>({});
  const { t, locale, formatCurrency: fmtCurrency } = useT();
  const { data: profile } = useProfile();

  const isPro = profile?.is_pro === true;

  function getBossTitle(boss: Boss): string {
    const key = BOSS_KEY_MAP[boss.boss_type];
    if (key && t.boss.bossNames[key]) {
      return t.boss.bossNames[key];
    }
    return boss.title;
  }

  function getBossDesc(boss: Boss): string {
    const key = BOSS_KEY_MAP[boss.boss_type];
    if (key && t.boss.bossDescriptions[key]) {
      return t.boss.bossDescriptions[key];
    }
    return boss.description || '';
  }

  useEffect(() => {
    setNow(Date.now());
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const effects = await loadSkillEffectsFromDB(user.id);
      setSkillEffects(effects);

      const { data: statsData } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setStats(statsData);

      let { data: bossesData } = await supabase
        .from('bosses')
        .select('*')
        .eq('user_id', user.id)
        .order('boss_type');

      const activeBosses = (bossesData || []).filter(
        (b) => !b.is_defeated && new Date(b.deadline) >= new Date(),
      );
      if (activeBosses.length === 0) {
        const today = new Date();
        const sundayOffset = 7 - today.getDay();
        const weekDeadline = new Date(today);
        weekDeadline.setDate(today.getDate() + sundayOffset);
        const weekDeadlineStr = weekDeadline.toLocaleDateString('en-CA');
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const monthDeadlineStr = lastDay.toLocaleDateString('en-CA');

        await supabase.from('bosses').insert([
          {
            user_id: user.id,
            title: 'routine_guard',
            boss_type: 'weekly',
            description: 'routine_guard',
            requirements: [
              { metric: 'actions', target: 150 },
              { metric: 'income', target: 25000 },
            ],
            xp_reward: 500,
            deadline: weekDeadlineStr,
          },
          {
            user_id: user.id,
            title: 'shadow_monarch',
            boss_type: 'monthly',
            description: 'shadow_monarch',
            requirements: [
              { metric: 'actions', target: 600 },
              { metric: 'income', target: 150000 },
              { metric: 'sales', target: 10 },
            ],
            xp_reward: 2000,
            deadline: monthDeadlineStr,
          },
        ]);

        const { data: refreshed } = await supabase
          .from('bosses')
          .select('*')
          .eq('user_id', user.id)
          .order('boss_type');
        bossesData = refreshed;
      }

      setBosses(bossesData || []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getBossProgress(boss: Boss, currentStats: Stats | null) {
    if (!currentStats) return [];
    const dmgBonus = skillEffects.boss_damage_bonus || 0;

    return boss.requirements.map((req) => {
      let current = 0;
      switch (req.metric) {
        case 'actions':
          current = currentStats.total_actions;
          break;
        case 'clients':
          current = currentStats.total_clients;
          break;
        case 'income':
          current = Number(currentStats.total_income);
          break;
        case 'sales':
          current = currentStats.total_sales;
          break;
      }

      const effectiveTarget =
        dmgBonus > 0
          ? Math.max(Math.round(req.target * (1 - dmgBonus / 100)), 1)
          : req.target;

      const percent = Math.min(Math.round((current / effectiveTarget) * 100), 100);
      return { ...req, current, effectiveTarget, percent };
    });
  }

  function formatMetricValue(metric: string, value: number) {
    if (metric === 'income') return fmtCurrency(value);
    return formatNumber(value);
  }

  function getDaysLeft(deadline: string) {
    if (!now) return 0;
    return Math.max(
      0,
      Math.ceil((new Date(deadline).getTime() - now) / (1000 * 60 * 60 * 24)),
    );
  }

  async function tryDefeatBoss(boss: Boss) {
    if (!userId || !stats) return;
    const progress = getBossProgress(boss, stats);
    const allDone = progress.every((p) => p.percent >= 100);

    if (!allDone) {
      toast.error(t.boss.notAllDone);
      return;
    }

    const supabase = createClient();
    const bossTitle = getBossTitle(boss);

    const baseReward = boss.xp_reward;
    const finalReward = applyBossDamageBonus(baseReward, skillEffects);

    await supabase
      .from('bosses')
      .update({ is_defeated: true, defeated_at: new Date().toISOString() })
      .eq('id', boss.id);

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
    await supabase.from('xp_events').insert({
      user_id: userId,
      event_type: 'boss_killed',
      xp_amount: finalReward,
      description: `Boss defeated: ${boss.boss_type}${finalReward > baseReward ? ` (skill bonus: +${finalReward - baseReward} XP)` : ''}`,
      event_date: today,
    });

    const newTotalEarned = stats.total_xp_earned + finalReward;
    const levelInfo = getLevelInfo(newTotalEarned, stats.total_xp_lost);

    await supabase
      .from('stats')
      .update({
        level: levelInfo.level,
        current_xp: levelInfo.currentXP,
        total_xp_earned: newTotalEarned,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    setStats({
      ...stats,
      total_xp_earned: newTotalEarned,
      level: levelInfo.level,
      current_xp: levelInfo.currentXP,
    });
    setBosses((prev) =>
      prev.map((b) => (b.id === boss.id ? { ...b, is_defeated: true } : b)),
    );

    const bonusText =
      finalReward > baseReward ? ` (${t.boss.bonusText(finalReward - baseReward)})` : '';
    toast.success(`${t.boss.bossKilled(bossTitle, finalReward)}${bonusText}`);

    const bossBoxType = boss.boss_type === 'monthly' ? 'legendary' as const : 'epic' as const;
    await grantLootbox(supabase, userId!, bossBoxType, 'boss', boss.boss_type);
    toast.success(locale === 'ru' ? '🎁 Лутбокс за босса!' : '🎁 Boss lootbox!');
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
        {t.boss.loading}
      </div>
    );
  }

  const weekly = bosses.filter((b) => b.boss_type === 'weekly');
  const monthly = bosses.filter((b) => b.boss_type === 'monthly');
  const dmgBonus = skillEffects.boss_damage_bonus || 0;

  function renderBoss(boss: Boss) {
    const progress = getBossProgress(boss, stats);
    const allDone = progress.every((p) => p.percent >= 100);
    const daysLeft = getDaysLeft(boss.deadline);
    const bossTitle = getBossTitle(boss);
    const bossDesc = getBossDesc(boss);

    return (
      <div
        key={boss.id}
        style={{
          backgroundColor: boss.is_defeated ? '#12201a' : '#12121a',
          border: `1px solid ${boss.is_defeated ? '#22c55e30' : '#1e1e2e'}`,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: boss.is_defeated ? '#22c55e' : '#e2e8f0',
              }}
            >
              {boss.is_defeated ? '⚔️' : '👹'} {bossTitle}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              {bossDesc}
            </div>
            {dmgBonus > 0 && !boss.is_defeated && (
              <div style={{ fontSize: '10px', color: '#a78bfa', marginTop: '2px' }}>
                {t.boss.dmgBonus(dmgBonus)}
              </div>
            )}
          </div>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: boss.is_defeated
                ? '#22c55e20'
                : daysLeft <= 2
                  ? '#ef444420'
                  : '#16161f',
              color: boss.is_defeated
                ? '#22c55e'
                : daysLeft <= 2
                  ? '#ef4444'
                  : '#94a3b8',
            }}
          >
            {boss.is_defeated ? t.boss.defeated : t.boss.daysLeft(daysLeft)}
          </div>
        </div>

        {progress.map((p, i) => (
          <div key={i} style={{ marginBottom: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                marginBottom: '4px',
              }}
            >
              <span style={{ color: '#94a3b8' }}>
                {t.boss.metrics[p.metric as keyof typeof t.boss.metrics] || p.metric}
                {p.effectiveTarget < p.target && (
                  <span
                    style={{
                      color: '#a78bfa',
                      fontSize: '10px',
                      marginLeft: '4px',
                    }}
                  >
                    ({t.boss.reduced})
                  </span>
                )}
              </span>
              <span style={{ color: p.percent >= 100 ? '#22c55e' : '#a78bfa' }}>
                {formatMetricValue(p.metric, p.current)} /{' '}
                {formatMetricValue(p.metric, p.effectiveTarget)}
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
                  width: `${p.percent}%`,
                  height: '100%',
                  borderRadius: '4px',
                  backgroundColor: p.percent >= 100 ? '#22c55e' : '#7c3aed',
                }}
              />
            </div>
          </div>
        ))}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
          }}
        >
          <span style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 600 }}>
            🏆 {applyBossDamageBonus(boss.xp_reward, skillEffects)} XP
            {dmgBonus > 0 && (
              <span style={{ fontSize: '10px', color: '#a78bfa', marginLeft: '4px' }}>
                (+bonus)
              </span>
            )}
          </span>
          {!boss.is_defeated && (
            <button
              onClick={() => tryDefeatBoss(boss)}
              style={{
                padding: '10px 20px',
                backgroundColor: allDone ? '#22c55e' : '#16161f',
                color: allDone ? '#fff' : '#475569',
                border: 'none',
                borderRadius: '8px',
                cursor: allDone ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {allDone ? t.boss.finish : t.boss.notReady}
            </button>
          )}
        </div>
      </div>
    );
  }

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
          👹 {t.boss.title}
        </h1>
        {!isPro && (
          <ProLimitBadge
            current={bosses.filter(b => !b.is_defeated).length}
            max={PRO_LIMITS.FREE_MAX_ACTIVE_BOSSES}
            isPro={isPro}
          />
        )}
      </div>

      {weekly.length === 0 && monthly.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#475569' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>👹</div>
          <div style={{ fontSize: '16px' }}>{t.boss.emptyState}</div>
          <div style={{ fontSize: '13px', marginTop: '8px' }}>{t.boss.emptyHint}</div>
        </div>
      )}

      {/* Weekly boss — always visible */}
      {weekly.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#3b82f6',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px',
            }}
          >
            {t.boss.weekly}
          </div>
          {weekly.map(renderBoss)}
        </div>
      )}

      {/* Monthly boss — PRO only for free users */}
      {monthly.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#f59e0b',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px',
            }}
          >
            {t.boss.monthly}
            {!isPro && (
              <span style={{
                marginLeft: '8px',
                fontSize: '10px',
                color: '#a78bfa',
                fontWeight: 400,
                textTransform: 'none',
                letterSpacing: '0',
              }}>
                — PRO
              </span>
            )}
          </div>
          {isPro ? (
            monthly.map(renderBoss)
          ) : (
            <ProGate label={locale === 'ru' ? 'Месячный босс — PRO' : 'Monthly Boss — PRO'}>
              {monthly.map(renderBoss)}
            </ProGate>
          )}
        </div>
      )}
    </div>
  );
}