'use client';

import { useEffect, useRef } from 'react';
import { TERRITORIES } from '@/lib/map-data';
import { TerritoryNode } from './TerritoryNode';
import type { useMap } from '@/hooks/use-map';

interface MapViewProps {
  mapHook: ReturnType<typeof useMap>;
}

// Рисуем canvas-фон: горы, деревья, текстура пергамента
function drawMapBackground(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  // Пергаментный фон
  const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.4, W * 0.1, W * 0.5, H * 0.5, W * 0.9);
  bgGrad.addColorStop(0, '#1a1a12');
  bgGrad.addColorStop(0.5, '#141410');
  bgGrad.addColorStop(1, '#0d0d0a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Текстура шума пергамента
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const alpha = Math.random() * 0.06;
    ctx.fillStyle = `rgba(180, 160, 120, ${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Горная цепь (верх карты)
  ctx.beginPath();
  ctx.moveTo(0, H * 0.12);
  const peaks = [
    [0.05, 0.1], [0.12, 0.04], [0.18, 0.08], [0.25, 0.02], [0.32, 0.07],
    [0.38, 0.03], [0.45, 0.09], [0.5, 0.01], [0.55, 0.06], [0.62, 0.03],
    [0.68, 0.08], [0.75, 0.04], [0.82, 0.07], [0.88, 0.03], [0.95, 0.09], [1.0, 0.12],
  ];
  for (const [px, py] of peaks) {
    ctx.lineTo(W * px, H * py);
  }
  ctx.lineTo(W, H * 0.15);
  ctx.lineTo(W, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  const mtGrad = ctx.createLinearGradient(0, 0, 0, H * 0.15);
  mtGrad.addColorStop(0, 'rgba(60, 60, 50, 0.5)');
  mtGrad.addColorStop(1, 'rgba(30, 30, 20, 0.1)');
  ctx.fillStyle = mtGrad;
  ctx.fill();

  // Снежные вершины
  ctx.strokeStyle = 'rgba(200, 200, 180, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const [px, py] of peaks) {
    if (py < 0.05) {
      ctx.moveTo(W * px - 4, H * py + 3);
      ctx.lineTo(W * px, H * py);
      ctx.lineTo(W * px + 4, H * py + 3);
    }
  }
  ctx.stroke();

  // Леса (точки-деревья)
  const forestZones = [
    { cx: 0.1, cy: 0.5, r: 0.08, count: 30 },
    { cx: 0.9, cy: 0.55, r: 0.07, count: 25 },
    { cx: 0.4, cy: 0.7, r: 0.06, count: 20 },
    { cx: 0.7, cy: 0.3, r: 0.05, count: 18 },
    { cx: 0.2, cy: 0.25, r: 0.06, count: 22 },
    { cx: 0.8, cy: 0.75, r: 0.05, count: 16 },
  ];

  for (const zone of forestZones) {
    for (let t = 0; t < zone.count; t++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * zone.r;
      const tx = (zone.cx + Math.cos(angle) * dist) * W;
      const ty = (zone.cy + Math.sin(angle) * dist) * H;
      const size = 2 + Math.random() * 3;

      // Ствол
      ctx.fillStyle = 'rgba(80, 60, 30, 0.3)';
      ctx.fillRect(tx - 0.5, ty, 1, size * 0.6);

      // Крона — треугольник
      ctx.beginPath();
      ctx.moveTo(tx, ty - size);
      ctx.lineTo(tx - size * 0.7, ty);
      ctx.lineTo(tx + size * 0.7, ty);
      ctx.closePath();
      ctx.fillStyle = `rgba(40, ${70 + Math.floor(Math.random() * 30)}, 30, ${0.2 + Math.random() * 0.15})`;
      ctx.fill();
    }
  }

  // Рельефные линии (контуры высот)
  ctx.strokeStyle = 'rgba(120, 100, 70, 0.06)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 12; i++) {
    const yBase = H * (0.15 + i * 0.07);
    ctx.beginPath();
    ctx.moveTo(0, yBase);
    for (let x = 0; x < W; x += 8) {
      const wave = Math.sin(x * 0.008 + i * 1.5) * 12 + Math.sin(x * 0.02 + i) * 5;
      ctx.lineTo(x, yBase + wave);
    }
    ctx.stroke();
  }

  // Рамка пергамента
  ctx.strokeStyle = 'rgba(140, 120, 80, 0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, W - 8, H - 8);
  ctx.strokeStyle = 'rgba(140, 120, 80, 0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, W - 16, H - 16);

  // Компас (правый нижний угол)
  const compassX = W - 40;
  const compassY = H - 40;
  const compassR = 16;
  ctx.beginPath();
  ctx.arc(compassX, compassY, compassR, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(160, 140, 100, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // N стрелка
  ctx.beginPath();
  ctx.moveTo(compassX, compassY - compassR + 2);
  ctx.lineTo(compassX - 3, compassY);
  ctx.lineTo(compassX + 3, compassY);
  ctx.closePath();
  ctx.fillStyle = 'rgba(200, 60, 60, 0.4)';
  ctx.fill();

  // S стрелка
  ctx.beginPath();
  ctx.moveTo(compassX, compassY + compassR - 2);
  ctx.lineTo(compassX - 3, compassY);
  ctx.lineTo(compassX + 3, compassY);
  ctx.closePath();
  ctx.fillStyle = 'rgba(160, 140, 100, 0.2)';
  ctx.fill();

  // N буква
  ctx.fillStyle = 'rgba(200, 180, 140, 0.4)';
  ctx.font = '7px serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', compassX, compassY - compassR - 3);
}

export function MapView({ mapHook }: MapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { getStatus, getProgress, activeTerritory, activateTerritory } = mapHook;

  // Canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      // Reset canvas size for drawing in CSS pixels
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      // Redraw with CSS-pixel dimensions
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = rect.width;
      tempCanvas.height = rect.height;
      drawMapBackground(tempCanvas);
      ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height, 0, 0, rect.width, rect.height);
    }
  }, []);

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
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '120%',
        borderRadius: '12px',
        border: '2px solid rgba(140, 120, 80, 0.25)',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Canvas background */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Animated fog layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 50% at 20% 30%, rgba(100,90,70,0.08), transparent),
            radial-gradient(ellipse 60% 40% at 75% 60%, rgba(80,70,50,0.06), transparent)
          `,
          animation: 'map-fog-drift 20s ease-in-out infinite alternate',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Content container */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {/* SVG roads/connections */}
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
          <defs>
            {/* Glow filter for active roads */}
            <filter id="road-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Dotted pattern for locked roads */}
            <pattern id="road-dots" patternUnits="userSpaceOnUse" width="8" height="8">
              <circle cx="4" cy="4" r="1" fill="rgba(100,90,70,0.3)" />
            </pattern>
          </defs>

          {connections.map((conn) => {
            const fromStatus = getStatus(conn.from);
            const toStatus = getStatus(conn.to);
            const bothLocked = fromStatus === 'locked' && toStatus === 'locked';
            const isUnlocked = fromStatus !== 'locked' && toStatus !== 'locked';
            const hasCaptured =
              fromStatus === 'captured' || toStatus === 'captured';

            // Вычисляем контрольную точку для кривой (лёгкий изгиб дороги)
            const mx = (conn.x1 + conn.x2) / 2;
            const my = (conn.y1 + conn.y2) / 2;
            const dx = conn.x2 - conn.x1;
            const dy = conn.y2 - conn.y1;
            const offsetX = -dy * 0.08;
            const offsetY = dx * 0.08;
            const cx = mx + offsetX;
            const cy = my + offsetY;

            const pathD = `M ${conn.x1} ${conn.y1} Q ${cx} ${cy} ${conn.x2} ${conn.y2}`;

            if (bothLocked) {
              return (
                <path
                  key={`${conn.from}-${conn.to}`}
                  d={pathD}
                  fill="none"
                  stroke="rgba(80, 70, 50, 0.12)"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                  vectorEffect="non-scaling-stroke"
                  style={{
                    // Конвертируем координаты — SVG viewBox не используется, 
                    // поэтому используем проценты через transform
                  }}
                />
              );
            }

            return (
              <g key={`${conn.from}-${conn.to}`}>
                {/* Тень дороги */}
                {isUnlocked && (
                  <line
                    x1={`${conn.x1}%`}
                    y1={`${conn.y1}%`}
                    x2={`${conn.x2}%`}
                    y2={`${conn.y2}%`}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                )}
                {/* Дорога основная */}
                <line
                  x1={`${conn.x1}%`}
                  y1={`${conn.y1}%`}
                  x2={`${conn.x2}%`}
                  y2={`${conn.y2}%`}
                  stroke={
                    hasCaptured
                      ? 'rgba(180, 160, 100, 0.5)'
                      : isUnlocked
                        ? 'rgba(140, 120, 80, 0.35)'
                        : 'rgba(80, 70, 50, 0.15)'
                  }
                  strokeWidth={isUnlocked ? '3' : '1.5'}
                  strokeLinecap="round"
                  strokeDasharray={isUnlocked ? 'none' : '3 5'}
                  filter={hasCaptured ? 'url(#road-glow)' : undefined}
                  style={{ transition: 'stroke 0.6s, stroke-width 0.6s' }}
                />
                {/* Пунктир по центру дороги (разметка) */}
                {isUnlocked && (
                  <line
                    x1={`${conn.x1}%`}
                    y1={`${conn.y1}%`}
                    x2={`${conn.x2}%`}
                    y2={`${conn.y2}%`}
                    stroke="rgba(200, 180, 130, 0.15)"
                    strokeWidth="1"
                    strokeDasharray="4 8"
                    strokeLinecap="round"
                  />
                )}
              </g>
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

        {/* Legend — пергаментный стиль */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            backgroundColor: 'rgba(20, 18, 12, 0.85)',
            backdropFilter: 'blur(4px)',
            borderRadius: '6px',
            padding: '6px 10px',
            border: '1px solid rgba(140, 120, 80, 0.2)',
            zIndex: 20,
          }}
        >
          {[
            { color: '#4a4540', label: '🔒 Закрыто', symbol: '▪' },
            { color: '#8a8070', label: '🌫️ Туман', symbol: '◌' },
            { color: '#5d8a3c', label: '⚔️ Доступно', symbol: '◆' },
            { color: '#c4880d', label: '🔥 В бою', symbol: '◈' },
            { color: '#d4a830', label: '👑 Захвачено', symbol: '★' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <span style={{ fontSize: '8px', color: item.color }}>{item.symbol}</span>
              <span
                style={{
                  fontSize: '8px',
                  color: 'rgba(180, 160, 120, 0.6)',
                  fontFamily: 'serif',
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Active territory scroll-banner */}
        {activeTerritory && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(20, 18, 12, 0.88)',
              border: '1px solid rgba(200, 160, 80, 0.3)',
              borderRadius: '6px',
              padding: '5px 12px',
              backdropFilter: 'blur(4px)',
              zIndex: 20,
              boxShadow: '0 0 12px rgba(200, 160, 80, 0.1)',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: 'rgba(220, 190, 120, 0.9)',
                fontWeight: 500,
                fontFamily: 'serif',
                letterSpacing: '0.03em',
              }}
            >
              ⚔️ {activeTerritory.icon} {activeTerritory.name}
            </span>
          </div>
        )}

        {/* Map title */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'serif',
              color: 'rgba(180, 160, 120, 0.35)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Земли Дохода
          </span>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes map-fog-drift {
          0% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(2%, -1%) scale(1.02);
            opacity: 0.8;
          }
          100% { 
            transform: translate(-1%, 1%) scale(0.98);
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}