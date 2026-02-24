// src/components/ui/currency-toggle.tsx
'use client';
import { useT } from '@/lib/i18n';

export function CurrencyToggle({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency } = useT();

  const toggle = () => {
    setCurrency(currency === 'RUB' ? 'USD' : 'RUB');
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Switch currency"
        title={currency === 'RUB' ? 'Switch to USD' : 'Переключить на ₽'}
      >
        <span className="text-xs font-bold">{currency === 'RUB' ? '$' : '₽'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
      aria-label="Switch currency"
    >
      <span>{currency === 'RUB' ? '₽ Рубли' : '$ Dollars'}</span>
      <span className="rounded bg-emerald-600/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
        {currency === 'RUB' ? '$' : '₽'}
      </span>
    </button>
  );
}
