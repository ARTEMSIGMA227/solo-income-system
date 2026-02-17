import { AdvisorCard } from "@/components/advisor/AdvisorCard";

export const metadata = {
  title: "AI-Советник | Solo Income System",
};

export default function AdvisorPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🤖</span>
        <div>
          <h1 className="text-2xl font-bold text-white">AI-Советник</h1>
          <p className="text-sm text-gray-400">
            Персональные рекомендации на основе твоих данных
          </p>
        </div>
      </div>

      <AdvisorCard />

      <div className="rounded-xl border border-gray-700/50 bg-gray-900/30 p-4">
        <h2 className="mb-2 text-sm font-bold text-white">
          Как работает советник?
        </h2>
        <ul className="space-y-1 text-xs text-gray-400">
          <li>📊 Анализирует твою streak, квесты, боссов и прогресс</li>
          <li>🎯 Определяет приоритетную область для роста</li>
          <li>💡 Даёт конкретные советы для текущей ситуации</li>
          <li>🔄 Обновляется при каждом посещении</li>
        </ul>
      </div>
    </div>
  );
}