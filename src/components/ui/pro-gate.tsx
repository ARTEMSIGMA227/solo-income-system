'use client';

import { useProfile } from '@/hooks/use-profile';
import { useT } from '@/lib/i18n';
import Link from 'next/link';
import { Crown, Lock } from 'lucide-react';

interface ProGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  label?: string;
}

export function ProGate({ children, fallback, label }: ProGateProps) {
  const { data: profile } = useProfile();
  const { locale } = useT();

  const isPro = profile?.is_pro === true;

  if (isPro) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="opacity-20 pointer-events-none blur-[2px] select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
        <div className="bg-gray-900/95 border border-purple-500/30 rounded-xl p-6 text-center max-w-sm mx-4">
          <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">
            {label || (locale === 'ru' ? 'PRO функция' : 'PRO Feature')}
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            {locale === 'ru'
              ? 'Эта функция доступна с подпиской PRO'
              : 'This feature requires a PRO subscription'}
          </p>
          <Link
            href="/subscription"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all"
          >
            <Crown className="w-4 h-4" />
            {locale === 'ru' ? 'Узнать о PRO' : 'Get PRO'}
          </Link>
        </div>
      </div>
    </div>
  );
}

interface ProLimitBadgeProps {
  current: number;
  max: number;
  isPro: boolean;
}

export function ProLimitBadge({ current, max, isPro }: ProLimitBadgeProps) {
  const { locale } = useT();

  if (isPro) return null;

  const isAtLimit = current >= max;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      isAtLimit
        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
        : 'bg-gray-800 text-gray-400 border border-gray-700'
    }`}>
      {isAtLimit && <Lock className="w-3 h-3" />}
      {current}/{max}
      {isAtLimit && (
        <Link href="/subscription" className="ml-1 text-purple-400 hover:text-purple-300">
          PRO
        </Link>
      )}
    </div>
  );
}