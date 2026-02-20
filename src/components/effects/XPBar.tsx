'use client';

import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '@/lib/utils';

interface XPBarProps {
  level: number;
  currentXP: number;
  xpToNext: number;
  progressPercent: number;
  pulsing?: boolean;
}

export default function XPBar({ level, currentXP, xpToNext, progressPercent, pulsing = false }: XPBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [showPulse, setShowPulse] = useState(false);
  const prevPercentRef = useRef(0);

  useEffect(() => {
    // Animate the bar width
    const timer = requestAnimationFrame(() => {
      setAnimatedPercent(progressPercent);
    });
    return () => cancelAnimationFrame(timer);
  }, [progressPercent]);

  useEffect(() => {
    if (pulsing || progressPercent > prevPercentRef.current) {
      setShowPulse(true);
      const timeout = setTimeout(() => setShowPulse(false), 1500);
      prevPercentRef.current = progressPercent;
      return () => clearTimeout(timeout);
    }
    prevPercentRef.current = progressPercent;
  }, [pulsing, progressPercent]);

  return (
    <div
      style={{
        backgroundColor: '#12121a',
        border: '1px solid #1e1e2e',
        borderRadius: '12px',
        padding: '16px',
        marginTop: '12px',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#a78bfa',
            transition: 'text-shadow 0.3s ease',
            textShadow: showPulse ? '0 0 20px #a78bfa80, 0 0 40px #7c3aed40' : 'none',
          }}
        >
          LV. {level}
        </span>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          {formatNumber(currentXP)} / {formatNumber(xpToNext)} XP
        </span>
      </div>

      <div
        ref={barRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '12px',
          backgroundColor: '#16161f',
          borderRadius: '6px',
          overflow: 'hidden',
          border: '1px solid #1e1e2e',
        }}
      >
        {/* Main progress bar */}
        <div
          style={{
            width: `${animatedPercent}%`,
            height: '100%',
            borderRadius: '6px',
            background: 'linear-gradient(90deg, #7c3aed, #3b82f6)',
            transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
          }}
        >
          {/* Shimmer effect on pulse */}
          {showPulse && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'xpShimmer 0.8s ease-in-out',
                borderRadius: '6px',
              }}
            />
          )}
        </div>

        {/* Glow pulse on XP gain */}
        {showPulse && (
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              left: 0,
              width: `${animatedPercent}%`,
              height: 'calc(100% + 4px)',
              borderRadius: '6px',
              boxShadow: '0 0 12px #7c3aed80, 0 0 24px #3b82f640',
              animation: 'xpPulseGlow 1.5s ease-out',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes xpShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes xpPulseGlow {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}