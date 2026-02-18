import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export function exportAnalyticsPdf(data: PdfExportData): void {
  const doc = new jsPDF();
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Header
  doc.setFontSize(20);
  doc.setTextColor(124, 58, 237);
  doc.text('Solo Income System', 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(dateStr, 14, 28);

  // Player info
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`Hunter: ${data.displayName}`, 14, 42);
  doc.text(`Level: ${data.level}`, 14, 50);

  // Stats table
  autoTable(doc, {
    startY: 58,
    head: [['Metric', 'Value']],
    body: [
      ['Total XP', String(data.totalXp)],
      ['Total Income', `${data.totalIncome.toLocaleString('ru-RU')} RUB`],
      ['Total Actions', String(data.totalActions)],
      ['Total Sales', String(data.totalSales)],
      ['Total Clients', String(data.totalClients)],
      ['Current Streak', `${data.streakCurrent} days`],
      ['Best Streak', `${data.streakBest} days`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [124, 58, 237] },
    styles: { fontSize: 11 },
  });

  // Quests table
  const questsY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  if (data.quests.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Quests', 14, questsY);

    autoTable(doc, {
      startY: questsY + 4,
      head: [['Quest', 'XP', 'Completions']],
      body: data.quests.map((q) => [q.title, String(q.xp), String(q.completions)]),
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 10 },
    });
  }

  // Recent events
  const eventsY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  if (data.recentEvents.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Recent Events (last 30)', 14, eventsY);

    autoTable(doc, {
      startY: eventsY + 4,
      head: [['Date', 'Type', 'XP', 'Description']],
      body: data.recentEvents.map((e) => [e.date, e.type, String(e.xp), e.description]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Solo Income System | Page ${i}/${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' },
    );
  }

  doc.save(`solo-analytics-${now.toISOString().split('T')[0]}.pdf`);
}