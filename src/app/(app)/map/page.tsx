'use client';

import { useMap } from '@/hooks/use-map';
import { MapView } from '@/components/map/MapView';
import { calculateTerritoryXPForLevel } from '@/lib/map-data';

export default function MapPage() {
  const mapHook = useMap();
  const {
    isLoading,
    error,
    capturedCount,
    totalCount,
    activeTerritory,
    activeProgress,
  } = mapHook;

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '2px solid rgba(139, 105, 20, 0.4)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(180, 160, 120, 0.7)',
              fontFamily: 'serif',
            }}
          >
            Разворачиваем карту...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#ef4444' }}>
            Ошибка загрузки карты
          </p>
          <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  const progressPercent =
    totalCount > 0 ? Math.round((capturedCount / totalCount) * 100) : 0;

  const activeXPPercent =
    activeProgress && activeProgress.required_xp > 0
      ? Math.min(
          Math.round(
            (activeProgress.current_xp /
              calculateTerritoryXPForLevel(
                activeProgress.required_xp,
                activeProgress.level
              )) *
              100
          ),
          100
        )
      : 0;

  return (
    <div style={{ paddingBottom: '96px' }}>
      {/* Header */}
      <div style={{ marginBottom: '14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '3px',
          }}
        >
          <span style={{ fontSize: '20px' }}>🗺️</span>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#fff',
              margin: 0,
              fontFamily: 'serif',
              letterSpacing: '0.02em',
            }}
          >
            Карта Территорий
          </h1>
        </div>
        <p
          style={{
            fontSize: '12px',
            color: 'rgba(180, 160, 120, 0.6)',
            margin: 0,
            fontFamily: 'serif',
          }}
        >
          Захватывай территории, получай бонусы и открывай новые земли
        </p>
      </div>

      {/* Stats bar — parchment cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        {[
          {
            icon: '👑',
            value: capturedCount,
            label: 'Захвачено',
            accent: '#8b6914',
          },
          {
            icon: '🔒',
            value: totalCount - capturedCount,
            label: 'Осталось',
            accent: '#7a6c58',
          },
          {
            icon: '⚔️',
            value: `${progressPercent}%`,
            label: 'Прогресс',
            accent: '#5a8a30',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'linear-gradient(145deg, rgba(200,180,140,0.1), rgba(160,140,100,0.05))',
              border: '1px solid rgba(140, 120, 80, 0.15)',
              borderRadius: '8px',
              padding: '10px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: stat.accent,
                fontFamily: 'serif',
              }}
            >
              {stat.icon} {stat.value}
            </div>
            <p
              style={{
                fontSize: '9px',
                color: 'rgba(180, 160, 120, 0.5)',
                margin: '2px 0 0',
                fontFamily: 'serif',
                letterSpacing: '0.05em',
              }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Active territory banner — scroll style */}
      {activeTerritory && activeProgress && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(139,105,20,0.1), rgba(120,90,50,0.06))',
            border: '1px solid rgba(139, 105, 20, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span style={{ fontSize: '20px' }}>
                {activeTerritory.icon}
              </span>
              <div>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#fff',
                    margin: 0,
                    fontFamily: 'serif',
                  }}
                >
                  {activeTerritory.name}
                </p>
                <p
                  style={{
                    fontSize: '10px',
                    color: 'rgba(200, 170, 100, 0.8)',
                    margin: '2px 0 0',
                    fontFamily: 'monospace',
                  }}
                >
                  Lv.{activeProgress.level} · {activeProgress.current_xp}/
                  {calculateTerritoryXPForLevel(
                    activeProgress.required_xp,
                    activeProgress.level
                  )}{' '}
                  XP
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                color: 'rgba(200, 170, 100, 0.8)',
                fontWeight: 600,
                fontFamily: 'serif',
              }}
            >
              ⚔️ Активна
            </span>
          </div>
          <div
            style={{
              marginTop: '8px',
              height: '5px',
              backgroundColor: 'rgba(80, 55, 30, 0.15)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${activeXPPercent}%`,
                background: 'linear-gradient(90deg, #8b6914, #b08a20, #c8a030)',
                borderRadius: '3px',
                transition: 'width 0.6s ease',
                boxShadow: '0 0 6px rgba(139,105,20,0.3)',
              }}
            />
          </div>
        </div>
      )}

      {/* Map */}
      <MapView mapHook={mapHook} />

      {/* Tip */}
      <p
        style={{
          textAlign: 'center',
          fontSize: '10px',
          color: 'rgba(140, 120, 80, 0.4)',
          marginTop: '10px',
          fontFamily: 'serif',
          fontStyle: 'italic',
        }}
      >
        ✦ 20% XP от действий идёт в прогресс активной территории ✦
      </p>

      {/* CSS animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
