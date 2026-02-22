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

const dictionaries: Record<Locale, TranslationDictionary> = { ru, en };

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'ru',
  setLocale: () => {},
  t: ru,
});

const STORAGE_KEY = 'sis-locale';

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ru';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ru') return stored;
  } catch {
    // SSR or localStorage unavailable
  }
  // Detect browser language
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language?.slice(0, 2);
    if (browserLang === 'en') return 'en';
  }
  return 'ru';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ru');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getInitialLocale());
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // ignore
    }
    // Update <html lang="">
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
    }
  }, []);

  const t = dictionaries[locale];

  // Prevent hydration mismatch: render with default locale until mounted
  const value: LanguageContextValue = {
    locale: mounted ? locale : 'ru',
    setLocale,
    t: mounted ? t : ru,
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