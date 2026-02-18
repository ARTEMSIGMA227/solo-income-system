// src/lib/export-pdf.ts

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
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatMoney(n: number): string {
  return n.toLocaleString('en-US') + ' RUB';
}

function eventTypeLabel(type: string): string {
  const map: Record<string, string> = {
    task: 'Quest',
    action: 'Action',
    sale: 'Sale',
    streak_checkin: 'Streak',
    perk_bonus: 'Perk',
    boss_damage: 'Boss',
    shop_purchase: 'Shop',
    penalty: 'Penalty',
  };
  return map[type] || type;
}

export async function exportAnalyticsPdf(data: PdfExportData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  // ===== HEADER =====
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, pageW, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('SOLO INCOME SYSTEM', 14, 18);

  doc.setFontSize(10);
  doc.text('Analytics Report | ' + formatDate(), 14, 27);

  // ===== PLAYER CARD =====
  doc.setFillColor(18, 18, 26);
  doc.roundedRect(14, 42, pageW - 28, 28, 3, 3, 'F');

  doc.setTextColor(167, 139, 250);
  doc.setFontSize(16);
  doc.text(data.displayName, 22, 54);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(10);
  doc.text('Level ' + String(data.level), 22, 63);

  doc.setTextColor(34, 197, 94);
  doc.text('Streak: ' + String(data.streakCurrent) + ' days (best: ' + String(data.streakBest) + ')', pageW - 22, 54, { align: 'right' });

  // ===== STATS TABLE =====
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('Key Metrics', 14, 82);

  autoTable(doc, {
    startY: 86,
    head: [['Metric', 'Value']],
    body: [
      ['Total XP', String(data.totalXp)],
      ['Total Income', formatMoney(data.totalIncome)],
      ['Total Actions', String(data.totalActions)],
      ['Total Sales', String(data.totalSales)],
      ['Total Clients', String(data.totalClients)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [124, 58, 237],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fillColor: [22, 22, 31],
      textColor: [226, 232, 240],
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [18, 18, 26],
    },
    styles: {
      cellPadding: 6,
      lineColor: [30, 30, 46],
      lineWidth: 0.5,
    },
    margin: { left: 14, right: 14 },
  });

  // ===== QUESTS TABLE =====
  const afterStats = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;

  if (data.quests.length > 0) {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('Quests', 14, afterStats);

    autoTable(doc, {
      startY: afterStats + 4,
      head: [['Quest', 'XP Reward', 'Completions']],
      body: data.quests.map((q) => [
        q.title.length > 30 ? q.title.substring(0, 30) + '...' : q.title,
        String(q.xp),
        String(q.completions),
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
      },
      bodyStyles: {
        fillColor: [22, 22, 31],
        textColor: [226, 232, 240],
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [18, 18, 26],
      },
      styles: {
        cellPadding: 5,
        lineColor: [30, 30, 46],
        lineWidth: 0.5,
      },
      margin: { left: 14, right: 14 },
    });
  }

  // ===== RECENT EVENTS =====
  const afterQuests = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;

  if (data.recentEvents.length > 0) {
    // Check if we need a new page
    if (afterQuests > 240) {
      doc.addPage();
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text('Recent Activity (last 30)', 14, 20);

      autoTable(doc, {
        startY: 24,
        head: [['Date', 'Type', 'XP', 'Details']],
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
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          fillColor: [22, 22, 31],
          textColor: [226, 232, 240],
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [18, 18, 26],
        },
        styles: {
          cellPadding: 4,
          lineColor: [30, 30, 46],
          lineWidth: 0.5,
        },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 22 },
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 'auto' },
        },
        margin: { left: 14, right: 14 },
      });
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text('Recent Activity (last 30)', 14, afterQuests);

      autoTable(doc, {
        startY: afterQuests + 4,
        head: [['Date', 'Type', 'XP', 'Details']],
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
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          fillColor: [22, 22, 31],
          textColor: [226, 232, 240],
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [18, 18, 26],
        },
        styles: {
          cellPadding: 4,
          lineColor: [30, 30, 46],
          lineWidth: 0.5,
        },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 22 },
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 'auto' },
        },
        margin: { left: 14, right: 14 },
      });
    }
  }

  // ===== FOOTER ON ALL PAGES =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();

    doc.setFillColor(124, 58, 237);
    doc.rect(0, pageH - 15, pageW, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(
      'Solo Income System | Generated ' + formatDate() + ' | Page ' + String(i) + '/' + String(pageCount),
      pageW / 2,
      pageH - 5,
      { align: 'center' },
    );
  }

  doc.save('solo-analytics-' + new Date().toISOString().split('T')[0] + '.pdf');
}