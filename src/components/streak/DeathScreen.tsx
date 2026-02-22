'use client';

import { useT } from '@/lib/i18n';

interface DeathScreenProps {
  type: 'miss' | 'level_down';
  xpLost: number;
  consecutiveMisses: number;
  onAccept: () => void;
}

export default function DeathScreen({
  type,
  xpLost,
  consecutiveMisses,
  onAccept,
}: DeathScreenProps) {
  const { t } = useT();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: type === 'level_down' ? '#0a0000' : '#0a0005',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.5s ease',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        {/* Icon */}
        <div
          style={{
            fontSize: type === 'level_down' ? '80px' : '64px',
            marginBottom: '16px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          {type === 'level_down' ? '☠️' : '💀'}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: type === 'level_down' ? '28px' : '24px',
            fontWeight: 800,
            color: '#ef4444',
            marginBottom: '12px',
            textShadow: '0 0 20px #ef4444',
            textTransform: 'uppercase',
            letterSpacing: '3px',
          }}
        >
          {type === 'level_down' ? t.death.levelDownTitle : t.death.missTitle}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '16px',
            color: '#f87171',
            marginBottom: '24px',
            lineHeight: 1.6,
            whiteSpace: 'pre-line',
          }}
        >
          {type === 'level_down' ? (
            <>
              {t.death.levelDownDescription(consecutiveMisses)}
              <br />
              <span style={{ color: '#ef4444', fontWeight: 700 }}>
                {t.death.unacceptable}
              </span>
            </>
          ) : (
            t.death.missDescription(consecutiveMisses)
          )}
        </div>

        {/* Penalty */}
        <div
          style={{
            backgroundColor: '#1a0000',
            border: '1px solid #ef444440',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
            {t.death.penalty}
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ef4444' }}>
            -{xpLost} XP
          </div>
          {type === 'level_down' && (
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#ef4444',
                marginTop: '8px',
              }}
            >
              {t.death.levelLost}
            </div>
          )}
        </div>

        {/* Warning */}
        {consecutiveMisses >= 2 && type !== 'level_down' && (
          <div
            style={{
              backgroundColor: '#1a1a00',
              border: '1px solid #eab30830',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px',
              fontSize: '13px',
              color: '#eab308',
            }}
          >
            {t.death.missWarning(3 - consecutiveMisses)}
          </div>
        )}

        {/* Motivation */}
        <div
          style={{
            fontSize: '13px',
            color: '#475569',
            marginBottom: '24px',
            fontStyle: 'italic',
          }}
        >
          {type === 'level_down' ? t.death.quoteLevelDown : t.death.quoteMiss}
        </div>

        {/* Button */}
        <button
          onClick={onAccept}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: 700,
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          {type === 'level_down' ? t.death.acceptPunishment : t.death.willFix}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}