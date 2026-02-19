"use client";

import { useUserClass } from "@/hooks/use-user-class";
import Link from "next/link";

export function ClassSelectBanner() {
  const { data: userClass, isLoading } = useUserClass();

  if (isLoading || userClass) return null;

  return (
    <Link
      href="/class-select"
      className="group flex items-center gap-4 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-900/40 to-purple-900/40 p-4 transition-all hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600/30 text-2xl">
        ⚡
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-white">Выбери свой класс охотника</h3>
        <p className="text-xs text-gray-400">
          Striker, Healer, Mage, Assassin или Tank — каждый даёт уникальный бонус
        </p>
      </div>
      <div className="shrink-0 text-violet-400 transition-transform group-hover:translate-x-1">
        →
      </div>
    </Link>
  );
}