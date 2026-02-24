import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ru-RU').format(num);
}

/**
 * @deprecated Use formatCurrency from useT() context instead for currency-aware formatting.
 * This function is kept for backward compatibility — defaults to RUB.
 */
export function formatCurrency(
  amount: number,
  currency: 'RUB' | 'USD' = 'RUB',
  locale: string = 'ru-RU',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((value / total) * 100), 100);
}

export function getToday(timezone: string = 'Europe/Berlin'): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

export function getWeekStart(timezone: string = 'Europe/Berlin'): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toLocaleDateString('en-CA', { timeZone: timezone });
}

export function getMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}
