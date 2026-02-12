'use client';

interface StreakBannerProps {
  streak: number;
  bestStreak: number;
}

function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.8;
  if (streak >= 7) return 1.5;
  if (streak >= 3) return 1.2;
  return 1.0;
}

function getStreakColor(streak: number): string {
  if (streak >= 30) return '#f59e0b';
  if (streak >= 14) return '#7c3aed';
  if (streak >= 7) return '#3b82f6';
  if (streak >= 3) return '#22c55e';
  return '#475569';
}

function getNextMilestone(streak: number): { target: number; multiplier: number } {
  if (streak < 3) return { target: 3, multiplier: 1.2 };
  if (streak < 7) return { target: 7, multiplier: 1.5 };
  if (streak < 14) return { target: 14, multiplier: 1.8 };
  if (streak < 30) return { target: 30, multiplier: 2.0 };
  return { target: streak, multiplier: 2.0 };
}

export default function StreakBanner({ streak, bestStreak }: StreakBannerProps) {
  const multiplier = getStreakMultiplier(streak);
  const color = getStreakColor(streak);
  const next = getNextMilestone(streak);
  const progressToNext = streak < next.target
    ? Math.round((streak / next.target) * 100)
    : 100;

  if (streak === 0) {
    return (
      <div style={{
        backgroundColor: '#1a0f0f', border: '1px solid #ef444430',
        borderRadius: '12px', padding: '12px 16px', marginBottom: '12px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <span style={{ fontSize: '24px' }}>💀</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>
            Серия: 0 дней
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Выполни план сегодня чтобы начать серию!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#12121a', border: `1px solid ${color}30`,
      borderRadius: '12px', padding: '12px 16px', marginBottom: '12px',
      boxShadow: streak >= 7 ? `0 0 20px ${color}15` : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>
            {streak >= 30 ? '👑' : streak >= 14 ? '⚡' : streak >= 7 ? '💎' : streak >= 3 ? '🔥' : '✨'}
          </span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color }}>
              {streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'} подряд!
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Рекорд: {bestStreak} дн.
            </div>
          </div>
        </div>
        <div style={{
          padding: '6px 12px', borderRadius: '10px', fontSize: '14px', fontWeight: 800,
          backgroundColor: color + '20', color,
          border: `1px solid ${color}40`,
        }}>
          x{multiplier}
        </div>
      </div>

      {/* Прогресс до следующего милестоуна */}
      {streak < 30 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569', marginBottom: '4px' }}>
            <span>До x{next.multiplier}</span>
            <span>{streak}/{next.target} дней</span>
          </div>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#16161f', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressToNext}%`, height: '100%', borderRadius: '2px',
              backgroundColor: color, transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

export { getStreakMultiplier };