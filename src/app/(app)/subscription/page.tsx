'use client';

import { useT } from '@/lib/i18n';
import { toast } from 'sonner';
import { Crown, Check, Zap } from 'lucide-react';

export default function SubscriptionPage() {
  const { locale } = useT();
  const ru = locale === 'ru';

  const freeFeatures = ru
    ? [
        'До 5 навыков',
        '4 типа целей',
        'Уровни и стрики',
        'Базовая статистика',
        'Квесты и боссы',
      ]
    : [
        'Up to 5 skills',
        '4 goal types',
        'Levels & streaks',
        'Basic statistics',
        'Quests & bosses',
      ];

  const proFeatures = ru
    ? [
        'Безлимитные навыки',
        'Все 6 типов целей',
        'Шаблоны навыков',
        'Группы навыков',
        'Расширенная аналитика',
        'Награды и лутбоксы',
        'Приоритетная поддержка',
      ]
    : [
        'Unlimited skills',
        'All 6 goal types',
        'Skill templates',
        'Skill groups',
        'Advanced analytics',
        'Rewards & lootboxes',
        'Priority support',
      ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Crown className="w-7 h-7 text-yellow-400" />
          {ru ? 'Подписка' : 'Subscription'}
        </h1>
        <p className="text-gray-400 mt-2">
          {ru ? 'Выберите план, который подходит вам' : 'Choose the plan that fits you'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-white">Free</h2>
            <div className="text-3xl font-bold text-white mt-2">
              $0
              <span className="text-sm text-gray-400 font-normal">
                /{ru ? 'мес' : 'mo'}
              </span>
            </div>
          </div>
          <ul className="space-y-3 mb-6">
            {freeFeatures.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-gray-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button className="w-full py-2.5 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium cursor-default">
            {ru ? 'Текущий план' : 'Current Plan'}
          </button>
        </div>

        {/* PRO */}
        <div className="bg-gray-800/50 border-2 border-yellow-500/30 rounded-xl p-6 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded-full">
            PRO
          </div>
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-yellow-400">PRO</h2>
            <div className="text-3xl font-bold text-white mt-2">
              $15
              <span className="text-sm text-gray-400 font-normal">
                /{ru ? 'мес' : 'mo'}
              </span>
            </div>
          </div>
          <ul className="space-y-3 mb-6">
            {proFeatures.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => toast(ru ? '🚧 Скоро!' : '🚧 Coming soon!')}
            className="w-full py-2.5 bg-yellow-500 text-black rounded-lg text-sm font-bold hover:bg-yellow-400 transition-colors"
          >
            {ru ? 'Перейти на PRO' : 'Upgrade to PRO'}
          </button>
        </div>
      </div>
    </div>
  );
}