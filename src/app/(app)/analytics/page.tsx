'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';

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
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [incomeBySource, setIncomeBySource] = useState<{ name: string; value: number }[]>([]);

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
        .select('event_date, amount, source')
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
        .from('completions').select('count_done').eq('user_id', user.id).gte('completion_date', monthStart);
      const mActions = monthCompletions?.reduce((s, c) => s + c.count_done, 0) || 0;
      setMonthActions(mActions);

      const { data: monthXPEvents } = await supabase
        .from('xp_events').select('xp_amount').eq('user_id', user.id).gte('event_date', monthStart);
      const mXP = monthXPEvents?.reduce((s, e) => s + (e.xp_amount > 0 ? e.xp_amount : 0), 0) || 0;
      setMonthXP(mXP);

      const { data: monthIncomeEvents } = await supabase
        .from('income_events').select('amount, source').eq('user_id', user.id).gte('event_date', monthStart);
      const mIncome = monthIncomeEvents?.reduce((s, i) => s + Number(i.amount), 0) || 0;
      setMonthIncome(mIncome);

      // Доход по источникам
      const sourceMap: Record<string, number> = {};
      if (monthIncomeEvents) {
        for (const ie of monthIncomeEvents) {
          const src = ie.source || 'other';
          sourceMap[src] = (sourceMap[src] || 0) + Number(ie.amount);
        }
      }
      const sourceLabels: Record<string, string> = {
        sale: 'Продажи', contract: 'Контракты', freelance: 'Фриланс',
        bonus: 'Бонусы', other: 'Другое',
      };
      setIncomeBySource(
        Object.entries(sourceMap).map(([key, val]) => ({
          name: sourceLabels[key] || key,
          value: val,
        }))
      );

      // Средние
      const daysInMonth = now.getDate();
      setAvgDailyActions(Math.round(mActions / daysInMonth));
      setAvgDailyIncome(Math.round(mIncome / daysInMonth));

      // Rule-based анализ
      const newTips: string[] = [];
      const totalWeekActions = days.reduce((s, d) => s + d.actions, 0);
      const avgWeekActions = Math.round(totalWeekActions / 7);

      if (avgWeekActions < 30) {
        newTips.push('⚠️ Среднее число действий ниже 30/день. Увеличь активность.');
      } else {
        newTips.push('✅ Хороший темп действий! Держи планку.');
      }

      if (mIncome < 75000 && daysInMonth > 15) {
        newTips.push('🔴 Доход ниже 50% от цели. Нужен рывок!');
      } else if (mIncome >= 150000) {
        newTips.push('🏆 Цель месяца достигнута!');
      }

      const zeroDays = days.filter(d => d.actions === 0).length;
      if (zeroDays >= 2) {
        newTips.push(`💀 ${zeroDays} дней без действий за неделю.`);
      }

      const weekIncome = days.reduce((s, d) => s + d.income, 0);
      if (weekIncome === 0 && totalWeekActions > 50) {
        newTips.push('🤔 Много действий, но нет дохода. Проверь конверсию.');
      }

      const trend = days[6].actions - days[0].actions;
      if (trend > 10) {
        newTips.push('📈 Восходящий тренд! Набираешь обороты.');
      } else if (trend < -10) {
        newTips.push('📉 Нисходящий тренд. Не сбавляй темп.');
      }

      // Прогноз дохода
      if (mIncome > 0 && daysInMonth > 3) {
        const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - daysInMonth;
        const dailyRate = mIncome / daysInMonth;
        const forecast = mIncome + dailyRate * daysLeft;
        if (forecast >= 150000) {
          newTips.push(`📊 Прогноз: ${formatCurrency(Math.round(forecast))} к концу месяца. На пути к цели!`);
        } else {
          newTips.push(`📊 Прогноз: ${formatCurrency(Math.round(forecast))}. Нужно ускориться до ${formatCurrency(Math.round((150000 - mIncome) / Math.max(daysLeft, 1)))}/день.`);
        }
      }

      setTips(newTips);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0f', color: '#a78bfa' }}>
        ⏳ Загрузка аналитики...
      </div>
    );
  }

  const PIE_COLORS = ['#7c3aed', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

  const tooltipStyle = {
    backgroundColor: '#12121a',
    border: '1px solid #1e1e2e',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '12px',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#e2e8f0', padding: '16px', maxWidth: '600px', margin: '0 auto' }}>

      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>📈 Аналитика</h1>

      {/* Месячная сводка */}
      <div style={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
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

      {/* График действий — столбцы */}
      <div style={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>📊 Действия за неделю</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#1e1e2e' }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#1e1e2e' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="actions" name="Действия" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* График XP — линия */}
      <div style={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>⚡ XP за неделю</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#1e1e2e' }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#1e1e2e' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <defs>
              <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="xp" name="XP" stroke="#7c3aed" strokeWidth={2} fill="url(#xpGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* График дохода — линия с точками */}
      <div style={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>💰 Доход за неделю</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#1e1e2e' }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#1e1e2e' }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
            <Line type="monotone" dataKey="income" name="Доход" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 5 }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Доход по источникам — круговая */}
      {incomeBySource.length > 0 && (
        <div style={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>🎯 Доход по источникам</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={incomeBySource}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {incomeBySource.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Анализ и рекомендации */}
      <div style={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>🧠 Анализ и рекомендации</div>
        {tips.map((tip, i) => (
          <div key={i} style={{
            padding: '10px 12px', backgroundColor: '#16161f', borderRadius: '8px',
            marginBottom: '8px', fontSize: '13px', lineHeight: '1.5',
          }}>
            {tip}
          </div>
        ))}
      </div>

      <div style={{ height: '80px' }} />
    </div>
  );
}