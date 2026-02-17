'use client';

import { useRouter } from 'next/navigation';
import type { Advice } from '@/lib/advisor';

const priorityStyles: Record<Advice['priority'], { bg: string; border: string; accent: string }> = {
  critical: { bg: '#1a0f0f', border: '#ef444440', accent: '#ef4444' },
  warning: { bg: '#1a1a0f', border: '#f59e0b40', accent: '#f59e0b' },
  positive: { bg: '#0f1a12', border: '#22c55e40', accent: '#22c55e' },
  info: { bg: '#0f1219', border: '#3b82f640', accent: '#3b82f6' },
};

interface AdvisorCardProps {
  greeting: string;
  advice: Advice[];
  onQuickAction?: () => void;
}

export default function AdvisorCard({ greeting, advice, onQuickAction }: AdvisorCardProps) {
  const router = useRouter();

  if (advice.length === 0) return null;

  return (
    <div style={{
      backgroundColor: '#12121a',
      border: '1px solid #1e1e2e',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '16px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '12px',
      }}>
        <span style={{ fontSize: '20px' }}>🤖</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#a78bfa' }}>
          AI-советник
        </span>
      </div>

      <div style={{
        fontSize: '13px', color: '#94a3b8', marginBottom: '12px',
        fontStyle: 'italic',
      }}>
        {greeting}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {advice.map((item, i) => {
          const style = priorityStyles[item.priority];
          return (
            <div
              key={i}
              style={{
                backgroundColor: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: '10px',
                padding: '12px',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>
                  {item.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px', fontWeight: 600,
                    color: style.accent, marginBottom: '3px',
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    fontSize: '12px', color: '#94a3b8',
                    lineHeight: '1.4',
                  }}>
                    {item.message}
                  </div>
                  {item.action && (
                    <button
                      onClick={() => {
                        if (item.actionRoute) {
                          router.push(item.actionRoute);
                        } else if (onQuickAction) {
                          onQuickAction();
                        }
                      }}
                      style={{
                        marginTop: '8px',
                        padding: '5px 12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: style.accent + '20',
                        color: style.accent,
                        border: `1px solid ${style.accent}40`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      {item.action} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
