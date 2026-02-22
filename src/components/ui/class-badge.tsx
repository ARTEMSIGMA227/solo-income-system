'use client';

import { useUserClass } from '@/hooks/use-user-class';
import { useT } from '@/lib/i18n';
import Link from 'next/link';

const CLASS_DISPLAY: Record<string, { emoji: string; color: string; bgColor: string; borderColor: string }> = {
  striker: { emoji: '⚔️', color: 'text-red-400', bgColor: 'bg-red-600/20', borderColor: 'border-red-500/30' },
  healer: { emoji: '💚', color: 'text-emerald-400', bgColor: 'bg-emerald-600/20', borderColor: 'border-emerald-500/30' },
  mage: { emoji: '🔮', color: 'text-blue-400', bgColor: 'bg-blue-600/20', borderColor: 'border-blue-500/30' },
  assassin: { emoji: '🗡️', color: 'text-yellow-400', bgColor: 'bg-yellow-600/20', borderColor: 'border-yellow-500/30' },
  tank: { emoji: '🛡️', color: 'text-sky-400', bgColor: 'bg-sky-600/20', borderColor: 'border-sky-500/30' },
};

interface ClassBadgeProps {
  compact?: boolean;
}

export function ClassBadge({ compact = false }: ClassBadgeProps) {
  const { t } = useT();
  const { data: userClass, isLoading } = useUserClass();

  if (isLoading) {
    return <div className="h-5 w-16 animate-pulse rounded bg-white/5" />;
  }

  if (!userClass) {
    return (
      <Link
        href="/class-select"
        className="inline-flex items-center gap-1 rounded-md bg-violet-600/20 px-2 py-0.5 text-[10px] font-medium text-violet-400 transition-colors hover:bg-violet-600/30"
      >
        {t.classBadge.selectClass}
      </Link>
    );
  }

  const info = CLASS_DISPLAY[userClass.class_name] || CLASS_DISPLAY.striker;
  const title = t.classBadge.classes[userClass.class_name] ?? userClass.class_name;

  if (compact) {
    return (
      <span className={`text-xs font-medium ${info.color}`}>
        {info.emoji} {title}
      </span>
    );
  }

  return (
    <Link
      href="/class-select"
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors hover:brightness-125 ${info.bgColor} ${info.borderColor} ${info.color}`}
    >
      <span>{info.emoji}</span>
      <span>{title}</span>
    </Link>
  );
}