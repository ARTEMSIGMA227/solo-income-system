'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { getLevelInfo } from '@/lib/xp';
import { toast } from 'sonner';
import type { Boss, Stats } from '@/types/database';

export default function BossesPage() {
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    setNow(Date.now());

    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: bossesData } = await supabase
        .from('bosses')
        .select('*')
        .eq('user_id', user.id)
        .order('boss_type');
      setBosses(bossesData || []);

      const { data: statsData } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setStats(statsData);

      setLoading(false);
    }
    load();
  }, []);

  function getBossProgress(boss: Boss, currentStats: Stats | null) {
    if (!currentStats) return [];
    return boss.requirements.map((req) => {
      let current = 0;
      switch (req.metric) {
        case 'actions': current = currentStats.total_actions; break;
        case 'clients': current = currentStats.total_clients; break;
        case 'income': current = Number(currentStats.total_income); break;
        case 'sales': current = currentStats.total_sales; break;
      }
      const percent = Math.min(Math.round((current / req.target) * 100), 100);
      return { ...req, current, percent };
    });
  }

  function getMetricLabel(metric: string) {
    switch (metric) {
      case 'actions': return 'Действия';
      case 'clients': return 'Клиенты';
      case 'income': return 'Доход';
      case 'sales': return 'Продажи';
      default: return metric;
    }
  }

  function formatMetricValue(metric: string, value: number) {
    if (metric === 'income') return formatCurrency(value);
    return formatNumber(value);
  }

  function getDaysLeft(deadline: string) {
    if (!now) return 0;
    return Math.max(0, Math.ceil(
      (new Date(deadline).getTime() - now) / (1000 * 60 * 60 * 24)
    ));
  }

  async function tryDefeatBoss(boss: Boss) {
    if (!userId || !stats) return;
    const progress = getBossProgress(boss, stats);
    const allDone = progress.every(p => p.percent >= 100);

    if (!allDone) {
      toast.error('Ещё не все требования выполнены!');
      return;
    }

    const supabase = createClient();

    await supabase
      .from('bosses')
      .update({
        is_defeated: true,
        defeated_at: new Date().toISOString(),
      })
      .eq('id', boss.id);

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
    await supabase.from('xp_events').insert({
      user_id: userId,
      event_type: 'boss_killed',
      xp_amount: boss.xp_reward,
      description: `Босс повержен: ${boss.title}`,
      event_date: today,
    });

    const newTotalEarned = stats.total_xp_earned + boss.xp_reward;
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

    setStats({ ...stats, total_xp_earned: newTotalEarned, level: levelInfo.level, current_xp: levelInfo.currentXP });
    setBosses(prev => prev.map(b => b.id === boss.id ? { ...b, is_defeated: true } : b));
    toast.success(`🎉 БОСС ПОВЕРЖЕН! +${boss.xp_reward} XP`);
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: '#0a0a0f', color: '#a78bfa',
      }}>
        ⏳ Загрузка боссов...
      </div>
    );
  }

  const weekly = bosses.filter(b => b.boss_type === 'weekly');
  const monthly = bosses.filter(b => b.boss_type === 'monthly');

  function renderBoss(boss: Boss) {
    const progress = getBossProgress(boss, stats);
    const allDone = progress.every(p => p.percent >= 100);
    const daysLeft = getDaysLeft(boss.deadline);

    return (
      <div key={boss.id} style={{
        backgroundColor: boss.is_defeated ? '#12201a' : '#12121a',
        border: `1px solid ${boss.is_defeated ? '#22c55e30' : '#1e1e2e'}`,
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: boss.is_defeated ? '#22c55e' : '#e2e8f0' }}>
              {boss.is_defeated ? '☠️' : '👹'} {boss.title}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              {boss.description}
            </div>
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
            backgroundColor: boss.is_defeated ? '#22c55e20' : daysLeft <= 2 ? '#ef444420' : '#16161f',
            color: boss.is_defeated ? '#22c55e' : daysLeft <= 2 ? '#ef4444' : '#94a3b8',
          }}>
            {boss.is_defeated ? '✓ Повержен' : `${daysLeft} дн.`}
          </div>
        </div>

        {progress.map((p, i) => (
          <div key={i} style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>{getMetricLabel(p.metric)}</span>
              <span style={{ color: p.percent >= 100 ? '#22c55e' : '#a78bfa' }}>
                {formatMetricValue(p.metric, p.current)} / {formatMetricValue(p.metric, p.target)}
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#16161f', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${p.percent}%`, height: '100%', borderRadius: '4px',
                backgroundColor: p.percent >= 100 ? '#22c55e' : '#7c3aed',
              }} />
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <span style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 600 }}>
            🏆 {boss.xp_reward} XP
          </span>
          {!boss.is_defeated && (
            <button
              onClick={() => tryDefeatBoss(boss)}
              style={{
                padding: '10px 20px',
                backgroundColor: allDone ? '#22c55e' : '#16161f',
                color: allDone ? '#fff' : '#475569',
                border: 'none', borderRadius: '8px',
                cursor: allDone ? 'pointer' : 'not-allowed',
                fontSize: '14px', fontWeight: 600,
              }}
            >
              {allDone ? '⚔️ Добить!' : '🔒 Не готов'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#e2e8f0',
      padding: '16px', maxWidth: '600px', margin: '0 auto',
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
        👹 Боссы
      </h1>

      {weekly.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            ⚡ Недельные
          </div>
          {weekly.map(renderBoss)}
        </div>
      )}

      {monthly.length > 0 && (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            👑 Месячные
          </div>
          {monthly.map(renderBoss)}
        </div>
      )}
    </div>
  );
}