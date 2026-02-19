'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const MAIN_NAV = [
  { path: '/dashboard', label: 'Охотник', icon: '⚔️' },
  { path: '/quests', label: 'Квесты', icon: '📋' },
  { path: '/shop', label: 'Магазин', icon: '🏪' },
  { path: '/guild', label: 'Гильдия', icon: '🛡️' },
  { path: '/more', label: 'Ещё', icon: '⋯' },
];

const MORE_ITEMS = [
  { path: '/leaderboard', label: 'Топ', icon: '🏆' },
  { path: '/advisor', label: 'Советник', icon: '🤖' },
  { path: '/focus', label: 'Фокус', icon: '🎯' },
  { path: '/achievements', label: 'Ачивки', icon: '🏆' },
  { path: '/bosses', label: 'Боссы', icon: '💀' },
  { path: '/analytics', label: 'Аналитика', icon: '📈' },
  { path: '/stats', label: 'Статы', icon: '📊' },
  { path: '/settings', label: 'Настройки', icon: '⚙️' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  function handleNav(path: string) {
    if (path === '/more') {
      setShowMore(!showMore);
    } else {
      setShowMore(false);
      router.push(path);
    }
  }

  const isMoreActive = MORE_ITEMS.some(item => pathname === item.path);

  return (
    <>
      {showMore && (
        <>
          <div
            onClick={() => setShowMore(false)}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 40,
            }}
          />
          <div style={{
            position: 'fixed',
            bottom: '70px',
            right: '16px',
            backgroundColor: '#12121a',
            border: '1px solid #1e1e2e',
            borderRadius: '12px',
            padding: '8px',
            zIndex: 51,
            minWidth: '180px',
          }}>
            {MORE_ITEMS.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: isActive ? '#7c3aed20' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: isActive ? '#a78bfa' : '#e2e8f0',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 400,
                    textAlign: 'left' as const,
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#12121a',
        borderTop: '1px solid #1e1e2e',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 0',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        zIndex: 50,
      }}>
        {MAIN_NAV.map((item) => {
          const isActive = item.path === '/more'
            ? isMoreActive || showMore
            : pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                gap: '2px',
                padding: '4px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{
                fontSize: '20px',
                filter: isActive ? 'none' : 'grayscale(0.5)',
                opacity: isActive ? 1 : 0.5,
              }}>
                {item.icon}
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#a78bfa' : '#475569',
              }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: '#7c3aed',
                  marginTop: '1px',
                }} />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}