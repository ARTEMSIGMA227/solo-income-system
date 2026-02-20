'use client';

import { TERRITORIES } from '@/lib/map-data';
import { TerritoryNode } from './TerritoryNode';
import type { useMap } from '@/hooks/use-map';

interface MapViewProps {
  mapHook: ReturnType<typeof useMap>;
}

export function MapView({ mapHook }: MapViewProps) {
  const { getStatus, getProgress, activeTerritory, activateTerritory } = mapHook;

  // Build unique connections
  const addedPairs = new Set<string>();
  const connections: Array<{
    from: string;
    to: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }> = [];

  TERRITORIES.forEach((t) => {
    t.connections.forEach((conn) => {
      const pairKey = [t.id, conn.targetId].sort().join('--');
      if (addedPairs.has(pairKey)) return;
      addedPairs.add(pairKey);

      const target = TERRITORIES.find((tt) => tt.id === conn.targetId);
      if (!target) return;

      connections.push({
        from: t.id,
        to: conn.targetId,
        x1: t.position.x,
        y1: t.position.y,
        x2: target.position.x,
        y2: target.position.y,
      });
    });
  });

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '120%', // aspect ratio ~5:6
        backgroundColor: '#0a0a0f',
        borderRadius: '16px',
        border: '1px solid #1e1e2e',
        overflow: 'hidden',
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(99,102,241,0.2), transparent 70%),
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }}
      />

      {/* Content container (absolute fill) */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* SVG connection lines */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {connections.map((conn) => {
            const fromStatus = getStatus(conn.from);
            const toStatus = getStatus(conn.to);
            const isUnlocked = fromStatus !== 'locked' && toStatus !== 'locked';

            return (
              <line
                key={`${conn.from}-${conn.to}`}
                x1={`${conn.x1}%`}
                y1={`${conn.y1}%`}
                x2={`${conn.x2}%`}
                y2={`${conn.y2}%`}
                stroke={
                  isUnlocked
                    ? 'rgba(34, 197, 94, 0.35)'
                    : 'rgba(113, 113, 122, 0.15)'
                }
                strokeWidth={isUnlocked ? '2' : '1'}
                strokeDasharray={isUnlocked ? 'none' : '6 4'}
                style={{ transition: 'stroke 0.5s, stroke-width 0.5s' }}
              />
            );
          })}
        </svg>

        {/* Territory nodes */}
        {TERRITORIES.map((territory) => {
          const status = getStatus(territory.id);
          const progress = getProgress(territory.id);
          const isActive = activeTerritory?.id === territory.id;

          return (
            <TerritoryNode
              key={territory.id}
              territory={territory}
              status={status}
              progress={progress}
              isActive={isActive}
              onActivate={(id) => activateTerritory.mutate(id)}
              isActivating={activateTerritory.isPending}
            />
          );
        })}

        {/* Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            backgroundColor: '#18181bdd',
            backdropFilter: 'blur(4px)',
            borderRadius: '8px',
            padding: '6px 8px',
            border: '1px solid #27272a50',
            zIndex: 20,
          }}
        >
          {[
            { color: '#52525b', label: 'Закрыто' },
            { color: '#a1a1aa', label: 'Туман' },
            { color: '#22c55e', label: 'Доступно' },
            { color: '#f59e0b', label: 'В бою' },
            { color: '#facc15', label: 'Захвачено' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: item.color,
                }}
              />
              <span style={{ fontSize: '9px', color: '#a1a1aa' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Active territory indicator */}
        {activeTerritory && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: '#22d3ee15',
              border: '1px solid #22d3ee30',
              borderRadius: '8px',
              padding: '4px 10px',
              backdropFilter: 'blur(4px)',
              zIndex: 20,
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: '#22d3ee',
                fontWeight: 500,
              }}
            >
              ⚔️ {activeTerritory.icon} {activeTerritory.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}