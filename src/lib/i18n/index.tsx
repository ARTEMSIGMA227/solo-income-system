'use client';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { ru } from './ru';
import { en } from './en';
import type { Locale, TranslationDictionary } from './types';

export type { Locale, TranslationDictionary };
export type Currency = 'RUB' | 'USD' | 'EUR';

const dictionaries: Record<Locale, TranslationDictionary> = { ru, en };

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationDictionary;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number) => string;
}

const defaultFormatCurrency = (amount: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'ru',
  setLocale: () => {},
  t: ru,
  currency: 'RUB',
  setCurrency: () => {},
  formatCurrency: defaultFormatCurrency,
});

const STORAGE_KEY = 'sis-locale';
const CURRENCY_KEY = 'sis-currency';

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ru';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ru') return stored;
  } catch {
    // SSR or localStorage unavailable
  }
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language?.slice(0, 2);
    if (browserLang === 'en') return 'en';
  }
  return 'ru';
}

function getInitialCurrency(): Currency {
  if (typeof window === 'undefined') return 'RUB';
  try {
    const stored = localStorage.getItem(CURRENCY_KEY);
    if (stored === 'RUB' || stored === 'USD' || stored === 'EUR') return stored;
  } catch {
    // SSR or localStorage unavailable
  }
  return 'RUB';
}

function buildFormatCurrency(locale: Locale, currency: Currency) {
  return (amount: number) =>
    new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
}

// Sync to database (fire and forget)
async function syncToDb(field: 'locale' | 'currency', value: string) {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        [field]: value,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
    }
  } catch {
    // ignore
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ru');
  const [currency, setCurrencyState] = useState<Currency>('RUB');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initLocale = getInitialLocale();
    const initCurrency = getInitialCurrency();
    setLocaleState(initLocale);
    setCurrencyState(initCurrency);
    setMounted(true);

    // Sync from DB on load (DB is source of truth if available)
    (async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('locale, currency')
            .eq('id', user.id)
            .single();
          if (profile) {
            if (profile.locale && (profile.locale === 'ru' || profile.locale === 'en')) {
              setLocaleState(profile.locale);
              localStorage.setItem(STORAGE_KEY, profile.locale);
            }
            if (profile.currency && ['RUB', 'USD', 'EUR'].includes(profile.currency)) {
              setCurrencyState(profile.currency as Currency);
              localStorage.setItem(CURRENCY_KEY, profile.currency);
            }
          }
        }
      } catch {
        // ignore - use localStorage values
      }
    })();
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
    }
    syncToDb('locale', newLocale);
  }, []);

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem(CURRENCY_KEY, newCurrency);
    } catch {
      // ignore
    }
    syncToDb('currency', newCurrency);
  }, []);

  const t = dictionaries[locale];
  const fmt = buildFormatCurrency(
    mounted ? locale : 'ru',
    mounted ? currency : 'RUB',
  );

  const value: LanguageContextValue = {
    locale: mounted ? locale : 'ru',
    setLocale,
    t: mounted ? t : ru,
    currency: mounted ? currency : 'RUB',
    setCurrency,
    formatCurrency: fmt,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  return useContext(LanguageContext);
}

export function useLocale(): [Locale, (l: Locale) => void] {
  const { locale, setLocale } = useContext(LanguageContext);
  return [locale, setLocale];
}