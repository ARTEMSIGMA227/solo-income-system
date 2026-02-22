// src/components/ui/language-toggle.tsx

'use client';

import { useT } from '@/lib/i18n';
import { Globe } from 'lucide-react';

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useT();

  const toggle = () => {
    setLocale(locale === 'ru' ? 'en' : 'ru');
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Switch language"
        title={locale === 'ru' ? 'Switch to English' : 'Переключить на русский'}
      >
        <span className="text-xs font-bold uppercase">{locale === 'ru' ? 'EN' : 'RU'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
      aria-label="Switch language"
    >
      <Globe className="h-4 w-4" />
      <span>{locale === 'ru' ? 'English' : 'Русский'}</span>
      <span className="rounded bg-violet-600/30 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-400">
        {locale === 'ru' ? 'EN' : 'RU'}
      </span>
    </button>
  );
}