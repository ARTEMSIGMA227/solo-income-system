'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber } from '@/lib/utils';
import { exportAnalyticsPdf } from '@/lib/export-pdf';
import { useT } from '@/lib/i18n';
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
  const [pdfLoading, setPdfLoading] = useState(false);
  const [incomeBySource, setIncomeBySource] = useState<{ name: string; value: number }[]>([]);
  const { t, locale, currency, formatCurrency: fmtCurrency } = useT();

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const days: DayData[] = [];
      const now = new Date();
      const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US';

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-CA');
        const label = d.toLocaleDateString(dateLocale, {
          weekday: 'short',
          day: 'numeric',
        });
        days.push({ date: dateStr, label, actions: 0, xp: 0, income: 0 });
      }

      const weekStart = days[0].date;
      const weekEnd = days[6].date;

      const { data: completions } = await supabase
        .from('completions')
        .select('completion_date, count_done')
        .eq('user_id', user.id)
        .gte('completion_date', weekStart)
        .lte('completion_date', weekEnd);

      if (completions) {
        for (const c of completions) {
          const day = days.find((d) => d.date === c.completion_date);
          if (day) day.actions += c.count_done;
        }
      }

      const { data: xpEvents } = await supabase
        .from('xp_events')
        .select('event_date, xp_amount')
        .eq('user_id', user.id)
        .gte('event_date', weekStart)
        .lte('event_date', weekEnd);

      if (xpEvents) {
        for (const e of xpEvents) {
          const day = days.find((d) => d.date === e.event_date);
          if (day && e.xp_amount > 0) day.xp += e.xp_amount;
        }
      }

      const { data: incomeEvents } = await supabase
        .from('income_events')
        .select('event_date, amount, source')
        .eq('user_id', user.id)
        .gte('event_date', weekStart)
        .lte('event_date', weekEnd);

      if (incomeEvents) {
        for (const ie of incomeEvents) {
          const day = days.find((d) => d.date === ie.event_date);
          if (day) day.income += Number(ie.amount);
        }
      }

      setWeekData(days);

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
      const mXP =
        monthXPEvents?.reduce((s, e) => s + (e.xp_amount > 0 ? e.xp_amount : 0), 0) || 0;
      setMonthXP(mXP);

      const { data: monthIncomeEvents } = await supabase
        .from('income_events')
        .select('amount, source')
        .eq('user_id', user.id)
        .gte('event_date', monthStart);
      const mIncome =
        monthIncomeEvents?.reduce((s, i) => s + Number(i.amount), 0) || 0;
      setMonthIncome(mIncome);

      const sourceMap: Record<string, number> = {};
      if (monthIncomeEvents) {
        for (const ie of monthIncomeEvents) {
          const src = ie.source || 'other';
          sourceMap[src] = (sourceMap[src] || 0) + Number(ie.amount);
        }
      }
      setIncomeBySource(
        Object.entries(sourceMap).map(([key, val]) => ({
          name:
            t.analytics.sources[key as keyof typeof t.analytics.sources] || key,
          value: val,
        })),
      );

      const daysInMonth = now.getDate();
      setAvgDailyActions(Math.round(mActions / daysInMonth));
      setAvgDailyIncome(Math.round(mIncome / daysInMonth));

      const newTips: string[] = [];
      const totalWeekActions = days.reduce((s, d) => s + d.actions, 0);
      const avgWeekActions = Math.round(totalWeekActions / 7);

      if (avgWeekActions < 30) {
        newTips.push('\u26a0\ufe0f ' + t.analytics.tips.lowActions);
      } else {
        newTips.push('\u2705 ' + t.analytics.tips.goodPace);
      }

      if (mIncome < 75000 && daysInMonth > 15) {
        newTips.push('\ud83d\udd34 ' + t.analytics.tips.lowIncome);
      } else if (mIncome >= 150000) {
        newTips.push('\ud83c\udfc6 ' + t.analytics.tips.goalReached);
      }

      const zeroDays = days.filter((d) => d.actions === 0).length;
      if (zeroDays >= 2) {
        newTips.push('\ud83d\udca2 ' + zeroDays + ' ' + t.analytics.tips.zeroDays);
      }

      const weekIncome = days.reduce((s, d) => s + d.income, 0);
      if (weekIncome === 0 && totalWeekActions > 50) {
        newTips.push('\ud83e\udd14 ' + t.analytics.tips.noConversion);
      }

      const trend = days[6].actions - days[0].actions;
      if (trend > 10) {
        newTips.push('\ud83d\udcc8 ' + t.analytics.tips.upTrend);
      } else if (trend < -10) {
        newTips.push('\ud83d\udcc9 ' + t.analytics.tips.downTrend);
      }

      if (mIncome > 0 && daysInMonth > 3) {
        const daysLeft =
          new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - daysInMonth;
        const dailyRate = mIncome / daysInMonth;
        const forecast = mIncome + dailyRate * daysLeft;
        if (forecast >= 150000) {
          newTips.push(
            '\ud83d\udcca ' +
              t.analytics.tips.forecast +
              ': ' +
              fmtCurrency(Math.round(forecast)) +
              ' ' +
              t.analytics.tips.onTrack,
          );
        } else {
          newTips.push(
            '\ud83d\udcca ' +
              t.analytics.tips.forecast +
              ': ' +
              fmtCurrency(Math.round(forecast)) +
              '. ' +
              t.analytics.tips.needSpeed +
              ' ' +
              fmtCurrency(
                Math.round((150000 - mIncome) / Math.max(daysLeft, 1)),
              ) +
              t.analytics.tips.perDay,
          );
        }
      }

      setTips(newTips);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  async function handleExportPdf() {
    setPdfLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, streak_current, streak_best')
        .eq('id', user.id)
        .single();

      const { data: stats } = await supabase
        .from('stats')
        .select(
          'level, total_xp_earned, total_income, total_actions, total_sales, total_clients',
        )
        .eq('user_id', user.id)
        .single();

      const { data: quests } = await supabase
        .from('quests')
        .select('title, xp_reward')
        .eq('user_id', user.id);

      const { data: questCompletions } = await supabase
        .from('completions')
        .select('quest_id, count_done')
        .eq('user_id', user.id);

      const completionMap = new Map<string, number>();
      if (questCompletions) {
        for (const c of questCompletions) {
          completionMap.set(
            c.quest_id,
            (completionMap.get(c.quest_id) || 0) + c.count_done,
          );
        }
      }

      const { data: recentXp } = await supabase
        .from('xp_events')
        .select('event_date, event_type, xp_amount, description')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      exportAnalyticsPdf({
        displayName: profile?.display_name || 'Hunter',
        level: stats?.level || 1,
        totalXp: stats?.total_xp_earned || 0,
        totalIncome: stats?.total_income || 0,
        totalActions: stats?.total_actions || 0,
        totalSales: stats?.total_sales || 0,
        totalClients: stats?.total_clients || 0,
        streakCurrent: profile?.streak_current || 0,
        streakBest: profile?.streak_best || 0,
        quests: (quests || []).map((q) => ({
          title: q.title,
          xp: q.xp_reward,
          completions: completionMap.get(q.title) || 0,
        })),
        recentEvents: (recentXp || []).map((e) => ({
          date: e.event_date,
          type: e.event_type,
          xp: e.xp_amount,
          description: e.description || '',
        })),
        locale,
        currency,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    }
    setPdfLoading(false);
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
        \u23f3 {t.analytics.loading}
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

  const cardStyle = {
    backgroundColor: '#12121a',
    border: '1px solid #1e1e2e',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  };

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
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{t.analytics.title}</h1>
        <button
          onClick={handleExportPdf}
          disabled={pdfLoading}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#7c3aed',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: pdfLoading ? 'not-allowed' : 'pointer',
            opacity: pdfLoading ? 0.6 : 1,
          }}
        >
          {pdfLoading ? '\u23f3 ' + t.analytics.exporting : '\ud83d\udcc4 ' + t.analytics.exportPdf}
        </button>
      </div>

      {/* Monthly summary */}
      <div style={cardStyle}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          {t.analytics.thisMonth}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div
            style={{
              backgroundColor: '#16161f',
              borderRadius: '8px',
              padding: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{t.analytics.income}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>
              {fmtCurrency(monthIncome)}
            </div>
          </div>
          <div
            style={{
              backgroundColor: '#16161f',
              borderRadius: '8px',
              padding: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              {t.analytics.actions}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>
              {formatNumber(monthActions)}
            </div>
          </div>
          <div
            style={{
              backgroundColor: '#16161f',
              borderRadius: '8px',
              padding: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>XP</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#a78bfa' }}>
              {formatNumber(monthXP)}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          <div
            style={{
              backgroundColor: '#16161f',
              borderRadius: '8px',
              padding: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              {t.analytics.avgActions}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{avgDailyActions}</div>
          </div>
          <div
            style={{
              backgroundColor: '#16161f',
              borderRadius: '8px',
              padding: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              {t.analytics.avgIncome}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>
              {fmtCurrency(avgDailyIncome)}
            </div>
          </div>
        </div>
      </div>

      {/* Actions chart */}
      <div style={cardStyle}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          {t.analytics.weekActions}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#1e1e2e' }}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#1e1e2e' }}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="actions"
              name={t.analytics.actions}
              fill="#7c3aed"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* XP chart */}
      <div style={cardStyle}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          {t.analytics.weekXP}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#1e1e2e' }}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#1e1e2e' }}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <defs>
              <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="xp"
              name="XP"
              stroke="#7c3aed"
              strokeWidth={2}
              fill="url(#xpGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Income chart */}
      <div style={cardStyle}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          {t.analytics.weekIncome}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#1e1e2e' }}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#1e1e2e' }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => fmtCurrency(Number(value ?? 0))}
            />
            <Line
              type="monotone"
              dataKey="income"
              name={t.analytics.income}
              stroke="#22c55e"
              strokeWidth={3}
              dot={{ fill: '#22c55e', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart */}
      {incomeBySource.length > 0 && (
        <div style={cardStyle}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
            {t.analytics.bySource}
          </div>
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
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {incomeBySource.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => fmtCurrency(Number(value ?? 0))}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tips */}
      <div style={cardStyle}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          {t.analytics.analysis}
        </div>
        {tips.map((tip, i) => (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              backgroundColor: '#16161f',
              borderRadius: '8px',
              marginBottom: '8px',
              fontSize: '13px',
              lineHeight: '1.5',
            }}
          >
            {tip}
          </div>
        ))}
      </div>

      <div style={{ height: '80px' }} />
    </div>
  );
}
