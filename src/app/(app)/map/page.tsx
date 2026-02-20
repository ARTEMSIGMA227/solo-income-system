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
              width: '40px',
              height: '40px',
              border: '2px solid #6366f1',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <p style={{ fontSize: '14px', color: '#a1a1aa' }}>
            Загрузка карты...
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
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
          }}
        >
          <span style={{ fontSize: '20px' }}>🗺️</span>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#fff',
              margin: 0,
            }}
          >
            Карта Территорий
          </h1>
        </div>
        <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>
          Захватывай территории, получай бонусы и открывай новые земли
        </p>
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            backgroundColor: '#12121a',
            border: '1px solid #1e1e2e',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#facc15',
            }}
          >
            👑 {capturedCount}
          </div>
          <p
            style={{
              fontSize: '10px',
              color: '#71717a',
              margin: '2px 0 0',
            }}
          >
            Захвачено
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#12121a',
            border: '1px solid #1e1e2e',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#a1a1aa',
            }}
          >
            🔒 {totalCount - capturedCount}
          </div>
          <p
            style={{
              fontSize: '10px',
              color: '#71717a',
              margin: '2px 0 0',
            }}
          >
            Осталось
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#12121a',
            border: '1px solid #1e1e2e',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#818cf8',
            }}
          >
            ⚔️ {progressPercent}%
          </div>
          <p
            style={{
              fontSize: '10px',
              color: '#71717a',
              margin: '2px 0 0',
            }}
          >
            Прогресс
          </p>
        </div>
      </div>

      {/* Active territory info */}
      {activeTerritory && activeProgress && (
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(99,102,241,0.08))',
            border: '1px solid rgba(34,211,238,0.2)',
            borderRadius: '12px',
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
                  }}
                >
                  {activeTerritory.name}
                </p>
                <p
                  style={{
                    fontSize: '10px',
                    color: '#22d3ee',
                    margin: '2px 0 0',
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
                fontSize: '12px',
                color: '#22d3ee',
                fontWeight: 500,
              }}
            >
              ⚔️ Активна
            </span>
          </div>
          <div
            style={{
              marginTop: '8px',
              height: '5px',
              backgroundColor: '#27272a',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${activeXPPercent}%`,
                background: 'linear-gradient(90deg, #22d3ee, #6366f1)',
                borderRadius: '3px',
                transition: 'width 0.6s ease',
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
          color: '#3f3f46',
          marginTop: '12px',
        }}
      >
        💡 20% XP от действий идёт в прогресс активной территории
      </p>

      {/* CSS animations */}
      <style>{`
        @keyframes territory-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes territory-modal-in {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}