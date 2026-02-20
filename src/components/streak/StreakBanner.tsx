'use client';

import { useEffect, useRef } from 'react';

interface StreakBannerProps {
  streak: number;
  bestStreak: number;
}

export default function StreakBanner({ streak, bestStreak }: StreakBannerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (streak < 2) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      life: number;
      maxLife: number;
      color: string;
    }

    const particles: Particle[] = [];
    const colors = ['#f97316', '#fb923c', '#fbbf24', '#ef4444', '#f59e0b'];

    function spawnParticle() {
      const w = rect.width;
      const h = rect.height;
      particles.push({
        x: Math.random() * w,
        y: h + 5,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 2 + 1),
        size: Math.random() * 3 + 1,
        life: 0,
        maxLife: 40 + Math.random() * 30,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Spawn rate based on streak
      const spawnRate = Math.min(streak, 10);
      for (let i = 0; i < spawnRate; i++) {
        if (Math.random() < 0.3) spawnParticle();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [streak]);

  if (streak < 1) return null;

  const isHot = streak >= 3;
  const isOnFire = streak >= 7;
  const isLegendary = streak >= 14;

  let borderColor = '#f59e0b30';
  let bgColor = '#f59e0b10';
  let textColor = '#f59e0b';
  let emoji = '🔥';

  if (isLegendary) {
    borderColor = '#ef444460';
    bgColor = '#ef444420';
    textColor = '#ef4444';
    emoji = '💀🔥';
  } else if (isOnFire) {
    borderColor = '#f9731650';
    bgColor = '#f9731615';
    textColor = '#f97316';
    emoji = '🔥🔥';
  } else if (isHot) {
    borderColor = '#f59e0b40';
    bgColor = '#f59e0b12';
    textColor = '#f59e0b';
    emoji = '🔥';
  }

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '12px 16px',
      }}
    >
      {/* Fire particles canvas */}
      {streak >= 2 && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '20px',
              animation: isHot ? 'streakFlame 0.5s ease-in-out infinite alternate' : undefined,
            }}
          >
            {emoji}
          </span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: textColor }}>
              Серия: {streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}
            </div>
            {bestStreak > streak && (
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Рекорд: {bestStreak}
              </div>
            )}
          </div>
        </div>

        {streak >= 5 && (
          <div
            style={{
              fontSize: '11px',
              color: textColor,
              backgroundColor: `${textColor}15`,
              padding: '4px 10px',
              borderRadius: '8px',
              fontWeight: 600,
              border: `1px solid ${textColor}30`,
            }}
          >
            ×{Math.min(1 + streak * 0.1, 3).toFixed(1)} XP
          </div>
        )}
      </div>

      <style>{`
        @keyframes streakFlame {
          from { transform: scale(1) rotate(-3deg); }
          to { transform: scale(1.15) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}