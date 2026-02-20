'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface LevelUpPopupProps {
  level: number;
  title: string;
  onClose: () => void;
}

export default function LevelUpPopup({ level, title, onClose }: LevelUpPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);

    // Конфетти
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#7c3aed', '#a78bfa', '#3b82f6', '#f59e0b'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#7c3aed', '#a78bfa', '#3b82f6', '#f59e0b'],
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 400);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease',
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      <div style={{
        textAlign: 'center',
        transform: visible ? 'scale(1)' : 'scale(0.5)',
        transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Аура */}
        <div style={{
          width: '160px', height: '160px', margin: '0 auto 20px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #7c3aed30 0%, transparent 70%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'levelUpPulse 1.5s ease-in-out infinite',
        }}>
          <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '48px', fontWeight: 900, color: '#fff',
            boxShadow: '0 0 60px #7c3aed50',
            border: '3px solid #a78bfa',
          }}>
            {level}
          </div>
        </div>

        <div style={{
          fontSize: '14px', letterSpacing: '4px', color: '#a78bfa',
          textTransform: 'uppercase', marginBottom: '8px',
          animation: 'levelUpFadeIn 0.8s ease 0.3s both',
        }}>
          ⚡ LEVEL UP ⚡
        </div>

        <div style={{
          fontSize: '32px', fontWeight: 900, color: '#fff',
          marginBottom: '8px',
          animation: 'levelUpFadeIn 0.8s ease 0.5s both',
        }}>
          Уровень {level}
        </div>

        <div style={{
          fontSize: '16px', color: '#a78bfa',
          animation: 'levelUpFadeIn 0.8s ease 0.7s both',
        }}>
          {title}
        </div>

        <button onClick={() => { setVisible(false); setTimeout(onClose, 400); }} style={{
          marginTop: '24px', padding: '10px 32px',
          backgroundColor: '#7c3aed', color: '#fff',
          border: 'none', borderRadius: '12px',
          fontSize: '14px', fontWeight: 700, cursor: 'pointer',
          animation: 'levelUpFadeIn 0.8s ease 0.9s both',
        }}>
          Продолжить
        </button>
      </div>

      <style>{`
        @keyframes levelUpPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes levelUpFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}