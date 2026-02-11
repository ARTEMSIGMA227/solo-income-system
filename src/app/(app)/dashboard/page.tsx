'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getLevelInfo } from '@/lib/xp';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { XP_REWARDS } from '@/lib/constants';
import { toast } from 'sonner';
import HunterAvatar from '@/components/character/HunterAvatar';
import CharacterEditor from '@/components/character/CharacterEditor';
import type { Stats, Profile, CharacterConfig } from '@/types/database';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
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
  const router = useRouter();

  useEffect(() => {
    setCurrentHour(new Date().getHours());
    setTodayDate(new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }));

    const supabase = createClient();
    function getToday() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' }); }
    function getMonthStart() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-01`; }

    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/auth'); return; }
      setUser(authUser);

      const { data: p } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
      setProfile(p);

      const { data: s } = await supabase.from('stats').select('*').eq('user_id', authUser.id).single();
      setStats(s);

      const { data: cc } = await supabase.from('character_config').select('*').eq('user_id', authUser.id).single();
      setCharConfig(cc);

      const today = getToday();
      const { data: ct } = await supabase.from('completions').select('count_done').eq('user_id', authUser.id).eq('completion_date', today);
      setTodayActions(ct?.reduce((s, c) => s + c.count_done, 0) || 0);

      const { data: it } = await supabase.from('income_events').select('amount').eq('user_id', authUser.id).eq('event_date', today);
      setTodayIncome(it?.reduce((s, i) => s + Number(i.amount), 0) || 0);

      const { data: im } = await supabase.from('income_events').select('amount').eq('user_id', authUser.id).gte('event_date', getMonthStart());
      setMonthIncome(im?.reduce((s, i) => s + Number(i.amount), 0) || 0);

      setLoading(false);
    }
    loadData();
  }, [router]);

  async function quickAction(type: string, label: string) {
    if (!user || !stats) return;
    const supabase = createClient();
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
    const xp = XP_REWARDS[type as keyof typeof XP_REWARDS] || 5;

    await supabase.from('completions').insert({ user_id: user.id, completion_date: today, count_done: 1, notes: label });
    await supabase.from('xp_events').insert({ user_id: user.id, event_type: type, xp_amount: xp, description: label, event_date: today });

    const newTotalEarned = stats.total_xp_earned + xp;
    const newActions = stats.total_actions + 1;
    const levelInfo = getLevelInfo(newTotalEarned, stats.total_xp_lost);

    await supabase.from('stats').update({
      level: levelInfo.level, current_xp: levelInfo.currentXP,
      total_xp_earned: newTotalEarned, total_actions: newActions,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);

    setStats({ ...stats, level: levelInfo.level, current_xp: levelInfo.currentXP, total_xp_earned: newTotalEarned, total_actions: newActions });
    setTodayActions(prev => prev + 1);
    toast.success(`+${xp} XP — ${label}`);
  }

  async function addIncome() {
    if (!user || !stats) return;
    const amountStr = prompt('Сумма дохода (₽):');
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) { toast.error('Некорректная сумма'); return; }

    const source = prompt('Источник (sale/contract/freelance/bonus/other):', 'sale') || 'sale';
    const supabase = createClient();
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });

    await supabase.from('income_events').insert({ user_id: user.id, amount, source, event_date: today });
    const xp = XP_REWARDS.sale;
    await supabase.from('xp_events').insert({ user_id: user.id, event_type: 'sale', xp_amount: xp, description: `Доход: ${amount}₽`, event_date: today });

    const newTotalEarned = stats.total_xp_earned + xp;
    const newIncome = Number(stats.total_income) + amount;
    const levelInfo = getLevelInfo(newTotalEarned, stats.total_xp_lost);

    await supabase.from('stats').update({
      level: levelInfo.level, current_xp: levelInfo.currentXP,
      total_xp_earned: newTotalEarned, total_income: newIncome,
      total_sales: stats.total_sales + 1, updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);

    setStats({ ...stats, level: levelInfo.level, current_xp: levelInfo.currentXP, total_xp_earned: newTotalEarned, total_income: newIncome, total_sales: stats.total_sales + 1 });
    setTodayIncome(prev => prev + amount);
    setMonthIncome(prev => prev + amount);
    toast.success(`+${formatCurrency(amount)} доход! +${xp} XP`);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0f', color: '#a78bfa', fontSize: '24px' }}>
        ⚔️ Загрузка...
      </div>
    );
  }

  const levelInfo = stats ? getLevelInfo(stats.total_xp_earned, stats.total_xp_lost)
    : { level: 1, currentXP: 0, xpToNext: 750, progressPercent: 0, title: 'Безымянный', titleIcon: '💀', totalXPEarned: 0 };

  const actionsTarget = profile?.daily_actions_target || 30;
  const actionsPercent = Math.min(Math.round((todayActions / actionsTarget) * 100), 100);
  const monthTarget = profile?.monthly_income_target || 150000;
  const monthPercent = Math.min(Math.round((monthIncome / monthTarget) * 100), 100);

  let dayStatusColor = '#eab308';
  let dayStatusText = '⏳ В процессе';
  if (actionsPercent >= 100) { dayStatusColor = '#22c55e'; dayStatusText = '✅ День закрыт!'; }
  else if (currentHour >= 21) { dayStatusColor = '#ef4444'; dayStatusText = '🔴 Мало времени!'; }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#e2e8f0', padding: '16px', maxWidth: '600px', margin: '0 auto' }}>

      {/* Редактор персонажа */}
      {showEditor && user && (
        <CharacterEditor
          userId={user.id}
          config={charConfig}
          onSave={(newConfig) => { setCharConfig(newConfig); setShowEditor(false); }}
          onClose={() => setShowEditor(false)}
        />
      )}

      {/* Шапка */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{todayDate}</div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>{profile?.display_name || 'Охотник'}</div>
        </div>
        <div style={{
          padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
          color: dayStatusColor, backgroundColor: dayStatusColor + '20', border: `1px solid ${dayStatusColor}30`,
        }}>
          {dayStatusText}
        </div>
      </div>

      {/* ПЕРСОНАЖ */}
      <HunterAvatar level={levelInfo.level} title={levelInfo.title} config={charConfig} onEdit={() => setShowEditor(true)} />

      {/* Уровень */}
      <div style={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '16px', marginTop: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#a78bfa' }}>LV. {levelInfo.level}</span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{formatNumber(levelInfo.currentXP)} / {formatNumber(levelInfo.xpToNext)} XP</span>
        </div>
        <div style={{ width: '100%', height: '12px', backgroundColor: '#16161f', borderRadius: '6px', overflow: 'hidden', border: '1px solid #1e1e2e' }}>
          <div style={{ width: `${levelInfo.progressPercent}%`, height: '100%', borderRadius: '6px', background: 'linear-gradient(90deg, #7c3aed, #3b82f6)', transition: 'width 0.7s ease' }} />
        </div>
      </div>

      {/* Прогресс */}
      <div style={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
            <span>Действия</span>
            <span style={{ color: '#a78bfa' }}>{todayActions} / {actionsTarget}</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#16161f', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${actionsPercent}%`, height: '100%', borderRadius: '4px', backgroundColor: actionsPercent >= 100 ? '#22c55e' : '#7c3aed' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, backgroundColor: '#16161f', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Сегодня</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>{formatCurrency(todayIncome)}</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#16161f', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Месяц ({monthPercent}%)</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#a78bfa' }}>{formatCurrency(monthIncome)}</div>
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div style={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>⚡ Быстрые действия</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { fn: () => quickAction('action', '+1 Звонок'), icon: '📞', label: 'Звонок', xp: 5 },
            { fn: () => quickAction('action', '+1 Касание'), icon: '💬', label: 'Касание', xp: 5 },
            { fn: () => quickAction('action', '+1 Лид'), icon: '🎯', label: 'Лид', xp: 5 },
            { fn: () => quickAction('task', 'Задача'), icon: '✅', label: 'Задача', xp: 25 },
            { fn: () => quickAction('hard_task', 'Сложная'), icon: '🔥', label: 'Сложная', xp: 50 },
            { fn: addIncome, icon: '💰', label: 'Доход', xp: 100 },
          ].map((btn, i) => (
            <button key={i} onClick={btn.fn} style={{
              padding: '12px 8px', backgroundColor: i === 5 ? '#1a1a2e' : '#16161f',
              border: `1px solid ${i === 5 ? '#22c55e30' : '#1e1e2e'}`,
              borderRadius: '10px', color: i === 5 ? '#22c55e' : '#e2e8f0', cursor: 'pointer', fontSize: '13px', textAlign: 'center',
            }}>
              <div>{btn.icon}</div>
              <div style={{ fontSize: '11px', marginTop: '2px' }}>{btn.label}</div>
              <div style={{ fontSize: '10px', color: i === 5 ? '#22c55e' : '#7c3aed', marginTop: '2px' }}>+{btn.xp}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: '32px' }} />
    </div>
  );
}