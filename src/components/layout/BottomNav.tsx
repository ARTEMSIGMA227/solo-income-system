'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const MAIN_NAV = [
  { path: '/dashboard', label: '\u041e\u0445\u043e\u0442\u043d\u0438\u043a', icon: '\u2694\ufe0f' },
  { path: '/quests', label: '\u041a\u0432\u0435\u0441\u0442\u044b', icon: '\ud83d\udccb' },
  { path: '/shop', label: '\u041c\u0430\u0433\u0430\u0437\u0438\u043d', icon: '\ud83c\udfea' },
  { path: '/leaderboard', label: '\u0422\u043e\u043f', icon: '\ud83c\udfc6' },
  { path: '/more', label: '\u0415\u0449\u0451', icon: '\u22ef' },
];

const MORE_ITEMS = [
  { path: '/advisor', label: '\u0421\u043e\u0432\u0435\u0442\u043d\u0438\u043a', icon: '\ud83e\udd16' },
  { path: '/focus', label: '\u0424\u043e\u043a\u0443\u0441', icon: '\ud83c\udfaf' },
  { path: '/achievements', label: '\u0410\u0447\u0438\u0432\u043a\u0438', icon: '\ud83c\udfc6' },
  { path: '/bosses', label: '\u0411\u043e\u0441\u0441\u044b', icon: '\ud83d\udc80' },
  { path: '/analytics', label: '\u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430', icon: '\ud83d\udcc8' },
  { path: '/stats', label: '\u0421\u0442\u0430\u0442\u044b', icon: '\ud83d\udcca' },
  { path: '/settings', label: '\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438', icon: '\u2699\ufe0f' },
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