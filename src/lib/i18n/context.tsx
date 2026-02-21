'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { en } from './en';
import { ru } from './ru';
import type { Locale, Translations } from './types';

const STORAGE_KEY = 'solo-income-locale';
const DEFAULT_LOCALE: Locale = 'en';

const TRANSLATIONS: Record<Locale, Translations> = { en, ru };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: en,
});

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'ru') return stored;
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [hydrated, setHydrated] = useState(false);

  // Read from localStorage on mount (instant, no flicker)
  useEffect(() => {
    const stored = getStoredLocale();
    setLocaleState(stored);
    setHydrated(true);
  }, []);

  // Sync FROM Supabase on mount (overrides localStorage if DB has a value)
  useEffect(() => {
    if (!hydrated) return;

    async function syncFromDB() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('locale')
        .eq('id', user.id)
        .single();

      if (profile?.locale && (profile.locale === 'en' || profile.locale === 'ru')) {
        const dbLocale = profile.locale as Locale;
        if (dbLocale !== locale) {
          setLocaleState(dbLocale);
          localStorage.setItem(STORAGE_KEY, dbLocale);
        }
      }
    }

    syncFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Set locale: update state + localStorage + Supabase
  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);

    // Async sync to Supabase (non-blocking)
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ locale: newLocale, updated_at: new Date().toISOString() })
          .eq('id', user.id);
      }
    } catch {
      // Non-critical, localStorage already saved
    }
  }, []);

  const t = TRANSLATIONS[locale];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

/** Hook to access translations and locale */
export function useT() {
  return useContext(I18nContext);
}

/** Hook for just the translations object */
export function useTranslations() {
  return useContext(I18nContext).t;
}
