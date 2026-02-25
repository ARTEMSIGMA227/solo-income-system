// src/lib/export-pdf.ts
import { ROBOTO_BASE64 } from './roboto-font';

interface PdfExportData {
  displayName: string;
  level: number;
  totalXp: number;
  totalIncome: number;
  totalActions: number;
  totalSales: number;
  totalClients: number;
  streakCurrent: number;
  streakBest: number;
  quests: { title: string; xp: number; completions: number }[];
  recentEvents: { date: string; type: string; xp: number; description: string }[];
  locale?: 'ru' | 'en';
  currency?: 'RUB' | 'USD';
}

function formatDate(locale: 'ru' | 'en'): string {
  return new Date().toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatMoney(n: number, locale: 'ru' | 'en', currency: 'RUB' | 'USD'): string {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface Labels {
  reportTitle: string;
  levelLabel: string;
  streakLabel: string;
  bestLabel: string;
  daysLabel: string;
  keyMetrics: string;
  metric: string;
  value: string;
  totalXp: string;
  totalIncome: string;
  totalActions: string;
  totalSales: string;
  totalClients: string;
  quests: string;
  quest: string;
  xp: string;
  completions: string;
  recentEvents: string;
  date: string;
  type: string;
  description: string;
  eventTypes: Record<string, string>;
}

const labelsRu: Labels = {
  reportTitle: 'Аналитический отчёт',
  levelLabel: 'Уровень',
  streakLabel: 'Серия',
  bestLabel: 'лучшая',
  daysLabel: 'дн.',
  keyMetrics: 'Ключевые метрики',
  metric: 'Метрика',
  value: 'Значение',
  totalXp: 'Общий XP',
  totalIncome: 'Общий доход',
  totalActions: 'Всего действий',
  totalSales: 'Всего продаж',
  totalClients: 'Всего клиентов',
  quests: 'Квесты',
  quest: 'Квест',
  xp: 'XP',
  completions: 'Выполнения',
  recentEvents: 'Последние события (30)',
  date: 'Дата',
  type: 'Тип',
  description: 'Описание',
  eventTypes: {
    task: 'Квест',
    hard_task: 'Сложный',
    action: 'Действие',
    sale: 'Продажа',
    streak_checkin: 'Серия',
    perk_bonus: 'Перк',
    boss_damage: 'Босс',
    shop_purchase: 'Магазин',
    penalty: 'Штраф',
  },
};

const labelsEn: Labels = {
  reportTitle: 'Analytics Report',
  levelLabel: 'Level',
  streakLabel: 'Streak',
  bestLabel: 'best',
  daysLabel: 'd.',
  keyMetrics: 'Key Metrics',
  metric: 'Metric',
  value: 'Value',
  totalXp: 'Total XP',
  totalIncome: 'Total Income',
  totalActions: 'Total Actions',
  totalSales: 'Total Sales',
  totalClients: 'Total Clients',
  quests: 'Quests',
  quest: 'Quest',
  xp: 'XP',
  completions: 'Completions',
  recentEvents: 'Recent Events (30)',
  date: 'Date',
  type: 'Type',
  description: 'Description',
  eventTypes: {
    task: 'Quest',
    hard_task: 'Hard',
    action: 'Action',
    sale: 'Sale',
    streak_checkin: 'Streak',
    perk_bonus: 'Perk',
    boss_damage: 'Boss',
    shop_purchase: 'Shop',
    penalty: 'Penalty',
  },
};

export async function exportAnalyticsPdf(data: PdfExportData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const locale = data.locale ?? 'ru';
  const currency = data.currency ?? 'RUB';
  const L = locale === 'ru' ? labelsRu : labelsEn;

  const doc = new jsPDF();

  doc.addFileToVFS('Roboto.ttf', ROBOTO_BASE64);
  doc.addFont('Roboto.ttf', 'Roboto', 'normal');
  doc.setFont('Roboto', 'normal');

  const pageW = doc.internal.pageSize.getWidth();

  function getLastY(): number {
    return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  }

  const tableFont = {
    font: 'Roboto',
    fontStyle: 'normal' as const,
  };

  // ===== HEADER =====
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, pageW, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('SOLO INCOME SYSTEM', 14, 18);

  doc.setFontSize(10);
  doc.text(L.reportTitle + ' | ' + formatDate(locale), 14, 27);

  // ===== PLAYER CARD =====
  doc.setFillColor(18, 18, 26);
  doc.roundedRect(14, 42, pageW - 28, 28, 3, 3, 'F');

  doc.setTextColor(167, 139, 250);
  doc.setFontSize(16);
  doc.text(data.displayName, 22, 54);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(10);
  doc.text(L.levelLabel + ' ' + String(data.level), 22, 63);

  doc.setTextColor(34, 197, 94);
  doc.text(
    L.streakLabel + ': ' + String(data.streakCurrent) + ' ' + L.daysLabel + ' (' + L.bestLabel + ': ' + String(data.streakBest) + ')',
    pageW - 22, 54, { align: 'right' },
  );

  // ===== STATS TABLE =====
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(L.keyMetrics, 14, 82);

  autoTable(doc, {
    startY: 86,
    head: [[L.metric, L.value]],
    body: [
      [L.totalXp, String(data.totalXp)],
      [L.totalIncome, formatMoney(data.totalIncome, locale, currency)],
      [L.totalActions, String(data.totalActions)],
      [L.totalSales, String(data.totalSales)],
      [L.totalClients, String(data.totalClients)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [124, 58, 237],
      textColor: [255, 255, 255],
      fontSize: 11,
      ...tableFont,
    },
    bodyStyles: {
      fillColor: [22, 22, 31],
      textColor: [226, 232, 240],
      fontSize: 10,
      ...tableFont,
    },
    alternateRowStyles: { fillColor: [18, 18, 26] },
    styles: {
      cellPadding: 6,
      lineColor: [30, 30, 46],
      lineWidth: 0.5,
      ...tableFont,
    },
    margin: { left: 14, right: 14 },
  });

  // ===== QUESTS TABLE =====
  const afterStats = getLastY() + 14;

  if (data.quests.length > 0) {
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(L.quests, 14, afterStats);

    autoTable(doc, {
      startY: afterStats + 4,
      head: [[L.quest, L.xp, L.completions]],
      body: data.quests.map((q) => [
        q.title.length > 30 ? q.title.substring(0, 30) + '...' : q.title,
        String(q.xp),
        String(q.completions),
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: [255, 255, 255],
        fontSize: 11,
        ...tableFont,
      },
      bodyStyles: {
        fillColor: [22, 22, 31],
        textColor: [226, 232, 240],
        fontSize: 10,
        ...tableFont,
      },
      alternateRowStyles: { fillColor: [18, 18, 26] },
      styles: {
        cellPadding: 5,
        lineColor: [30, 30, 46],
        lineWidth: 0.5,
        ...tableFont,
      },
      margin: { left: 14, right: 14 },
    });
  }

  // ===== RECENT EVENTS =====
  const afterQuests = getLastY() + 14;

  if (data.recentEvents.length > 0) {
    const startY = afterQuests > 240 ? (() => { doc.addPage(); return 20; })() : afterQuests;

    doc.setFont('Roboto', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(L.recentEvents, 14, startY);

    autoTable(doc, {
      startY: startY + 4,
      head: [[L.date, L.type, L.xp, L.description]],
      body: data.recentEvents.map((e) => [
        e.date,
        L.eventTypes[e.type] || e.type,
        (e.xp >= 0 ? '+' : '') + String(e.xp),
        e.description.length > 35 ? e.description.substring(0, 35) + '...' : e.description,
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontSize: 10,
        ...tableFont,
      },
      bodyStyles: {
        fillColor: [22, 22, 31],
        textColor: [226, 232, 240],
        fontSize: 9,
        ...tableFont,
      },
      alternateRowStyles: { fillColor: [18, 18, 26] },
      styles: {
        cellPadding: 4,
        lineColor: [30, 30, 46],
        lineWidth: 0.5,
        ...tableFont,
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 24 },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
    });
  }

  // ===== FOOTER =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();

    doc.setFillColor(124, 58, 237);
    doc.rect(0, pageH - 15, pageW, 15, 'F');

    doc.setFont('Roboto', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(
      'Solo Income System | ' + formatDate(locale) + ' | ' + String(i) + '/' + String(pageCount),
      pageW / 2, pageH - 5, { align: 'center' },
    );
  }

  doc.save('solo-analytics-' + new Date().toISOString().split('T')[0] + '.pdf');
}

// ===== STATS PAGE PDF EXPORT =====

interface StatsExportData {
  displayName: string;
  period: string;
  overview: {
    income: number;
    expenses: number;
    netProfit: number;
    count: number;
    avgTransaction: number;
    profitMargin: number;
  };
  incomeByCategory: { category: string; amount: number; percent: number }[];
  expensesByCategory: { category: string; amount: number; percent: number }[];
  streaks: { current: number; longest: number; total: number };
  locale?: 'ru' | 'en';
  currency?: 'RUB' | 'USD';
}

interface StatsLabels {
  reportTitle: string;
  periodLabel: string;
  overviewTitle: string;
  metric: string;
  value: string;
  totalIncome: string;
  totalExpenses: string;
  netProfit: string;
  transactions: string;
  avgTransaction: string;
  profitMargin: string;
  incomeByCat: string;
  expensesByCat: string;
  category: string;
  amount: string;
  share: string;
  streaksTitle: string;
  currentStreak: string;
  longestStreak: string;
  activeDays: string;
  days: string;
}

const statsLabelsRu: StatsLabels = {
  reportTitle: 'Финансовый отчёт',
  periodLabel: 'Период',
  overviewTitle: 'Обзор',
  metric: 'Метрика',
  value: 'Значение',
  totalIncome: 'Общий доход',
  totalExpenses: 'Общие расходы',
  netProfit: 'Чистая прибыль',
  transactions: 'Транзакций',
  avgTransaction: 'Средняя транзакция',
  profitMargin: 'Маржа прибыли',
  incomeByCat: 'Доход по категориям',
  expensesByCat: 'Расходы по категориям',
  category: 'Категория',
  amount: 'Сумма',
  share: 'Доля',
  streaksTitle: 'Активность',
  currentStreak: 'Текущая серия',
  longestStreak: 'Лучшая серия',
  activeDays: 'Активных дней',
  days: 'дн.',
};

const statsLabelsEn: StatsLabels = {
  reportTitle: 'Financial Report',
  periodLabel: 'Period',
  overviewTitle: 'Overview',
  metric: 'Metric',
  value: 'Value',
  totalIncome: 'Total Income',
  totalExpenses: 'Total Expenses',
  netProfit: 'Net Profit',
  transactions: 'Transactions',
  avgTransaction: 'Avg Transaction',
  profitMargin: 'Profit Margin',
  incomeByCat: 'Income by Category',
  expensesByCat: 'Expenses by Category',
  category: 'Category',
  amount: 'Amount',
  share: 'Share',
  streaksTitle: 'Activity',
  currentStreak: 'Current Streak',
  longestStreak: 'Longest Streak',
  activeDays: 'Active Days',
  days: 'd.',
};

export async function exportStatsPdf(data: StatsExportData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const locale = data.locale ?? 'ru';
  const currency = data.currency ?? 'RUB';
  const L = locale === 'ru' ? statsLabelsRu : statsLabelsEn;
  const money = (n: number) => formatMoney(n, locale, currency);

  const doc = new jsPDF();

  doc.addFileToVFS('Roboto.ttf', ROBOTO_BASE64);
  doc.addFont('Roboto.ttf', 'Roboto', 'normal');
  doc.setFont('Roboto', 'normal');

  const pageW = doc.internal.pageSize.getWidth();

  const tableFont = {
    font: 'Roboto',
    fontStyle: 'normal' as const,
  };

  function getLastY(): number {
    return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  }

  // ===== HEADER =====
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, pageW, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('SOLO INCOME SYSTEM', 14, 18);

  doc.setFontSize(10);
  doc.text(L.reportTitle + ' | ' + formatDate(locale), 14, 27);

  // ===== PLAYER + PERIOD =====
  doc.setFillColor(18, 18, 26);
  doc.roundedRect(14, 42, pageW - 28, 22, 3, 3, 'F');

  doc.setTextColor(167, 139, 250);
  doc.setFontSize(16);
  doc.text(data.displayName, 22, 56);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(10);
  doc.text(L.periodLabel + ': ' + data.period, pageW - 22, 56, { align: 'right' });

  // ===== OVERVIEW TABLE =====
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(L.overviewTitle, 14, 76);

  autoTable(doc, {
    startY: 80,
    head: [[L.metric, L.value]],
    body: [
      [L.totalIncome, money(data.overview.income)],
      [L.totalExpenses, money(data.overview.expenses)],
      [L.netProfit, money(data.overview.netProfit)],
      [L.transactions, String(data.overview.count)],
      [L.avgTransaction, money(data.overview.avgTransaction)],
      [L.profitMargin, data.overview.profitMargin.toFixed(1) + '%'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontSize: 11, ...tableFont },
    bodyStyles: { fillColor: [22, 22, 31], textColor: [226, 232, 240], fontSize: 10, ...tableFont },
    alternateRowStyles: { fillColor: [18, 18, 26] },
    styles: { cellPadding: 6, lineColor: [30, 30, 46], lineWidth: 0.5, ...tableFont },
    margin: { left: 14, right: 14 },
  });

  // ===== STREAKS =====
  let y = getLastY() + 14;

  doc.setFont('Roboto', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(L.streaksTitle, 14, y);

  autoTable(doc, {
    startY: y + 4,
    head: [[L.metric, L.value]],
    body: [
      [L.currentStreak, data.streaks.current + ' ' + L.days],
      [L.longestStreak, data.streaks.longest + ' ' + L.days],
      [L.activeDays, String(data.streaks.total)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontSize: 11, ...tableFont },
    bodyStyles: { fillColor: [22, 22, 31], textColor: [226, 232, 240], fontSize: 10, ...tableFont },
    alternateRowStyles: { fillColor: [18, 18, 26] },
    styles: { cellPadding: 5, lineColor: [30, 30, 46], lineWidth: 0.5, ...tableFont },
    margin: { left: 14, right: 14 },
  });

  // ===== INCOME BY CATEGORY =====
  y = getLastY() + 14;

  if (data.incomeByCategory.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }

    doc.setFont('Roboto', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(L.incomeByCat, 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [[L.category, L.amount, L.share]],
      body: data.incomeByCategory.map((c) => [c.category, money(c.amount), c.percent.toFixed(1) + '%']),
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255], fontSize: 11, ...tableFont },
      bodyStyles: { fillColor: [22, 22, 31], textColor: [226, 232, 240], fontSize: 10, ...tableFont },
      alternateRowStyles: { fillColor: [18, 18, 26] },
      styles: { cellPadding: 5, lineColor: [30, 30, 46], lineWidth: 0.5, ...tableFont },
      margin: { left: 14, right: 14 },
    });
  }

  // ===== EXPENSES BY CATEGORY =====
  y = getLastY() + 14;

  if (data.expensesByCategory.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }

    doc.setFont('Roboto', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(L.expensesByCat, 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [[L.category, L.amount, L.share]],
      body: data.expensesByCategory.map((c) => [c.category, money(c.amount), c.percent.toFixed(1) + '%']),
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontSize: 11, ...tableFont },
      bodyStyles: { fillColor: [22, 22, 31], textColor: [226, 232, 240], fontSize: 10, ...tableFont },
      alternateRowStyles: { fillColor: [18, 18, 26] },
      styles: { cellPadding: 5, lineColor: [30, 30, 46], lineWidth: 0.5, ...tableFont },
      margin: { left: 14, right: 14 },
    });
  }

  // ===== FOOTER =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();

    doc.setFillColor(124, 58, 237);
    doc.rect(0, pageH - 15, pageW, 15, 'F');

    doc.setFont('Roboto', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(
      'Solo Income System | ' + formatDate(locale) + ' | ' + String(i) + '/' + String(pageCount),
      pageW / 2, pageH - 5, { align: 'center' },
    );
  }

  doc.save('solo-stats-' + new Date().toISOString().split('T')[0] + '.pdf');
}
