'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';
import { exportStatsPdf } from '@/lib/export-pdf';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, DollarSign,
  Activity, Calendar, Target, ArrowUpRight, ArrowDownRight,
  Loader2, FileDown, Flame,
} from 'lucide-react';

type Period = 'week' | 'month' | 'quarter' | 'year' | 'all';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  created_at: string;
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

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfLangOpen, setPdfLangOpen] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pdfRef.current && !pdfRef.current.contains(e.target as Node)) {
        setPdfLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Load transactions
  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    if (period === 'all') return transactions;

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return transactions;
    }

    return transactions.filter(tx => new Date(tx.date) >= startDate);
  }, [transactions, period]);

  // Previous period transactions for comparison
  const prevPeriodTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'week':
        endDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        endDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'quarter':
        endDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        endDate = new Date(now.getFullYear(), 0, 1);
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        break;
      default:
        return [];
    }

    return transactions.filter(tx => {
      const d = new Date(tx.date);
      return d >= startDate && d < endDate;
    });
  }, [transactions, period]);

  // Compute overview stats
  const overview = useMemo(() => {
    const income = filteredTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expenses = filteredTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const netProfit = income - expenses;
    const count = filteredTransactions.length;
    const avgTransaction = count > 0
      ? filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0) / count
      : 0;
    const profitMargin = income > 0 ? (netProfit / income) * 100 : 0;

    const prevIncome = prevPeriodTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const prevExpenses = prevPeriodTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const prevProfit = prevIncome - prevExpenses;

    const incomeChange = prevIncome > 0
      ? ((income - prevIncome) / prevIncome) * 100
      : income > 0 ? 100 : 0;
    const expensesChange = prevExpenses > 0
      ? ((expenses - prevExpenses) / prevExpenses) * 100
      : expenses > 0 ? 100 : 0;
    const profitChange = prevProfit !== 0
      ? ((netProfit - prevProfit) / Math.abs(prevProfit)) * 100
      : netProfit > 0 ? 100 : 0;

    return {
      income, expenses, netProfit, count, avgTransaction, profitMargin,
      incomeChange, expensesChange, profitChange,
    };
  }, [filteredTransactions, prevPeriodTransactions]);

  // Category stats
  const incomeByCategory = useMemo(() => {
    return getCategoryStats(filteredTransactions.filter(tx => tx.type === 'income'));
  }, [filteredTransactions]);

  const expensesByCategory = useMemo(() => {
    return getCategoryStats(filteredTransactions.filter(tx => tx.type === 'expense'));
  }, [filteredTransactions]);

  function getCategoryStats(txs: Transaction[]): CategoryStat[] {
    const map = new Map<string, { amount: number; count: number }>();
    const total = txs.reduce((sum, tx) => sum + tx.amount, 0);

    txs.forEach(tx => {
      const existing = map.get(tx.category) || { amount: 0, count: 0 };
      existing.amount += tx.amount;
      existing.count += 1;
      map.set(tx.category, existing);
    });

    return Array.from(map.entries())
      .map(([category, { amount, count }]) => ({
        category,
        amount,
        count,
        percent: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  // Daily trend chart data
  const dailyTrendData = useMemo(() => {
    const map = new Map<string, { date: string; income: number; expenses: number }>();

    filteredTransactions.forEach(tx => {
      const dateKey = tx.date.slice(0, 10);
      const existing = map.get(dateKey) || { date: dateKey, income: 0, expenses: 0 };
      if (tx.type === 'income') existing.income += tx.amount;
      else existing.expenses += tx.amount;
      map.set(dateKey, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        profit: d.income - d.expenses,
        dateLabel: new Date(d.date).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
          month: 'short', day: 'numeric',
        }),
      }));
  }, [filteredTransactions, locale]);

  // Monthly comparison data
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expenses: number }>();

    transactions.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = map.get(key) || { month: key, income: 0, expenses: 0 };
      if (tx.type === 'income') existing.income += tx.amount;
      else existing.expenses += tx.amount;
      map.set(key, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map(d => ({
        ...d,
        profit: d.income - d.expenses,
        label: new Date(d.month + '-01').toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
          month: 'short', year: '2-digit',
        }),
      }));
  }, [transactions, locale]);

  // Activity streaks
  const streakInfo = useMemo(() => {
    const activeDays = new Set(transactions.map(tx => tx.date.slice(0, 10)));
    const sortedDays = Array.from(activeDays).sort();

    if (sortedDays.length === 0) return { current: 0, longest: 0, total: 0 };

    let current = 0;
    let longest = 0;
    let streak = 1;

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (activeDays.has(today) || activeDays.has(yesterday)) {
      const startFrom = activeDays.has(today) ? today : yesterday;
      current = 1;
      let checkDate = new Date(startFrom);
      while (true) {
        checkDate = new Date(checkDate.getTime() - 86400000);
        if (activeDays.has(checkDate.toISOString().slice(0, 10))) {
          current++;
        } else {
          break;
        }
      }
    }

    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) {
        streak++;
      } else {
        longest = Math.max(longest, streak);
        streak = 1;
      }
    }
    longest = Math.max(longest, streak);

    return { current, longest, total: sortedDays.length };
  }, [transactions]);

  // PDF Export
  async function handleExportPdf(pdfLocale: 'ru' | 'en') {
    setPdfLoading(true);
    setPdfLangOpen(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user?.id ?? '')
        .single();

      const periodLabels: Record<string, Record<Period, string>> = {
        ru: { week: 'Неделя', month: 'Месяц', quarter: 'Квартал', year: 'Год', all: 'Всё время' },
        en: { week: 'Week', month: 'Month', quarter: 'Quarter', year: 'Year', all: 'All time' },
      };

      await exportStatsPdf({
        displayName: profile?.display_name || 'Hunter',
        period: periodLabels[pdfLocale][period],
        overview,
        incomeByCategory: incomeByCategory.map(c => ({ category: c.category, amount: c.amount, percent: c.percent })),
        expensesByCategory: expensesByCategory.map(c => ({ category: c.category, amount: c.amount, percent: c.percent })),
        streaks: streakInfo,
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

  function ChangeLabel({ value, inverse = false }: { value: number; inverse?: boolean }) {
    const isPositive = inverse ? value < 0 : value > 0;
    const color = Math.abs(value) < 2
      ? 'text-gray-400'
      : isPositive ? 'text-green-400' : 'text-red-400';

    return (
      <span className={`text-xs ${color} flex items-center gap-1`}>
        <TrendIcon value={inverse ? -value : value} />
        {value > 0 ? '+' : ''}{value.toFixed(1)}%
      </span>
    );
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

        {/* PDF Export with language selector */}
        <div ref={pdfRef} className="relative">
          <button
            onClick={() => setPdfLangOpen(!pdfLangOpen)}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pdfLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            {t.stats.exportPdf || 'PDF'}
          </button>

          {pdfLangOpen && (
            <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden min-w-40">
              <button
                onClick={() => handleExportPdf('ru')}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-gray-700 transition-colors text-white"
              >
                <span className="text-base">🇷🇺</span>
                {locale === 'ru' ? 'Русский PDF' : 'Russian PDF'}
              </button>
              <button
                onClick={() => handleExportPdf('en')}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-gray-700 transition-colors text-white"
              >
                <span className="text-base">🇺🇸</span>
                {locale === 'ru' ? 'English PDF' : 'English PDF'}
              </button>
            </div>
          )}
        </div>
      </div>

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
          icon={<TrendingUp className="w-5 h-5 text-green-400" />}
          label={t.stats.overview.totalIncome}
          value={formatCurrency(overview.income)}
          change={period !== 'all' ? <ChangeLabel value={overview.incomeChange} /> : undefined}
          color="green"
        />
        <OverviewCard
          icon={<TrendingDown className="w-5 h-5 text-red-400" />}
          label={t.stats.overview.totalExpenses}
          value={formatCurrency(overview.expenses)}
          change={period !== 'all' ? <ChangeLabel value={overview.expensesChange} inverse /> : undefined}
          color="red"
        />
        <OverviewCard
          icon={<DollarSign className="w-5 h-5 text-purple-400" />}
          label={t.stats.overview.netProfit}
          value={formatCurrency(overview.netProfit)}
          change={period !== 'all' ? <ChangeLabel value={overview.profitChange} /> : undefined}
          color={overview.netProfit >= 0 ? 'purple' : 'red'}
        />
        <OverviewCard
          icon={<Activity className="w-5 h-5 text-blue-400" />}
          label={t.stats.overview.transactionCount}
          value={overview.count.toString()}
          color="blue"
        />
        <OverviewCard
          icon={<Target className="w-5 h-5 text-amber-400" />}
          label={t.stats.overview.avgTransaction}
          value={formatCurrency(overview.avgTransaction)}
          color="amber"
        />
        <OverviewCard
          icon={<Calendar className="w-5 h-5 text-cyan-400" />}
          label={t.stats.overview.profitMargin}
          value={`${overview.profitMargin.toFixed(1)}%`}
          color="cyan"
        />
      </div>

      {/* Activity Streaks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-orange-500/20 rounded-xl">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">{t.stats.streaks.currentStreak}</p>
            <p className="text-2xl font-bold text-white">
              {streakInfo.current} <span className="text-sm text-gray-400">{t.stats.streaks.days}</span>
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
              {streakInfo.longest} <span className="text-sm text-gray-400">{t.stats.streaks.days}</span>
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
              {streakInfo.total} <span className="text-sm text-gray-400">{t.stats.streaks.days}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Daily Trend + Income vs Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dateLabel" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937', border: '1px solid #374151',
                    borderRadius: '8px', color: '#fff',
                  }}
                  formatter={(value, name) => [
                    formatCurrency(Number(value ?? 0)),
                    name === 'income' ? t.stats.charts.income
                      : name === 'expenses' ? t.stats.charts.expenses
                      : t.stats.charts.profit,
                  ]}
                />
                <Area
                  type="monotone" dataKey="income" stroke="#10B981"
                  fill="url(#gradIncome)" name="income"
                />
                <Area
                  type="monotone" dataKey="expenses" stroke="#EF4444"
                  fill="url(#gradExpenses)" name="expenses"
                />
                <Legend
                  formatter={(value) =>
                    value === 'income' ? t.stats.charts.income
                    : value === 'expenses' ? t.stats.charts.expenses
                    : t.stats.charts.profit
                  }
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message={t.stats.categories.noData} />
          )}
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4">{t.stats.charts.monthlyComparison}</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937', border: '1px solid #374151',
                    borderRadius: '8px', color: '#fff',
                  }}
                  formatter={(value, name) => [
                    formatCurrency(Number(value ?? 0)),
                    name === 'income' ? t.stats.charts.income
                      : name === 'expenses' ? t.stats.charts.expenses
                      : t.stats.charts.profit,
                  ]}
                />
                <Legend
                  formatter={(value) =>
                    value === 'income' ? t.stats.charts.income
                    : value === 'expenses' ? t.stats.charts.expenses
                    : t.stats.charts.profit
                  }
                />
                <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name="income" />
                <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name="expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message={t.stats.categories.noData} />
          )}
        </div>
      </div>

      {/* Charts Row 2: Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4">{t.stats.charts.incomeByCategory}</h3>
          {incomeByCategory.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={incomeByCategory}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    dataKey="amount"
                    nameKey="category"
                    paddingAngle={2}
                  >
                    {incomeByCategory.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937', border: '1px solid #374151',
                      borderRadius: '8px', color: '#fff',
                    }}
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                  />
                </PieChart>
              </ResponsiveContainer>
              <CategoryLegend
                categories={incomeByCategory}
                formatCurrency={formatCurrency}
                labels={{ category: t.stats.categories.category, amount: t.stats.categories.amount, percent: t.stats.categories.percent }}
              />
            </div>
          ) : (
            <EmptyState message={t.stats.categories.noData} />
          )}
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4">{t.stats.charts.expensesByCategory}</h3>
          {expensesByCategory.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    dataKey="amount"
                    nameKey="category"
                    paddingAngle={2}
                  >
                    {expensesByCategory.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937', border: '1px solid #374151',
                      borderRadius: '8px', color: '#fff',
                    }}
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                  />
                </PieChart>
              </ResponsiveContainer>
              <CategoryLegend
                categories={expensesByCategory}
                formatCurrency={formatCurrency}
                labels={{ category: t.stats.categories.category, amount: t.stats.categories.amount, percent: t.stats.categories.percent }}
              />
            </div>
          ) : (
            <EmptyState message={t.stats.categories.noData} />
          )}
        </div>
      </div>

      {/* Top Sources / Expenses Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            {t.stats.topSources.title}
          </h3>
          {incomeByCategory.length > 0 ? (
            <div className="space-y-3">
              {incomeByCategory.slice(0, 5).map((cat, idx) => (
                <div key={cat.category} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: `${COLORS[idx % COLORS.length]}20`, color: COLORS[idx % COLORS.length] }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{cat.category}</p>
                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${cat.percent}%`,
                          backgroundColor: COLORS[idx % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{formatCurrency(cat.amount)}</p>
                    <p className="text-xs text-gray-400">{cat.percent.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message={t.stats.categories.noData} />
          )}
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            {t.stats.topExpenses.title}
          </h3>
          {expensesByCategory.length > 0 ? (
            <div className="space-y-3">
              {expensesByCategory.slice(0, 5).map((cat, idx) => (
                <div key={cat.category} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: `${COLORS[idx % COLORS.length]}20`, color: COLORS[idx % COLORS.length] }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{cat.category}</p>
                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${cat.percent}%`,
                          backgroundColor: COLORS[idx % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{formatCurrency(cat.amount)}</p>
                    <p className="text-xs text-gray-400">{cat.percent.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message={t.stats.categories.noData} />
          )}
        </div>
      </div>
    </div>
  );
}

// ============= Sub-components =============

function OverviewCard({
  icon, label, value, change, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: React.ReactNode;
  color: string;
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
      <div className="flex items-center justify-between mb-2">
        {icon}
        {change}
      </div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-white truncate">{value}</p>
    </div>
  );
}

function CategoryLegend({
  categories, formatCurrency, labels,
}: {
  categories: CategoryStat[];
  formatCurrency: (n: number) => string;
  labels: { category: string; amount: string; percent: string };
}) {
  return (
    <div className="w-full mt-4 space-y-2">
      {categories.slice(0, 6).map((cat, idx) => (
        <div key={cat.category} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
          />
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
