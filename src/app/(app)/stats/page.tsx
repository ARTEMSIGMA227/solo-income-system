'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';
import { exportStatsPdf } from '@/lib/export-pdf';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, DollarSign,
  Activity, Calendar, Target, ArrowUpRight, ArrowDownRight,
  Loader2, FileDown, Flame, Zap,
} from 'lucide-react';
import ActivityCalendar from './ActivityCalendar';

type Period = 'week' | 'month' | 'quarter' | 'year' | 'all';

interface IncomeRow { amount: number; source: string; event_date: string }
interface CompletionRow { completion_date: string; count_done: number }
interface XPRow { event_date: string; xp_amount: number; event_type: string }
interface StatsRow {
  level: number; total_xp_earned: number; total_xp_lost: number;
  total_income: number; total_actions: number; total_sales: number; total_clients: number;
}

interface CategoryStat {
  category: string;
  amount: number;
  count: number;
  percent: number;
}

const COLORS = [
  '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6',
  '#6366F1', '#EF4444', '#14B8A6', '#F97316', '#84CC16',
  '#06B6D4', '#A855F7',
];

export default function StatsPage() {
  const { t, locale, currency, formatCurrency } = useT();
  const supabase = createClient();

  const [incomeEvents, setIncomeEvents] = useState<IncomeRow[]>([]);
  const [completions, setCompletions] = useState<CompletionRow[]>([]);
  const [xpEvents, setXPEvents] = useState<XPRow[]>([]);
  const [stats, setStats] = useState<StatsRow | null>(null);
  const [streakCurrent, setStreakCurrent] = useState(0);
  const [streakBest, setStreakBest] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfLangOpen, setPdfLangOpen] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pdfRef.current && !pdfRef.current.contains(e.target as Node)) {
        setPdfLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { data: incData },
        { data: compData },
        { data: xpData },
        { data: statsData },
        { data: profileData },
      ] = await Promise.all([
        supabase.from('income_events').select('amount, source, event_date')
          .eq('user_id', user.id).order('event_date', { ascending: true }),
        supabase.from('completions').select('completion_date, count_done')
          .eq('user_id', user.id).order('completion_date', { ascending: true }),
        supabase.from('xp_events').select('event_date, xp_amount, event_type')
          .eq('user_id', user.id).order('event_date', { ascending: true }),
        supabase.from('stats').select('level, total_xp_earned, total_xp_lost, total_income, total_actions, total_sales, total_clients')
          .eq('user_id', user.id).single(),
        supabase.from('profiles').select('streak_current, streak_best')
          .eq('id', user.id).single(),
      ]);

      setIncomeEvents((incData || []).map(r => ({ ...r, amount: Number(r.amount) })));
      setCompletions(compData || []);
      setXPEvents(xpData || []);
      setStats(statsData);
      setStreakCurrent(profileData?.streak_current || 0);
      setStreakBest(profileData?.streak_best || 0);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filter by period
  function filterByDate<T extends { event_date?: string; completion_date?: string }>(items: T[]): T[] {
    if (period === 'all') return items;
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'week': startDate = new Date(now.getTime() - 7 * 86400000); break;
      case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'quarter': startDate = new Date(now.getTime() - 90 * 86400000); break;
      case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
      default: return items;
    }
    return items.filter(item => {
      const d = new Date((item.event_date || item.completion_date) as string);
      return d >= startDate;
    });
  }

  const filteredIncome = useMemo(() => filterByDate(incomeEvents), [incomeEvents, period]);
  const filteredCompletions = useMemo(() => filterByDate(completions), [completions, period]);
  const filteredXP = useMemo(() => filterByDate(xpEvents), [xpEvents, period]);

  // Overview
  const overview = useMemo(() => {
    const totalIncome = filteredIncome.reduce((s, r) => s + r.amount, 0);
    const totalActions = filteredCompletions.reduce((s, r) => s + r.count_done, 0);
    const totalXP = filteredXP.filter(r => r.xp_amount > 0).reduce((s, r) => s + r.xp_amount, 0);
    const lostXP = filteredXP.filter(r => r.xp_amount < 0).reduce((s, r) => s + Math.abs(r.xp_amount), 0);
    const activeDays = new Set([
      ...filteredCompletions.map(c => c.completion_date),
      ...filteredXP.map(x => x.event_date),
    ]).size;
    const avgDailyIncome = activeDays > 0 ? totalIncome / activeDays : 0;

    return { totalIncome, totalActions, totalXP, lostXP, activeDays, avgDailyIncome };
  }, [filteredIncome, filteredCompletions, filteredXP]);

  // Income by source
  const incomeBySource = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    const total = filteredIncome.reduce((s, r) => s + r.amount, 0);
    filteredIncome.forEach(r => {
      const src = r.source || 'other';
      const existing = map.get(src) || { amount: 0, count: 0 };
      existing.amount += r.amount;
      existing.count += 1;
      map.set(src, existing);
    });
    return Array.from(map.entries())
      .map(([category, { amount, count }]) => ({
        category: t.analytics?.sources?.[category as keyof typeof t.analytics.sources] || category,
        amount, count,
        percent: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredIncome, t]);

  // XP by type
  const xpByType = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    const positiveXP = filteredXP.filter(r => r.xp_amount > 0);
    const total = positiveXP.reduce((s, r) => s + r.xp_amount, 0);
    positiveXP.forEach(r => {
      const existing = map.get(r.event_type) || { amount: 0, count: 0 };
      existing.amount += r.xp_amount;
      existing.count += 1;
      map.set(r.event_type, existing);
    });
    return Array.from(map.entries())
      .map(([category, { amount, count }]) => ({
        category, amount, count,
        percent: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredXP]);

  // Daily trend
  const dailyTrendData = useMemo(() => {
    const map = new Map<string, { date: string; income: number; actions: number; xp: number }>();
    const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US';

    filteredIncome.forEach(r => {
      const d = r.event_date;
      const existing = map.get(d) || { date: d, income: 0, actions: 0, xp: 0 };
      existing.income += r.amount;
      map.set(d, existing);
    });

    filteredCompletions.forEach(r => {
      const d = r.completion_date;
      const existing = map.get(d) || { date: d, income: 0, actions: 0, xp: 0 };
      existing.actions += r.count_done;
      map.set(d, existing);
    });

    filteredXP.forEach(r => {
      const d = r.event_date;
      const existing = map.get(d) || { date: d, income: 0, actions: 0, xp: 0 };
      if (r.xp_amount > 0) existing.xp += r.xp_amount;
      map.set(d, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        dateLabel: new Date(d.date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' }),
      }));
  }, [filteredIncome, filteredCompletions, filteredXP, locale]);

  // Monthly comparison
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; income: number; actions: number; xp: number }>();
    const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US';

    incomeEvents.forEach(r => {
      const key = r.event_date.slice(0, 7);
      const existing = map.get(key) || { month: key, income: 0, actions: 0, xp: 0 };
      existing.income += r.amount;
      map.set(key, existing);
    });

    completions.forEach(r => {
      const key = r.completion_date.slice(0, 7);
      const existing = map.get(key) || { month: key, income: 0, actions: 0, xp: 0 };
      existing.actions += r.count_done;
      map.set(key, existing);
    });

    xpEvents.forEach(r => {
      const key = r.event_date.slice(0, 7);
      const existing = map.get(key) || { month: key, income: 0, actions: 0, xp: 0 };
      if (r.xp_amount > 0) existing.xp += r.xp_amount;
      map.set(key, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map(d => ({
        ...d,
        label: new Date(d.month + '-01').toLocaleDateString(dateLocale, { month: 'short', year: '2-digit' }),
      }));
  }, [incomeEvents, completions, xpEvents, locale]);

  // PDF Export
  async function handleExportPdf(pdfLocale: 'ru' | 'en') {
    setPdfLoading(true);
    setPdfLangOpen(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user?.id ?? '').single();

      const periodLabels: Record<string, Record<Period, string>> = {
        ru: { week: 'Неделя', month: 'Месяц', quarter: 'Квартал', year: 'Год', all: 'Всё время' },
        en: { week: 'Week', month: 'Month', quarter: 'Quarter', year: 'Year', all: 'All time' },
      };

      await exportStatsPdf({
        displayName: profile?.display_name || 'Hunter',
        period: periodLabels[pdfLocale][period],
        overview: {
          income: overview.totalIncome,
          expenses: 0,
          netProfit: overview.totalIncome,
          count: overview.totalActions,
          avgTransaction: overview.avgDailyIncome,
          profitMargin: 0,
        },
        incomeByCategory: incomeBySource.map(c => ({ category: c.category, amount: c.amount, percent: c.percent })),
        expensesByCategory: [],
        streaks: { current: streakCurrent, longest: streakBest, total: overview.activeDays },
        locale: pdfLocale,
        currency,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    }
    setPdfLoading(false);
  }

  function TrendIcon({ value }: { value: number }) {
    if (value > 2) return <ArrowUpRight className="w-4 h-4 text-green-400" />;
    if (value < -2) return <ArrowDownRight className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  }

  const periodButtons: { key: Period; label: string }[] = [
    { key: 'week', label: t.stats.periods.week },
    { key: 'month', label: t.stats.periods.month },
    { key: 'quarter', label: t.stats.periods.quarter },
    { key: 'year', label: t.stats.periods.year },
    { key: 'all', label: t.stats.periods.all },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
          <p className="text-gray-400">{t.stats.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-7 h-7 text-purple-400" />
            {t.stats.title}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t.stats.subtitle}</p>
        </div>
        <div ref={pdfRef} className="relative">
          <button
            onClick={() => setPdfLangOpen(!pdfLangOpen)}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {t.stats.exportPdf || 'PDF'}
          </button>
          {pdfLangOpen && (
            <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden min-w-40">
              <button onClick={() => handleExportPdf('ru')} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-gray-700 text-white">
                <span className="text-base">🇷🇺</span> {locale === 'ru' ? 'Русский PDF' : 'Russian PDF'}
              </button>
              <button onClick={() => handleExportPdf('en')} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-gray-700 text-white">
                <span className="text-base">🇺🇸</span> English PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Activity Calendar */}
      <ActivityCalendar />

      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {periodButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === key
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <OverviewCard
          icon={<DollarSign className="w-5 h-5 text-green-400" />}
          label={t.stats.overview.totalIncome}
          value={formatCurrency(overview.totalIncome)}
          color="green"
        />
        <OverviewCard
          icon={<Target className="w-5 h-5 text-blue-400" />}
          label={t.stats.overview.transactionCount || (locale === 'ru' ? 'Действия' : 'Actions')}
          value={String(overview.totalActions)}
          color="blue"
        />
        <OverviewCard
          icon={<Zap className="w-5 h-5 text-purple-400" />}
          label={locale === 'ru' ? 'Заработано XP' : 'XP Earned'}
          value={String(overview.totalXP)}
          color="purple"
        />
        <OverviewCard
          icon={<TrendingDown className="w-5 h-5 text-red-400" />}
          label={locale === 'ru' ? 'Потеряно XP' : 'XP Lost'}
          value={String(overview.lostXP)}
          color="red"
        />
        <OverviewCard
          icon={<Calendar className="w-5 h-5 text-cyan-400" />}
          label={locale === 'ru' ? 'Активных дней' : 'Active Days'}
          value={String(overview.activeDays)}
          color="cyan"
        />
        <OverviewCard
          icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
          label={locale === 'ru' ? 'Ср. доход/день' : 'Avg Income/Day'}
          value={formatCurrency(Math.round(overview.avgDailyIncome))}
          color="amber"
        />
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-orange-500/20 rounded-xl">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">{t.stats.streaks.currentStreak}</p>
            <p className="text-2xl font-bold text-white">
              {streakCurrent} <span className="text-sm text-gray-400">{t.stats.streaks.days}</span>
            </p>
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Target className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">{t.stats.streaks.longestStreak}</p>
            <p className="text-2xl font-bold text-white">
              {streakBest} <span className="text-sm text-gray-400">{t.stats.streaks.days}</span>
            </p>
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Calendar className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">{t.stats.streaks.totalActiveDays}</p>
            <p className="text-2xl font-bold text-white">
              {overview.activeDays} <span className="text-sm text-gray-400">{t.stats.streaks.days}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4">{t.stats.charts.dailyTrend}</h3>
          {dailyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyTrendData}>
                <defs>
                  <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradXP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dateLabel" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                  formatter={(value, name) => [
                    name === 'income' ? formatCurrency(Number(value ?? 0)) : String(value ?? 0),
                    name === 'income' ? (locale === 'ru' ? 'Доход' : 'Income')
                      : name === 'actions' ? (locale === 'ru' ? 'Действия' : 'Actions')
                      : 'XP',
                  ]}
                />
                <Area type="monotone" dataKey="income" stroke="#10B981" fill="url(#gradIncome)" name="income" />
                <Area type="monotone" dataKey="xp" stroke="#8B5CF6" fill="url(#gradXP)" name="xp" />
                <Legend formatter={(value) =>
                  value === 'income' ? (locale === 'ru' ? 'Доход' : 'Income')
                  : value === 'xp' ? 'XP'
                  : (locale === 'ru' ? 'Действия' : 'Actions')
                } />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message={t.stats.categories.noData} />
          )}
        </div>

        {/* Monthly Comparison */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4">{t.stats.charts.monthlyComparison}</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                  formatter={(value, name) => [
                    name === 'income' ? formatCurrency(Number(value ?? 0)) : String(value ?? 0),
                    name === 'income' ? (locale === 'ru' ? 'Доход' : 'Income')
                      : name === 'actions' ? (locale === 'ru' ? 'Действия' : 'Actions')
                      : 'XP',
                  ]}
                />
                <Legend formatter={(value) =>
                  value === 'income' ? (locale === 'ru' ? 'Доход' : 'Income')
                  : value === 'actions' ? (locale === 'ru' ? 'Действия' : 'Actions')
                  : 'XP'
                } />
                <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name="income" />
                <Bar dataKey="actions" fill="#3B82F6" radius={[4, 4, 0, 0]} name="actions" />
                <Bar dataKey="xp" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="xp" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message={t.stats.categories.noData} />
          )}
        </div>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income by Source */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4">{locale === 'ru' ? 'Доход по источникам' : 'Income by Source'}</h3>
          {incomeBySource.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={incomeBySource} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="amount" nameKey="category" paddingAngle={2}>
                    {incomeBySource.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                  />
                </PieChart>
              </ResponsiveContainer>
              <CategoryLegend categories={incomeBySource} formatCurrency={formatCurrency} />
            </div>
          ) : (
            <EmptyState message={t.stats.categories.noData} />
          )}
        </div>

        {/* XP by Type */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4">{locale === 'ru' ? 'XP по типам' : 'XP by Type'}</h3>
          {xpByType.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={xpByType} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="amount" nameKey="category" paddingAngle={2}>
                    {xpByType.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => String(value) + ' XP'}
                  />
                </PieChart>
              </ResponsiveContainer>
              <CategoryLegend categories={xpByType} formatCurrency={(n) => n + ' XP'} />
            </div>
          ) : (
            <EmptyState message={t.stats.categories.noData} />
          )}
        </div>
      </div>

      {/* Top Sources */}
      {incomeBySource.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            {t.stats.topSources.title}
          </h3>
          <div className="space-y-3">
            {incomeBySource.slice(0, 5).map((cat, idx) => (
              <div key={cat.category} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: `${COLORS[idx % COLORS.length]}20`, color: COLORS[idx % COLORS.length] }}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{cat.category}</p>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full transition-all"
                      style={{ width: `${cat.percent}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{formatCurrency(cat.amount)}</p>
                  <p className="text-xs text-gray-400">{cat.percent.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All-time stats from DB */}
      {stats && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            {locale === 'ru' ? 'Общая статистика' : 'All-time Statistics'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: locale === 'ru' ? 'Уровень' : 'Level', value: String(stats.level), color: '#a78bfa' },
              { label: locale === 'ru' ? 'Всего XP' : 'Total XP', value: String(stats.total_xp_earned), color: '#8B5CF6' },
              { label: locale === 'ru' ? 'Доход' : 'Income', value: formatCurrency(Number(stats.total_income)), color: '#22c55e' },
              { label: locale === 'ru' ? 'Действия' : 'Actions', value: String(stats.total_actions), color: '#3b82f6' },
              { label: locale === 'ru' ? 'Продажи' : 'Sales', value: String(stats.total_sales), color: '#f59e0b' },
              { label: locale === 'ru' ? 'Клиенты' : 'Clients', value: String(stats.total_clients), color: '#06b6d4' },
            ].map((s, i) => (
              <div key={i} className="bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============= Sub-components =============

function OverviewCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  const bgColors: Record<string, string> = {
    green: 'bg-green-500/10 border-green-500/20',
    red: 'bg-red-500/10 border-red-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20',
    blue: 'bg-blue-500/10 border-blue-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20',
    cyan: 'bg-cyan-500/10 border-cyan-500/20',
  };
  return (
    <div className={`rounded-xl border p-4 ${bgColors[color] || bgColors.purple}`}>
      <div className="flex items-center justify-between mb-2">{icon}</div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-white truncate">{value}</p>
    </div>
  );
}

function CategoryLegend({ categories, formatCurrency }: {
  categories: CategoryStat[]; formatCurrency: (n: number) => string;
}) {
  return (
    <div className="w-full mt-4 space-y-2">
      {categories.slice(0, 6).map((cat, idx) => (
        <div key={cat.category} className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
          <span className="text-gray-300 flex-1 truncate">{cat.category}</span>
          <span className="text-white font-medium">{formatCurrency(cat.amount)}</span>
          <span className="text-gray-500 w-12 text-right">{cat.percent.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-50 text-gray-500">
      <p>{message}</p>
    </div>
  );
}
