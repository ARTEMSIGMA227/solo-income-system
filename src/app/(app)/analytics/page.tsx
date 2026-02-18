'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { exportAnalyticsPdf } from '@/lib/export-pdf';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';

const L = {
  title: '\u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430',
  loading: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0430\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0438...',
  thisMonth: '\u042d\u0442\u043e\u0442 \u043c\u0435\u0441\u044f\u0446',
  income: '\u0414\u043e\u0445\u043e\u0434',
  actions: '\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f',
  avgActions: '\u0421\u0440. \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439/\u0434\u0435\u043d\u044c',
  avgIncome: '\u0421\u0440. \u0434\u043e\u0445\u043e\u0434/\u0434\u0435\u043d\u044c',
  weekActions: '\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u0437\u0430 \u043d\u0435\u0434\u0435\u043b\u044e',
  weekXP: 'XP \u0437\u0430 \u043d\u0435\u0434\u0435\u043b\u044e',
  weekIncome: '\u0414\u043e\u0445\u043e\u0434 \u0437\u0430 \u043d\u0435\u0434\u0435\u043b\u044e',
  bySource: '\u0414\u043e\u0445\u043e\u0434 \u043f\u043e \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a\u0430\u043c',
  analysis: '\u0410\u043d\u0430\u043b\u0438\u0437 \u0438 \u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0430\u0446\u0438\u0438',
  exportPdf: '\u0421\u043a\u0430\u0447\u0430\u0442\u044c PDF-\u043e\u0442\u0447\u0451\u0442',
  exporting: '\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f...',
  sale: '\u041f\u0440\u043e\u0434\u0430\u0436\u0438',
  contract: '\u041a\u043e\u043d\u0442\u0440\u0430\u043a\u0442\u044b',
  freelance: '\u0424\u0440\u0438\u043b\u0430\u043d\u0441',
  bonus: '\u0411\u043e\u043d\u0443\u0441\u044b',
  other: '\u0414\u0440\u0443\u0433\u043e\u0435',
  lowActions: '\u0421\u0440\u0435\u0434\u043d\u0435\u0435 \u0447\u0438\u0441\u043b\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u043d\u0438\u0436\u0435 30/\u0434\u0435\u043d\u044c. \u0423\u0432\u0435\u043b\u0438\u0447\u044c \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u044c.',
  goodPace: '\u0425\u043e\u0440\u043e\u0448\u0438\u0439 \u0442\u0435\u043c\u043f \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439! \u0414\u0435\u0440\u0436\u0438 \u043f\u043b\u0430\u043d\u043a\u0443.',
  lowIncome: '\u0414\u043e\u0445\u043e\u0434 \u043d\u0438\u0436\u0435 50% \u043e\u0442 \u0446\u0435\u043b\u0438. \u041d\u0443\u0436\u0435\u043d \u0440\u044b\u0432\u043e\u043a!',
  goalReached: '\u0426\u0435\u043b\u044c \u043c\u0435\u0441\u044f\u0446\u0430 \u0434\u043e\u0441\u0442\u0438\u0433\u043d\u0443\u0442\u0430!',
  zeroDays: '\u0434\u043d\u0435\u0439 \u0431\u0435\u0437 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u0437\u0430 \u043d\u0435\u0434\u0435\u043b\u044e.',
  noConversion: '\u041c\u043d\u043e\u0433\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439, \u043d\u043e \u043d\u0435\u0442 \u0434\u043e\u0445\u043e\u0434\u0430. \u041f\u0440\u043e\u0432\u0435\u0440\u044c \u043a\u043e\u043d\u0432\u0435\u0440\u0441\u0438\u044e.',
  upTrend: '\u0412\u043e\u0441\u0445\u043e\u0434\u044f\u0449\u0438\u0439 \u0442\u0440\u0435\u043d\u0434! \u041d\u0430\u0431\u0438\u0440\u0430\u0435\u0448\u044c \u043e\u0431\u043e\u0440\u043e\u0442\u044b.',
  downTrend: '\u041d\u0438\u0441\u0445\u043e\u0434\u044f\u0449\u0438\u0439 \u0442\u0440\u0435\u043d\u0434. \u041d\u0435 \u0441\u0431\u0430\u0432\u043b\u044f\u0439 \u0442\u0435\u043c\u043f.',
  forecast: '\u041f\u0440\u043e\u0433\u043d\u043e\u0437',
  onTrack: '\u041a \u043a\u043e\u043d\u0446\u0443 \u043c\u0435\u0441\u044f\u0446\u0430. \u041d\u0430 \u043f\u0443\u0442\u0438 \u043a \u0446\u0435\u043b\u0438!',
  needSpeed: '\u041d\u0443\u0436\u043d\u043e \u0443\u0441\u043a\u043e\u0440\u0438\u0442\u044c\u0441\u044f \u0434\u043e',
  perDay: '/\u0434\u0435\u043d\u044c.',
};

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

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

      const sourceMap: Record<string, number> = {};
      if (monthIncomeEvents) {
        for (const ie of monthIncomeEvents) {
          const src = ie.source || 'other';
          sourceMap[src] = (sourceMap[src] || 0) + Number(ie.amount);
        }
      }
      const sourceLabels: Record<string, string> = {
        sale: L.sale, contract: L.contract, freelance: L.freelance,
        bonus: L.bonus, other: L.other,
      };
      setIncomeBySource(
        Object.entries(sourceMap).map(([key, val]) => ({
          name: sourceLabels[key] || key,
          value: val,
        }))
      );

      const daysInMonth = now.getDate();
      setAvgDailyActions(Math.round(mActions / daysInMonth));
      setAvgDailyIncome(Math.round(mIncome / daysInMonth));

      const newTips: string[] = [];
      const totalWeekActions = days.reduce((s, d) => s + d.actions, 0);
      const avgWeekActions = Math.round(totalWeekActions / 7);

      if (avgWeekActions < 30) {
        newTips.push('\u26a0\ufe0f ' + L.lowActions);
      } else {
        newTips.push('\u2705 ' + L.goodPace);
      }

      if (mIncome < 75000 && daysInMonth > 15) {
        newTips.push('\ud83d\udd34 ' + L.lowIncome);
      } else if (mIncome >= 150000) {
        newTips.push('\ud83c\udfc6 ' + L.goalReached);
      }

      const zeroDays = days.filter(d => d.actions === 0).length;
      if (zeroDays >= 2) {
        newTips.push('\ud83d\udc80 ' + zeroDays + ' ' + L.zeroDays);
      }

      const weekIncome = days.reduce((s, d) => s + d.income, 0);
      if (weekIncome === 0 && totalWeekActions > 50) {
        newTips.push('\ud83e\udd14 ' + L.noConversion);
      }

      const trend = days[6].actions - days[0].actions;
      if (trend > 10) {
        newTips.push('\ud83d\udcc8 ' + L.upTrend);
      } else if (trend < -10) {
        newTips.push('\ud83d\udcc9 ' + L.downTrend);
      }

      if (mIncome > 0 && daysInMonth > 3) {
        const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - daysInMonth;
        const dailyRate = mIncome / daysInMonth;
        const forecast = mIncome + dailyRate * daysLeft;
        if (forecast >= 150000) {
          newTips.push('\ud83d\udcca ' + L.forecast + ': ' + formatCurrency(Math.round(forecast)) + ' ' + L.onTrack);
        } else {
          newTips.push('\ud83d\udcca ' + L.forecast + ': ' + formatCurrency(Math.round(forecast)) + '. ' + L.needSpeed + ' ' + formatCurrency(Math.round((150000 - mIncome) / Math.max(daysLeft, 1))) + L.perDay);
        }
      }

      setTips(newTips);
      setLoading(false);
    }
    load();
  }, []);

  async function handleExportPdf() {
    setPdfLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, streak_current, streak_best')
        .eq('id', user.id)
        .single();

      const { data: stats } = await supabase
        .from('stats')
        .select('level, total_xp_earned, total_income, total_actions, total_sales, total_clients')
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
          completionMap.set(c.quest_id, (completionMap.get(c.quest_id) || 0) + c.count_done);
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
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    }
    setPdfLoading(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0f', color: '#a78bfa' }}>
        {'\u23f3'} {L.loading}
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
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#e2e8f0', padding: '16px', maxWidth: '600px', margin: '0 auto' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
          {'\ud83d\udcc8'} {L.title}
        </h1>
        <button
          onClick={handleExportPdf}
          disabled={pdfLoading}
          style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            backgroundColor: '#7c3aed', color: '#fff', fontSize: '12px',
            fontWeight: 600, cursor: pdfLoading ? 'not-allowed' : 'pointer',
            opacity: pdfLoading ? 0.6 : 1,
          }}
        >
          {pdfLoading ? '\u23f3 ' + L.exporting : '\ud83d\udcc4 ' + L.exportPdf}
        </button>
      </div>

      {/* Monthly summary */}
      <div style={cardStyle}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          {'\ud83d\udcc5'} {L.thisMonth}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div style={{ backgroundColor: '#16161f', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{L.income}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>{formatCurrency(monthIncome)}</div>
          </div>
          <div style={{ backgroundColor: '#16161f', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{L.actions}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>{formatNumber(monthActions)}</div>
          </div>
          <div style={{ backgroundColor: '#16161f', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>XP</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#a78bfa' }}>{formatNumber(monthXP)}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
          <div style={{ backgroundColor: '#16161f', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{L.avgActions}</div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{avgDailyActions}</div>
          </div>
          <div style={{ backgroundColor: '#16161f', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{L.avgIncome}</div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{formatCurrency(avgDailyIncome)}</div>
          </div>
        </div>
      </div>

      {/* Actions chart */}
      <div style={cardStyle}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          {'\ud83d\udcca'} {L.weekActions}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#1e1e2e' }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#1e1e2e' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="actions" name={L.actions} fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* XP chart */}
      <div style={cardStyle}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          {'\u26a1'} {L.weekXP}
        </div>
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

      {/* Income chart */}
      <div style={cardStyle}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          {'\ud83d\udcb0'} {L.weekIncome}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#1e1e2e' }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#1e1e2e' }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value ?? 0))} />
            <Line type="monotone" dataKey="income" name={L.income} stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 5 }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart */}
      {incomeBySource.length > 0 && (
        <div style={cardStyle}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
            {'\ud83c\udfaf'} {L.bySource}
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
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {incomeBySource.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value ?? 0))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tips */}
      <div style={cardStyle}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          {'\ud83e\udde0'} {L.analysis}
        </div>
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