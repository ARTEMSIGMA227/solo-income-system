'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getLevelInfo } from '@/lib/xp';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { XP_REWARDS } from '@/lib/constants';
import { toast } from 'sonner';
import type { Stats, Profile } from '@/types/database';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [todayActions, setTodayActions] = useState(0);
  const [todayIncome, setTodayIncome] = useState(0);
  const [monthIncome, setMonthIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentHour, setCurrentHour] = useState(0);
  const [todayDate, setTodayDate] = useState('');
  const router = useRouter();

  useEffect(() => {
    setCurrentHour(new Date().getHours());
    setTodayDate(new Date().toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }));

    const supabase = createClient();

    function getToday() {
      return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
    }

    function getMonthStart() {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }

    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/auth');
        return;
      }
      setUser(authUser);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      setProfile(profileData);

      const { data: statsData } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', authUser.id)
        .single();
      setStats(statsData);

      const today = getToday();
      const { data: completionsToday } = await supabase
        .from('completions')
        .select('count_done')
        .eq('user_id', authUser.id)
        .eq('completion_date', today);
      const totalActions = completionsToday?.reduce((sum, c) => sum + c.count_done, 0) || 0;
      setTodayActions(totalActions);

      const { data: incomeToday } = await supabase
        .from('income_events')
        .select('amount')
        .eq('user_id', authUser.id)
        .eq('event_date', today);
      const incT = incomeToday?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
      setTodayIncome(incT);

      const monthStart = getMonthStart();
      const { data: incomeMonth } = await supabase
        .from('income_events')
        .select('amount')
        .eq('user_id', authUser.id)
        .gte('event_date', monthStart);
      const incM = incomeMonth?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
      setMonthIncome(incM);

      setLoading(false);
    }
    loadData();
  }, [router]);

  async function quickAction(type: string, label: string) {
    if (!user || !stats) return;
    const supabase = createClient();
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
    const xp = XP_REWARDS[type as keyof typeof XP_REWARDS] || 5;

    await supabase.from('completions').insert({
      user_id: user.id,
      completion_date: today,
      count_done: 1,
      notes: label,
    });

    await supabase.from('xp_events').insert({
      user_id: user.id,
      event_type: type,
      xp_amount: xp,
      description: label,
      event_date: today,
    });

    const newTotalEarned = stats.total_xp_earned + xp;
    const newActions = stats.total_actions + 1;
    const levelInfo = getLevelInfo(newTotalEarned, stats.total_xp_lost);

    await supabase
      .from('stats')
      .update({
        level: levelInfo.level,
        current_xp: levelInfo.currentXP,
        total_xp_earned: newTotalEarned,
        total_actions: newActions,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    setStats({
      ...stats,
      level: levelInfo.level,
      current_xp: levelInfo.currentXP,
      total_xp_earned: newTotalEarned,
      total_actions: newActions,
    });

    setTodayActions(prev => prev + 1);
    toast.success(`+${xp} XP — ${label}`);
  }

  async function addIncome() {
    if (!user || !stats) return;
    const amountStr = prompt('Сумма дохода (₽):');
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Некорректная сумма');
      return;
    }

    const source = prompt('Источник (sale/contract/freelance/bonus/other):', 'sale') || 'sale';
    const supabase = createClient();
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });

    await supabase.from('income_events').insert({
      user_id: user.id,
      amount,
      source,
      event_date: today,
    });

    const xp = XP_REWARDS.sale;
    await supabase.from('xp_events').insert({
      user_id: user.id,
      event_type: 'sale',
      xp_amount: xp,
      description: `Доход: ${amount}₽`,
      event_date: today,
    });

    const newTotalEarned = stats.total_xp_earned + xp;
    const newIncome = Number(stats.total_income) + amount;
    const levelInfo = getLevelInfo(newTotalEarned, stats.total_xp_lost);

    await supabase
      .from('stats')
      .update({
        level: levelInfo.level,
        current_xp: levelInfo.currentXP,
        total_xp_earned: newTotalEarned,
        total_income: newIncome,
        total_sales: stats.total_sales + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    setStats({
      ...stats,
      level: levelInfo.level,
      current_xp: levelInfo.currentXP,
      total_xp_earned: newTotalEarned,
      total_income: newIncome,
      total_sales: stats.total_sales + 1,
    });

    setTodayIncome(prev => prev + amount);
    setMonthIncome(prev => prev + amount);
    toast.success(`+${formatCurrency(amount)} доход! +${XP_REWARDS.sale} XP`);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: '#0a0a0f', color: '#a78bfa',
        fontSize: '24px',
      }}>
        ⚔️ Загрузка системы...
      </div>
    );
  }

  const levelInfo = stats
    ? getLevelInfo(stats.total_xp_earned, stats.total_xp_lost)
    : { level: 1, currentXP: 0, xpToNext: 750, progressPercent: 0, title: 'Безымянный', titleIcon: '💀', totalXPEarned: 0 };

  const actionsTarget = profile?.daily_actions_target || 30;
  const actionsPercent = Math.min(Math.round((todayActions / actionsTarget) * 100), 100);
  const monthTarget = profile?.monthly_income_target || 150000;
  const monthPercent = Math.min(Math.round((monthIncome / monthTarget) * 100), 100);

  let dayStatusColor = '#eab308';
  let dayStatusText = '⏳ В процессе';
  if (actionsPercent >= 100) {
    dayStatusColor = '#22c55e';
    dayStatusText = '✅ День закрыт!';
  } else if (currentHour >= 21) {
    dayStatusColor = '#ef4444';
    dayStatusText = '🔴 Осталось мало времени!';
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#e2e8f0',
      fontFamily: 'Inter, sans-serif', padding: '16px', maxWidth: '600px', margin: '0 auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{todayDate}</div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>{profile?.display_name || 'Охотник'}</div>
        </div>
        <button onClick={handleLogout} style={{
          padding: '8px 12px', backgroundColor: '#16161f', border: '1px solid #1e1e2e',
          borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '12px',
        }}>
          Выход
        </button>
      </div>

      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '16px',
        padding: '24px', marginBottom: '16px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>{levelInfo.titleIcon}</div>
        <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' }}>
          {levelInfo.title}
        </div>
        <div style={{ fontSize: '48px', fontWeight: 800, color: '#a78bfa', margin: '8px 0' }}>
          LV. {levelInfo.level}
        </div>
        <div style={{ margin: '16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
            <span>XP</span>
            <span>{formatNumber(levelInfo.currentXP)} / {formatNumber(levelInfo.xpToNext)}</span>
          </div>
          <div style={{
            width: '100%', height: '12px', backgroundColor: '#16161f',
            borderRadius: '6px', overflow: 'hidden', border: '1px solid #1e1e2e',
          }}>
            <div style={{
              width: `${levelInfo.progressPercent}%`, height: '100%', borderRadius: '6px',
              background: 'linear-gradient(90deg, #7c3aed, #3b82f6)',
              transition: 'width 0.7s ease',
            }} />
          </div>
        </div>
        <div style={{
          display: 'inline-block', padding: '6px 16px', borderRadius: '20px', fontSize: '14px',
          fontWeight: 600, color: dayStatusColor,
          backgroundColor: dayStatusColor + '20', border: `1px solid ${dayStatusColor}30`,
        }}>
          {dayStatusText}
        </div>
      </div>

      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px',
        padding: '16px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>📊 Прогресс дня</div>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
            <span>Действия</span>
            <span style={{ color: '#a78bfa' }}>{todayActions} / {actionsTarget}</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#16161f', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${actionsPercent}%`, height: '100%', borderRadius: '4px',
              backgroundColor: actionsPercent >= 100 ? '#22c55e' : '#7c3aed',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, backgroundColor: '#16161f', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Сегодня</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e' }}>{formatCurrency(todayIncome)}</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#16161f', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Месяц</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#a78bfa' }}>{formatCurrency(monthIncome)}</div>
          </div>
        </div>
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Цель месяца</span>
            <span style={{ color: '#a78bfa' }}>{monthPercent}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#16161f', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: `${monthPercent}%`, height: '100%', borderRadius: '3px',
              backgroundColor: monthPercent >= 100 ? '#22c55e' : '#f59e0b',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px',
        padding: '16px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>⚡ Быстрые действия</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button onClick={() => quickAction('action', '+1 Звонок')} style={{
            padding: '14px', backgroundColor: '#16161f', border: '1px solid #1e1e2e',
            borderRadius: '10px', color: '#e2e8f0', cursor: 'pointer', fontSize: '14px',
          }}>
            📞 +1 Звонок
            <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '4px' }}>+5 XP</div>
          </button>
          <button onClick={() => quickAction('action', '+1 Касание')} style={{
            padding: '14px', backgroundColor: '#16161f', border: '1px solid #1e1e2e',
            borderRadius: '10px', color: '#e2e8f0', cursor: 'pointer', fontSize: '14px',
          }}>
            💬 +1 Касание
            <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '4px' }}>+5 XP</div>
          </button>
          <button onClick={() => quickAction('action', '+1 Лид')} style={{
            padding: '14px', backgroundColor: '#16161f', border: '1px solid #1e1e2e',
            borderRadius: '10px', color: '#e2e8f0', cursor: 'pointer', fontSize: '14px',
          }}>
            🎯 +1 Лид
            <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '4px' }}>+5 XP</div>
          </button>
          <button onClick={() => quickAction('task', 'Задача')} style={{
            padding: '14px', backgroundColor: '#16161f', border: '1px solid #1e1e2e',
            borderRadius: '10px', color: '#e2e8f0', cursor: 'pointer', fontSize: '14px',
          }}>
            ✅ Задача
            <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '4px' }}>+25 XP</div>
          </button>
          <button onClick={() => quickAction('hard_task', 'Сложная задача')} style={{
            padding: '14px', backgroundColor: '#16161f', border: '1px solid #1e1e2e',
            borderRadius: '10px', color: '#e2e8f0', cursor: 'pointer', fontSize: '14px',
          }}>
            🔥 Сложная
            <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '4px' }}>+50 XP</div>
          </button>
          <button onClick={addIncome} style={{
            padding: '14px', backgroundColor: '#1a1a2e', border: '1px solid #22c55e30',
            borderRadius: '10px', color: '#22c55e', cursor: 'pointer', fontSize: '14px',
          }}>
            💰 Доход
            <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px' }}>+100 XP</div>
          </button>
        </div>
      </div>

      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px',
        padding: '16px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>📈 Общая статистика</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ backgroundColor: '#16161f', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Всего XP</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#a78bfa' }}>{formatNumber(stats?.total_xp_earned || 0)}</div>
          </div>
          <div style={{ backgroundColor: '#16161f', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Всего действий</div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{formatNumber(stats?.total_actions || 0)}</div>
          </div>
          <div style={{ backgroundColor: '#16161f', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Продажи</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>{stats?.total_sales || 0}</div>
          </div>
          <div style={{ backgroundColor: '#16161f', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Общий доход</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b' }}>{formatCurrency(Number(stats?.total_income || 0))}</div>
          </div>
        </div>
      </div>

      <div style={{ height: '32px' }} />
    </div>
  );
}