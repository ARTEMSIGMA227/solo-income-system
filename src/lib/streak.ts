export function calculateStreak(dates: string[]): {
  current: number;
  checkedToday: boolean;
} {
  if (dates.length === 0) return { current: 0, checkedToday: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sorted = [...new Set(dates)]
    .map((d) => {
      const dt = new Date(d + "T00:00:00");
      dt.setHours(0, 0, 0, 0);
      return dt;
    })
    .sort((a, b) => b.getTime() - a.getTime());

  const diffDays = (a: Date, b: Date) =>
    Math.round((a.getTime() - b.getTime()) / 86_400_000);

  const checkedToday = diffDays(today, sorted[0]) === 0;

  // если последний чекин > 1 дня назад — серия сброшена
  const gap = diffDays(today, sorted[0]);
  if (gap > 1) return { current: 0, checkedToday: false };

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (diffDays(sorted[i - 1], sorted[i]) === 1) {
      streak++;
    } else {
      break;
    }
  }

  return { current: streak, checkedToday };
}