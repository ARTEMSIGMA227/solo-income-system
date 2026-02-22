'use client';

import { useEffect, useCallback } from 'react';
import { useT } from '@/lib/i18n';

interface LevelUpPopupProps {
  level: number;
  title: string;
  onClose: () => void;
}

export default function LevelUpPopup({ level, title, onClose }: LevelUpPopupProps) {
  const { t } = useT();

  const fireConfetti = useCallback(async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;

      void confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#7c3aed', '#3b82f6', '#a78bfa', '#fbbf24', '#22c55e'],
        startVelocity: 30,
        gravity: 0.8,
        ticks: 120,
        zIndex: 100001,
      });

      setTimeout(() => {
        void confetti({
          particleCount: 40,
          angle: 60,
          spread: 50,
          origin: { x: 0, y: 0.6 },
          colors: ['#7c3aed', '#a78bfa', '#fbbf24'],
          zIndex: 100001,
        });
        void confetti({
          particleCount: 40,
          angle: 120,
          spread: 50,
          origin: { x: 1, y: 0.6 },
          colors: ['#3b82f6', '#a78bfa', '#22c55e'],
          zIndex: 100001,
        });
      }, 250);
    } catch {
      // canvas-confetti not available
    }
  }, []);

  useEffect(() => {
    void fireConfetti();

    const timeout = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timeout);
  }, [fireConfetti, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        animation: 'levelUpFadeIn 0.3s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          textAlign: 'center',
          animation: 'levelUpScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          cursor: 'pointer',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        {/* Glow ring */}
        <div
          style={{
            width: '120px',
            height: '120px',
            margin: '0 auto 24px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #7c3aed40 0%, transparent 70%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'levelUpRingPulse 2s ease-in-out infinite',
            border: '2px solid #7c3aed60',
          }}
        >
          <span style={{ fontSize: '48px', filter: 'drop-shadow(0 0 16px #7c3aed)' }}>
            ⚔️
          </span>
        </div>

        <div
          style={{
            fontSize: '14px',
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '4px',
            marginBottom: '8px',
            fontWeight: 600,
          }}
        >
          {t.levelUp.title}
        </div>

        <div
          style={{
            fontSize: '48px',
            fontWeight: 900,
            color: '#a78bfa',
            textShadow: '0 0 30px #7c3aed80, 0 0 60px #7c3aed40',
            lineHeight: 1.2,
          }}
        >
          LV. {level}
        </div>

        <div
          style={{
            fontSize: '18px',
            color: '#e2e8f0',
            marginTop: '12px',
            fontWeight: 600,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: '12px',
            color: '#64748b',
            marginTop: '24px',
          }}
        >
          {t.levelUp.tapToContinue}
        </div>
      </div>

      <style>{`
        @keyframes levelUpFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes levelUpScale {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes levelUpRingPulse {
          0%, 100% { box-shadow: 0 0 20px #7c3aed30; }
          50% { box-shadow: 0 0 40px #7c3aed60, 0 0 60px #7c3aed20; }
        }
      `}</style>
    </div>
  );
}