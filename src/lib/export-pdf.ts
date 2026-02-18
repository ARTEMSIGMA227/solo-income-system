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
}

function formatDate(): string {
  return new Date().toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatMoney(n: number): string {
  return n.toLocaleString('ru-RU') + ' \u20BD';
}

function eventTypeLabel(type: string): string {
  const map: Record<string, string> = {
    task: '\u041A\u0432\u0435\u0441\u0442',
    hard_task: '\u0421\u043B\u043E\u0436\u043D\u044B\u0439',
    action: '\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435',
    sale: '\u041F\u0440\u043E\u0434\u0430\u0436\u0430',
    streak_checkin: '\u0421\u0435\u0440\u0438\u044F',
    perk_bonus: '\u041F\u0435\u0440\u043A',
    boss_damage: '\u0411\u043E\u0441\u0441',
    shop_purchase: '\u041C\u0430\u0433\u0430\u0437\u0438\u043D',
    penalty: '\u0428\u0442\u0440\u0430\u0444',
  };
  return map[type] || type;
}

export async function exportAnalyticsPdf(data: PdfExportData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

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
  doc.text('\u0410\u043D\u0430\u043B\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043E\u0442\u0447\u0451\u0442 | ' + formatDate(), 14, 27);

  // ===== PLAYER CARD =====
  doc.setFillColor(18, 18, 26);
  doc.roundedRect(14, 42, pageW - 28, 28, 3, 3, 'F');

  doc.setTextColor(167, 139, 250);
  doc.setFontSize(16);
  doc.text(data.displayName, 22, 54);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(10);
  doc.text('\u0423\u0440\u043E\u0432\u0435\u043D\u044C ' + String(data.level), 22, 63);

  doc.setTextColor(34, 197, 94);
  doc.text(
    '\u0421\u0435\u0440\u0438\u044F: ' + String(data.streakCurrent) + ' \u0434\u043D. (\u043B\u0443\u0447\u0448\u0430\u044F: ' + String(data.streakBest) + ')',
    pageW - 22, 54, { align: 'right' },
  );

  // ===== STATS TABLE =====
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('\u041A\u043B\u044E\u0447\u0435\u0432\u044B\u0435 \u043C\u0435\u0442\u0440\u0438\u043A\u0438', 14, 82);

  autoTable(doc, {
    startY: 86,
    head: [['\u041C\u0435\u0442\u0440\u0438\u043A\u0430', '\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u0435']],
    body: [
      ['\u041E\u0431\u0449\u0438\u0439 XP', String(data.totalXp)],
      ['\u041E\u0431\u0449\u0438\u0439 \u0434\u043E\u0445\u043E\u0434', formatMoney(data.totalIncome)],
      ['\u0412\u0441\u0435\u0433\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439', String(data.totalActions)],
      ['\u0412\u0441\u0435\u0433\u043E \u043F\u0440\u043E\u0434\u0430\u0436', String(data.totalSales)],
      ['\u0412\u0441\u0435\u0433\u043E \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432', String(data.totalClients)],
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
    doc.text('\u041A\u0432\u0435\u0441\u0442\u044B', 14, afterStats);

    autoTable(doc, {
      startY: afterStats + 4,
      head: [['\u041A\u0432\u0435\u0441\u0442', 'XP', '\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F']],
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
    doc.text('\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u044F (30)', 14, startY);

    autoTable(doc, {
      startY: startY + 4,
      head: [['\u0414\u0430\u0442\u0430', '\u0422\u0438\u043F', 'XP', '\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435']],
      body: data.recentEvents.map((e) => [
        e.date,
        eventTypeLabel(e.type),
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
      'Solo Income System | ' + formatDate() + ' | ' + String(i) + '/' + String(pageCount),
      pageW / 2, pageH - 5, { align: 'center' },
    );
  }

  doc.save('solo-analytics-' + new Date().toISOString().split('T')[0] + '.pdf');
}