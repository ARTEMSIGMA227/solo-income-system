'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { XPEvent, IncomeEvent } from '@/types/database';

interface DayData {
  date: string;
  label: string;
  actions: number;
  xp: number;
  income: number;
}

export default function AnalyticsPage() {
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [monthIncome, setMonthIncome] = useState(0);
  const [monthActions, setMonthActions] = useState(0);
  const [monthXP, setMonthXP] = useState(0);
  const [avgDailyActions, setAvgDailyActions] = useState(0);
  const [avgDailyIncome, setAvgDailyIncome] = useState(0);
  const [bestDay, setBestDay] = useState<DayData | null>(null);
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Последние 7 дней
      const days: DayData[] = [];
      const now = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-CA');
        const label = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
        days.push({ date: dateStr, label, actions: 0, xp: 0, income: 0 });
      }

      const weekStart = days[0].date;
      const weekEnd = days[6].date;

      // Completions за неделю
      const { data: completions } = await supabase
        .from('completions')
        .select('completion_date, count_done')
        .eq('user_id', user.id)
        .gte('completion_date', weekStart)
        .lte('completion_date', weekEnd);

      if (completions) {
        for (const c of completions) {
          const day = days.find(d => d.date === c.completion_date);
          if (day) day.actions += c.count_done;
        }
      }

      // XP за неделю
      const { data: xpEvents } = await supabase
        .from('xp_events')
        .select('event_date, xp_amount')
        .eq('user_id', user.id)
        .gte('event_date', weekStart)
        .lte('event_date', weekEnd);

      if (xpEvents) {
        for (const e of xpEvents) {
          const day = days.find(d => d.date === e.event_date);
          if (day && e.xp_amount > 0) day.xp += e.xp_amount;
        }
      }

      // Income за неделю
      const { data: incomeEvents } = await supabase
        .from('income_events')
        .select('event_date, amount')
        .eq('user_id', user.id)
        .gte('event_date', weekStart)
        .lte('event_date', weekEnd);

      if (incomeEvents) {
        for (const ie of incomeEvents) {
          const day = days.find(d => d.date === ie.event_date);
          if (day) day.income += Number(ie.amount);
        }
      }

      setWeekData(days);

      // Месячные данные
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const { data: monthCompletions } = await supabase
        .from('completions')
        .select('count_done')
        .eq('user_id', user.id)
        .gte('completion_date', monthStart);
      const mActions = monthCompletions?.reduce((s, c) => s + c.count_done, 0) || 0;
      setMonthActions(mActions);

      const { data: monthXPEvents } = await supabase
        .from('xp_events')
        .select('xp_amount')
        .eq('user_id', user.id)
        .gte('event_date', monthStart);
      const mXP = monthXPEvents?.reduce((s, e) => s + (e.xp_amount > 0 ? e.xp_amount : 0), 0) || 0;
      setMonthXP(mXP);

      const { data: monthIncomeEvents } = await supabase
        .from('income_events')
        .select('amount')
        .eq('user_id', user.id)
        .gte('event_date', monthStart);
      const mIncome = monthIncomeEvents?.reduce((s, i) => s + Number(i.amount), 0) || 0;
      setMonthIncome(mIncome);

      // Средние
      const daysInMonth = now.getDate();
      setAvgDailyActions(Math.round(mActions / daysInMonth));
      setAvgDailyIncome(Math.round(mIncome / daysInMonth));

      // Лучший день
      const best = days.reduce((max, d) => d.actions > max.actions ? d : max, days[0]);
      setBestDay(best);

      // Rule-based анализ
      const newTips: string[] = [];

      const totalWeekActions = days.reduce((s, d) => s + d.actions, 0);
      const avgWeekActions = Math.round(totalWeekActions / 7);

      if (avgWeekActions < 30) {
        newTips.push('⚠️ Среднее число действий в день ниже 30. Увеличь количество звонков и касаний.');
      } else {
        newTips.push('✅ Хороший темп действий! Держи планку.');
      }

      if (mIncome < 75000 && daysInMonth > 15) {
        newTips.push('🔴 Доход ниже 50% от цели на середину месяца. Нужен рывок!');
      } else if (mIncome >= 150000) {
        newTips.push('🏆 Цель месяца достигнута! Ставь новую планку.');
      }

      const zeroDays = days.filter(d => d.actions === 0).length;
      if (zeroDays >= 2) {
        newTips.push(`💀 ${zeroDays} дней без действий за неделю. Каждый пропуск = -100 XP.`);
      }

      const weekIncome = days.reduce((s, d) => s + d.income, 0);
      if (weekIncome === 0 && totalWeekActions > 50) {
        newTips.push('🤔 Много действий, но нет дохода. Проверь качество касаний и конверсию.');
      }

      if (best && best.actions >= 40) {
        newTips.push(`🔥 Лучший день: ${best.label} (${best.actions} действий). Повтори этот результат!`);
      }

      const trend = days[6].actions - days[0].actions;
      if (trend > 10) {
        newTips.push('📈 Восходящий тренд! Ты набираешь обороты.');
      } else if (trend < -10) {
        newTips.push('📉 Нисходящий тренд. Не сбавляй темп к концу недели.');
      }

      setTips(newTips);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: '#0a0a0f', color: '#a78bfa',
      }}>
        ⏳ Загрузка аналитики...
      </div>
    );
  }

  const maxActions = Math.max(...weekData.map(d => d.actions), 1);
  const maxXP = Math.max(...weekData.map(d => d.xp), 1);
  const maxIncome = Math.max(...weekData.map(d => d.income), 1);

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#e2e8f0',
      padding: '16px', maxWidth: '600px', margin: '0 auto',
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
        📈 Аналитика
      </h1>

      {/* Месячная сводка */}
      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px',
        padding: '16px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>📅 Этот месяц</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div style={{ backgroundColor: '#16161f', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Доход</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>{formatCurrency(monthIncome)}</div>
          </div>
          <div style={{ backgroundColor: '#16161f', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Действия</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>{formatNumber(monthActions)}</div>
          </div>
          <div style={{ backgroundColor: '#16161f', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>XP</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#a78bfa' }}>{formatNumber(monthXP)}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
          <div style={{ backgroundColor: '#16161f', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Ср. действий/день</div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{avgDailyActions}</div>
          </div>
          <div style={{ backgroundColor: '#16161f', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Ср. доход/день</div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{formatCurrency(avgDailyIncome)}</div>
          </div>
        </div>
      </div>

      {/* График действий за неделю */}
      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px',
        padding: '16px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>📊 Действия за неделю</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
          {weekData.map((day, i) => {
            const height = maxActions > 0 ? (day.actions / maxActions) * 100 : 0;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 600 }}>
                  {day.actions > 0 ? day.actions : ''}
                </span>
                <div style={{
                  width: '100%', borderRadius: '4px 4px 0 0',
                  backgroundColor: day.actions >= 30 ? '#22c55e' : day.actions > 0 ? '#7c3aed' : '#1e1e2e',
                  height: `${Math.max(height, 4)}%`,
                  transition: 'height 0.5s ease',
                }} />
                <span style={{ fontSize: '9px', color: '#94a3b8' }}>{day.label}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px', fontSize: '10px' }}>
          <span><span style={{ color: '#22c55e' }}>■</span> ≥30</span>
          <span><span style={{ color: '#7c3aed' }}>■</span> &lt;30</span>
        </div>
      </div>

      {/* График XP за неделю */}
      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px',
        padding: '16px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>⚡ XP за неделю</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
          {weekData.map((day, i) => {
            const height = maxXP > 0 ? (day.xp / maxXP) * 100 : 0;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '9px', color: '#a78bfa' }}>
                  {day.xp > 0 ? day.xp : ''}
                </span>
                <div style={{
                  width: '100%', borderRadius: '4px 4px 0 0',
                  background: day.xp > 0 ? 'linear-gradient(180deg, #7c3aed, #3b82f6)' : '#1e1e2e',
                  height: `${Math.max(height, 4)}%`,
                }} />
                <span style={{ fontSize: '9px', color: '#94a3b8' }}>{day.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* График дохода за неделю */}
      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px',
        padding: '16px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>💰 Доход за неделю</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
          {weekData.map((day, i) => {
            const height = maxIncome > 0 ? (day.income / maxIncome) * 100 : 0;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '9px', color: '#22c55e' }}>
                  {day.income > 0 ? `${Math.round(day.income / 1000)}k` : ''}
                </span>
                <div style={{
                  width: '100%', borderRadius: '4px 4px 0 0',
                  backgroundColor: day.income > 0 ? '#22c55e' : '#1e1e2e',
                  height: `${Math.max(height, 4)}%`,
                }} />
                <span style={{ fontSize: '9px', color: '#94a3b8' }}>{day.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI-анализ (rule-based) */}
      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px',
        padding: '16px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>🧠 Анализ и рекомендации</div>
        {tips.map((tip, i) => (
          <div key={i} style={{
            padding: '10px 12px',
            backgroundColor: '#16161f',
            borderRadius: '8px',
            marginBottom: '8px',
            fontSize: '13px',
            lineHeight: '1.5',
          }}>
            {tip}
          </div>
        ))}
      </div>

      <div style={{ height: '32px' }} />
    </div>
  );
}