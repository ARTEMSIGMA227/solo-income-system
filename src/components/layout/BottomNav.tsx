'use client';

import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Главная', icon: '⚔️' },
  { path: '/quests', label: 'Квесты', icon: '📋' },
  { path: '/bosses', label: 'Боссы', icon: '👹' },
  { path: '/analytics', label: 'Графики', icon: '📈' },
  { path: '/stats', label: 'Статы', icon: '📊' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
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
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              padding: '4px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{
              fontSize: '22px',
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
                marginTop: '2px',
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}