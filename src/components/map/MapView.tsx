'use client';

import { useEffect, useRef, useCallback } from 'react';
import { TERRITORIES, BIOME_CONFIG } from '@/lib/map-data';
import type { BiomeType } from '@/lib/map-data';
import { TerritoryNode } from './TerritoryNode';
import type { useMap } from '@/hooks/use-map';

interface MapViewProps {
  mapHook: ReturnType<typeof useMap>;
}

/* ─────────────────── Seeded RNG ─────────────────── */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ─────────────────── Canvas Drawing ─────────────────── */

function drawParchmentBase(ctx: CanvasRenderingContext2D, W: number, H: number) {
  // Base warm parchment
  const bgGrad = ctx.createRadialGradient(W * 0.45, H * 0.35, W * 0.05, W * 0.5, H * 0.5, W * 0.85);
  bgGrad.addColorStop(0, '#d4c5a0');
  bgGrad.addColorStop(0.3, '#c9b88a');
  bgGrad.addColorStop(0.6, '#bda874');
  bgGrad.addColorStop(0.85, '#a89060');
  bgGrad.addColorStop(1, '#8c7548');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Noise texture (parchment grain)
  const rng = seededRandom(42);
  for (let i = 0; i < 15000; i++) {
    const x = rng() * W;
    const y = rng() * H;
    const brightness = 140 + rng() * 60;
    const alpha = 0.02 + rng() * 0.06;
    ctx.fillStyle = `rgba(${brightness}, ${brightness - 20}, ${brightness - 50}, ${alpha})`;
    ctx.fillRect(x, y, rng() > 0.5 ? 2 : 1, 1);
  }

  // Coffee stain rings
  const stains = [
    { x: 0.15, y: 0.25, r: 0.06 },
    { x: 0.82, y: 0.7, r: 0.05 },
    { x: 0.6, y: 0.15, r: 0.04 },
  ];
  for (const stain of stains) {
    const sx = stain.x * W;
    const sy = stain.y * H;
    const sr = stain.r * W;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(120, 90, 50, 0.06)';
    ctx.lineWidth = sr * 0.15;
    ctx.stroke();
    // Inner wash
    const stainGrad = ctx.createRadialGradient(sx, sy, sr * 0.6, sx, sy, sr);
    stainGrad.addColorStop(0, 'rgba(100, 75, 40, 0.03)');
    stainGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = stainGrad;
    ctx.fill();
  }

  // Fold creases
  ctx.strokeStyle = 'rgba(100, 80, 45, 0.08)';
  ctx.lineWidth = 1;
  // Horizontal fold
  ctx.beginPath();
  ctx.moveTo(0, H * 0.5);
  for (let x = 0; x < W; x += 4) {
    ctx.lineTo(x, H * 0.5 + Math.sin(x * 0.01) * 2);
  }
  ctx.stroke();
  // Vertical fold
  ctx.beginPath();
  ctx.moveTo(W * 0.5, 0);
  for (let y = 0; y < H; y += 4) {
    ctx.lineTo(W * 0.5 + Math.sin(y * 0.01) * 2, y);
  }
  ctx.stroke();
}

function drawBurnedEdges(ctx: CanvasRenderingContext2D, W: number, H: number) {
  // Dark vignette around edges (aged/burned look)
  const edgeGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.35, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
  edgeGrad.addColorStop(0, 'transparent');
  edgeGrad.addColorStop(0.7, 'rgba(60, 40, 20, 0.15)');
  edgeGrad.addColorStop(1, 'rgba(30, 20, 10, 0.5)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, W, H);
}

function drawOrnamentBorder(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const m = 8; // margin
  const ink = 'rgba(80, 55, 30, 0.4)';
  const inkLight = 'rgba(80, 55, 30, 0.2)';

  // Outer border
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(m, m, W - m * 2, H - m * 2);

  // Inner border
  ctx.strokeStyle = inkLight;
  ctx.lineWidth = 1;
  ctx.strokeRect(m + 5, m + 5, W - m * 2 - 10, H - m * 2 - 10);

  // Corner ornaments
  const corners = [
    { x: m + 2, y: m + 2, sx: 1, sy: 1 },
    { x: W - m - 2, y: m + 2, sx: -1, sy: 1 },
    { x: m + 2, y: H - m - 2, sx: 1, sy: -1 },
    { x: W - m - 2, y: H - m - 2, sx: -1, sy: -1 },
  ];

  for (const c of corners) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(c.sx, c.sy);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.5;

    // L-shape with curl
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(0, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();

    // Inner curl
    ctx.beginPath();
    ctx.moveTo(4, 14);
    ctx.quadraticCurveTo(4, 4, 14, 4);
    ctx.strokeStyle = inkLight;
    ctx.stroke();

    // Diamond ornament
    ctx.beginPath();
    ctx.moveTo(3, 3);
    ctx.lineTo(6, 0);
    ctx.lineTo(9, 3);
    ctx.lineTo(6, 6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(80, 55, 30, 0.15)';
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.restore();
  }
}

function drawMountainRange(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const rng = seededRandom(123);

  // Background mountains (far, lighter)
  ctx.beginPath();
  ctx.moveTo(0, H * 0.1);
  for (let x = 0; x <= W; x += W * 0.03) {
    const baseY = H * 0.08;
    const peak = rng() * H * 0.06;
    ctx.lineTo(x, baseY - peak + Math.sin(x * 0.005) * H * 0.02);
  }
  ctx.lineTo(W, H * 0.14);
  ctx.lineTo(W, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(100, 80, 55, 0.15)';
  ctx.fill();

  // Foreground mountains (closer, darker, with detail)
  const peaks: Array<[number, number]> = [];
  ctx.beginPath();
  ctx.moveTo(0, H * 0.13);
  for (let x = 0; x <= W; x += W * 0.04) {
    const baseY = H * 0.11;
    const peak = rng() * H * 0.08;
    const py = baseY - peak;
    ctx.lineTo(x, py);
    if (peak > H * 0.04) peaks.push([x, py]);
  }
  ctx.lineTo(W, H * 0.16);
  ctx.lineTo(W, H * 0.1);
  ctx.lineTo(0, H * 0.1);
  ctx.closePath();
  const mtGrad = ctx.createLinearGradient(0, 0, 0, H * 0.16);
  mtGrad.addColorStop(0, 'rgba(85, 65, 40, 0.35)');
  mtGrad.addColorStop(1, 'rgba(110, 90, 60, 0.08)');
  ctx.fillStyle = mtGrad;
  ctx.fill();

  // Snow caps on tallest peaks
  ctx.fillStyle = 'rgba(230, 220, 200, 0.25)';
  for (const [px, py] of peaks) {
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - 6, py + 5);
    ctx.lineTo(px + 6, py + 5);
    ctx.closePath();
    ctx.fill();
  }

  // Mountain ink outlines
  ctx.strokeStyle = 'rgba(70, 50, 30, 0.12)';
  ctx.lineWidth = 0.5;
  for (const [px, py] of peaks) {
    ctx.beginPath();
    ctx.moveTo(px - 12, py + 10);
    ctx.lineTo(px, py);
    ctx.lineTo(px + 12, py + 10);
    ctx.stroke();
    // Hatching on shadow side
    for (let h = 2; h < 8; h += 2) {
      ctx.beginPath();
      ctx.moveTo(px - h * 0.8, py + h);
      ctx.lineTo(px - h * 0.5, py + h + 2);
      ctx.stroke();
    }
  }
}

function drawRiver(ctx: CanvasRenderingContext2D, W: number, H: number) {
  // Winding river from mountains down through the map
  const riverPoints = [
    { x: 0.42, y: 0.12 },
    { x: 0.38, y: 0.22 },
    { x: 0.42, y: 0.32 },
    { x: 0.48, y: 0.45 },
    { x: 0.44, y: 0.55 },
    { x: 0.38, y: 0.65 },
    { x: 0.42, y: 0.78 },
    { x: 0.48, y: 0.92 },
  ];

  // River shadow
  ctx.beginPath();
  ctx.moveTo(riverPoints[0].x * W + 1, riverPoints[0].y * H + 1);
  for (let i = 1; i < riverPoints.length; i++) {
    const prev = riverPoints[i - 1];
    const curr = riverPoints[i];
    const cpx = ((prev.x + curr.x) / 2) * W + 1;
    const cpy = ((prev.y + curr.y) / 2) * H + 1;
    ctx.quadraticCurveTo(prev.x * W + 1, prev.y * H + 1, cpx, cpy);
  }
  ctx.strokeStyle = 'rgba(50, 35, 20, 0.1)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.stroke();

  // River main
  ctx.beginPath();
  ctx.moveTo(riverPoints[0].x * W, riverPoints[0].y * H);
  for (let i = 1; i < riverPoints.length; i++) {
    const prev = riverPoints[i - 1];
    const curr = riverPoints[i];
    const cpx = ((prev.x + curr.x) / 2) * W;
    const cpy = ((prev.y + curr.y) / 2) * H;
    ctx.quadraticCurveTo(prev.x * W, prev.y * H, cpx, cpy);
  }
  ctx.strokeStyle = 'rgba(80, 120, 150, 0.2)';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // River highlight
  ctx.beginPath();
  ctx.moveTo(riverPoints[0].x * W - 0.5, riverPoints[0].y * H);
  for (let i = 1; i < riverPoints.length; i++) {
    const prev = riverPoints[i - 1];
    const curr = riverPoints[i];
    const cpx = ((prev.x + curr.x) / 2) * W - 0.5;
    const cpy = ((prev.y + curr.y) / 2) * H;
    ctx.quadraticCurveTo(prev.x * W - 0.5, prev.y * H, cpx, cpy);
  }
  ctx.strokeStyle = 'rgba(120, 170, 200, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // River label
  ctx.save();
  ctx.translate(W * 0.35, H * 0.5);
  ctx.rotate(-0.3);
  ctx.fillStyle = 'rgba(70, 100, 130, 0.18)';
  ctx.font = `italic ${Math.max(7, W * 0.018)}px serif`;
  ctx.textAlign = 'center';
  ctx.fillText('р. Доход', 0, 0);
  ctx.restore();
}

function drawBiomeDecoration(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  cx: number,
  cy: number,
  biome: BiomeType,
  rng: () => number,
) {
  const px = cx * W / 100;
  const py = cy * H / 100;
  const spread = Math.min(W, H) * 0.06;

  switch (biome) {
    case 'plains': {
      // Grass tufts and small flowers
      for (let i = 0; i < 12; i++) {
        const gx = px + (rng() - 0.5) * spread * 2;
        const gy = py + (rng() - 0.5) * spread * 1.5;
        ctx.strokeStyle = `rgba(90, 120, 50, ${0.1 + rng() * 0.1})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx - 1, gy - 3 - rng() * 3);
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + 1.5, gy - 2 - rng() * 3);
        ctx.stroke();
      }
      // Tiny flowers
      for (let i = 0; i < 4; i++) {
        const fx = px + (rng() - 0.5) * spread * 1.8;
        const fy = py + (rng() - 0.5) * spread * 1.3;
        ctx.fillStyle = `rgba(180, 60, 60, ${0.15 + rng() * 0.1})`;
        ctx.beginPath();
        ctx.arc(fx, fy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'forest': {
      // Dense triangular trees
      for (let i = 0; i < 18; i++) {
        const tx = px + (rng() - 0.5) * spread * 2.2;
        const ty = py + (rng() - 0.5) * spread * 1.8;
        const size = 3 + rng() * 4;
        // Trunk
        ctx.fillStyle = 'rgba(70, 50, 25, 0.15)';
        ctx.fillRect(tx - 0.4, ty, 0.8, size * 0.5);
        // Crown
        ctx.beginPath();
        ctx.moveTo(tx, ty - size);
        ctx.lineTo(tx - size * 0.6, ty);
        ctx.lineTo(tx + size * 0.6, ty);
        ctx.closePath();
        const green = 55 + Math.floor(rng() * 35);
        ctx.fillStyle = `rgba(40, ${green}, 25, ${0.12 + rng() * 0.1})`;
        ctx.fill();
      }
      break;
    }
    case 'mountain': {
      // Small rocky peaks
      for (let i = 0; i < 6; i++) {
        const mx = px + (rng() - 0.5) * spread * 1.8;
        const my = py + (rng() - 0.5) * spread * 1.2;
        const h = 5 + rng() * 7;
        ctx.beginPath();
        ctx.moveTo(mx - h * 0.5, my);
        ctx.lineTo(mx, my - h);
        ctx.lineTo(mx + h * 0.5, my);
        ctx.closePath();
        ctx.fillStyle = `rgba(90, 75, 55, ${0.1 + rng() * 0.08})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(70, 50, 30, ${0.08 + rng() * 0.06})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      break;
    }
    case 'snow': {
      // Snow-capped mini peaks + snowflake dots
      for (let i = 0; i < 5; i++) {
        const sx = px + (rng() - 0.5) * spread * 1.6;
        const sy = py + (rng() - 0.5) * spread * 1.2;
        const h = 6 + rng() * 5;
        ctx.beginPath();
        ctx.moveTo(sx - h * 0.5, sy);
        ctx.lineTo(sx, sy - h);
        ctx.lineTo(sx + h * 0.5, sy);
        ctx.closePath();
        ctx.fillStyle = 'rgba(180, 180, 175, 0.12)';
        ctx.fill();
        // Snow cap
        ctx.beginPath();
        ctx.moveTo(sx, sy - h);
        ctx.lineTo(sx - 2, sy - h + 3);
        ctx.lineTo(sx + 2, sy - h + 3);
        ctx.closePath();
        ctx.fillStyle = 'rgba(230, 230, 225, 0.2)';
        ctx.fill();
      }
      // Snowflakes
      for (let i = 0; i < 8; i++) {
        const dx = px + (rng() - 0.5) * spread * 2;
        const dy = py + (rng() - 0.5) * spread * 1.5;
        ctx.fillStyle = 'rgba(220, 220, 215, 0.15)';
        ctx.beginPath();
        ctx.arc(dx, dy, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'desert': {
      // Sand dunes (wavy lines)
      for (let i = 0; i < 5; i++) {
        const dy = py + (rng() - 0.5) * spread * 1.2;
        const startX = px - spread * 0.8;
        ctx.beginPath();
        ctx.moveTo(startX, dy);
        for (let x = 0; x < spread * 1.6; x += 3) {
          ctx.lineTo(startX + x, dy + Math.sin(x * 0.3 + i) * 2);
        }
        ctx.strokeStyle = `rgba(170, 140, 80, ${0.06 + rng() * 0.06})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      // Cactus
      for (let i = 0; i < 2; i++) {
        const cx2 = px + (rng() - 0.5) * spread * 1.5;
        const cy2 = py + (rng() - 0.5) * spread;
        ctx.strokeStyle = 'rgba(80, 110, 50, 0.15)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx2, cy2);
        ctx.lineTo(cx2, cy2 - 5);
        ctx.moveTo(cx2, cy2 - 3);
        ctx.lineTo(cx2 - 2, cy2 - 4.5);
        ctx.moveTo(cx2, cy2 - 2);
        ctx.lineTo(cx2 + 2, cy2 - 3.5);
        ctx.stroke();
      }
      break;
    }
    case 'swamp': {
      // Wavy water + reeds
      for (let i = 0; i < 6; i++) {
        const wy = py + (rng() - 0.5) * spread * 1.5;
        const wx = px + (rng() - 0.5) * spread * 1.5;
        ctx.beginPath();
        ctx.arc(wx, wy, 2 + rng() * 3, 0, Math.PI);
        ctx.strokeStyle = `rgba(70, 100, 70, ${0.08 + rng() * 0.06})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      // Reeds
      for (let i = 0; i < 5; i++) {
        const rx = px + (rng() - 0.5) * spread * 1.8;
        const ry = py + (rng() - 0.5) * spread * 1.2;
        ctx.strokeStyle = 'rgba(70, 90, 40, 0.12)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.quadraticCurveTo(rx + 1, ry - 4, rx - 0.5, ry - 7);
        ctx.stroke();
      }
      break;
    }
    case 'magical': {
      // Arcane circles + star dots
      ctx.strokeStyle = 'rgba(130, 90, 180, 0.08)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(px, py, spread * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(px, py, spread * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Rune dots
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const rdx = px + Math.cos(angle) * spread * 0.5;
        const rdy = py + Math.sin(angle) * spread * 0.5;
        ctx.fillStyle = 'rgba(150, 100, 200, 0.12)';
        ctx.beginPath();
        ctx.arc(rdx, rdy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'crystal': {
      // Crystal formations
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + 0.3;
        const dist = spread * (0.3 + rng() * 0.4);
        const dx = px + Math.cos(angle) * dist;
        const dy = py + Math.sin(angle) * dist;
        const h = 4 + rng() * 5;
        // Crystal shard
        ctx.beginPath();
        ctx.moveTo(dx, dy - h);
        ctx.lineTo(dx - 1.5, dy);
        ctx.lineTo(dx + 1.5, dy);
        ctx.closePath();
        ctx.fillStyle = `rgba(200, 100, 170, ${0.08 + rng() * 0.06})`;
        ctx.fill();
        ctx.strokeStyle = 'rgba(220, 120, 190, 0.1)';
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }
      // Glow
      const crystalGlow = ctx.createRadialGradient(px, py, 0, px, py, spread * 0.6);
      crystalGlow.addColorStop(0, 'rgba(220, 100, 180, 0.04)');
      crystalGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = crystalGlow;
      ctx.beginPath();
      ctx.arc(px, py, spread * 0.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
}

function drawContourLines(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.strokeStyle = 'rgba(100, 80, 50, 0.04)';
  ctx.lineWidth = 0.5;
  const rng = seededRandom(777);
  for (let i = 0; i < 14; i++) {
    const yBase = H * (0.12 + i * 0.06);
    ctx.beginPath();
    ctx.moveTo(0, yBase);
    for (let x = 0; x < W; x += 6) {
      const wave = Math.sin(x * 0.008 + i * 1.7) * 8 + Math.sin(x * 0.02 + i * 0.5) * 4;
      ctx.lineTo(x, yBase + wave + rng() * 2);
    }
    ctx.stroke();
  }
}

function drawCompassRose(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx, cy);

  const ink = 'rgba(80, 55, 30, 0.35)';
  const inkLight = 'rgba(80, 55, 30, 0.18)';
  const red = 'rgba(160, 50, 40, 0.4)';

  // Outer circle
  ctx.strokeStyle = inkLight;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.stroke();

  // Inner circle
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
  ctx.stroke();

  // 8 tick marks
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const inner = i % 2 === 0 ? size * 0.7 : size * 0.85;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
    ctx.strokeStyle = inkLight;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // North arrow (red)
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.65);
  ctx.lineTo(-size * 0.12, 0);
  ctx.lineTo(0, -size * 0.15);
  ctx.closePath();
  ctx.fillStyle = red;
  ctx.fill();

  // North arrow (right half lighter)
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.65);
  ctx.lineTo(size * 0.12, 0);
  ctx.lineTo(0, -size * 0.15);
  ctx.closePath();
  ctx.fillStyle = 'rgba(160, 50, 40, 0.25)';
  ctx.fill();

  // South arrow
  ctx.beginPath();
  ctx.moveTo(0, size * 0.65);
  ctx.lineTo(-size * 0.1, 0);
  ctx.lineTo(0, size * 0.15);
  ctx.closePath();
  ctx.fillStyle = ink;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, size * 0.65);
  ctx.lineTo(size * 0.1, 0);
  ctx.lineTo(0, size * 0.15);
  ctx.closePath();
  ctx.fillStyle = inkLight;
  ctx.fill();

  // E/W smaller arrows
  for (const angle of [0, Math.PI]) {
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(size * 0.5, 0);
    ctx.lineTo(0, -size * 0.06);
    ctx.lineTo(size * 0.1, 0);
    ctx.lineTo(0, size * 0.06);
    ctx.closePath();
    ctx.fillStyle = inkLight;
    ctx.fill();
    ctx.restore();
  }

  // Center dot
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = ink;
  ctx.fill();

  // Labels
  const fontSize = Math.max(6, size * 0.32);
  ctx.font = `bold ${fontSize}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = red;
  ctx.fillText('N', 0, -size - fontSize * 0.7);
  ctx.fillStyle = ink;
  ctx.fillText('S', 0, size + fontSize * 0.7);
  ctx.font = `${fontSize * 0.8}px serif`;
  ctx.fillText('E', size + fontSize * 0.6, 0);
  ctx.fillText('W', -size - fontSize * 0.6, 0);

  ctx.restore();
}

function drawMapTitle(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const fontSize = Math.max(10, Math.min(W * 0.032, 16));
  ctx.save();
  ctx.font = `${fontSize}px serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(80, 55, 30, 0.3)';
  ctx.fillText('⚜  З Е М Л И   Д О Х О Д А  ⚜', W * 0.5, H * 0.035 + fontSize);

  // Decorative line under title
  const lineY = H * 0.035 + fontSize + 5;
  const lineW = fontSize * 8;
  ctx.strokeStyle = 'rgba(80, 55, 30, 0.15)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(W * 0.5 - lineW, lineY);
  ctx.lineTo(W * 0.5 + lineW, lineY);
  ctx.stroke();
  // Center diamond
  ctx.fillStyle = 'rgba(80, 55, 30, 0.2)';
  ctx.beginPath();
  ctx.moveTo(W * 0.5, lineY - 2);
  ctx.lineTo(W * 0.5 + 3, lineY + 1);
  ctx.lineTo(W * 0.5, lineY + 4);
  ctx.lineTo(W * 0.5 - 3, lineY + 1);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawSeaEdges(ctx: CanvasRenderingContext2D, W: number, H: number) {
  // Sea on left and right edges
  const rng = seededRandom(999);

  // Left coast waves
  for (let y = H * 0.15; y < H * 0.9; y += 8) {
    const waveX = 14 + Math.sin(y * 0.03) * 4 + rng() * 3;
    ctx.beginPath();
    ctx.arc(waveX, y, 2 + rng() * 2, 0, Math.PI);
    ctx.strokeStyle = `rgba(80, 120, 150, ${0.06 + rng() * 0.04})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Right coast waves
  for (let y = H * 0.15; y < H * 0.9; y += 8) {
    const waveX = W - 14 - Math.sin(y * 0.025) * 4 - rng() * 3;
    ctx.beginPath();
    ctx.arc(waveX, y, 2 + rng() * 2, Math.PI, Math.PI * 2);
    ctx.strokeStyle = `rgba(80, 120, 150, ${0.06 + rng() * 0.04})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Bottom sea waves
  for (let x = 15; x < W - 15; x += 10) {
    const waveY = H - 14 - Math.sin(x * 0.02) * 3 - rng() * 2;
    ctx.beginPath();
    ctx.arc(x, waveY, 2 + rng() * 2, Math.PI, Math.PI * 2);
    ctx.strokeStyle = `rgba(80, 120, 150, ${0.04 + rng() * 0.03})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

function drawFullMapBackground(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  drawParchmentBase(ctx, W, H);
  drawContourLines(ctx, W, H);
  drawMountainRange(ctx, W, H);
  drawRiver(ctx, W, H);
  drawSeaEdges(ctx, W, H);

  // Biome decorations around each territory
  const biomeRng = seededRandom(555);
  for (const t of TERRITORIES) {
    drawBiomeDecoration(ctx, W, H, t.position.x, t.position.y, t.biome, biomeRng);
  }

  drawBurnedEdges(ctx, W, H);
  drawOrnamentBorder(ctx, W, H);
  drawCompassRose(ctx, W - 36, H - 38, 16);
  drawMapTitle(ctx, W, H);
}

/* ─────────────────── Component ─────────────────── */

export function MapView({ mapHook }: MapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { getStatus, getProgress, activeTerritory, activateTerritory } = mapHook;

  const drawCanvas = useCallback(() => {
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
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Draw on temp canvas at CSS pixel size
    const temp = document.createElement('canvas');
    temp.width = rect.width;
    temp.height = rect.height;
    drawFullMapBackground(temp);
    ctx.drawImage(temp, 0, 0);
  }, []);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Build unique connections
  const addedPairs = new Set<string>();
  const connections: Array<{
    from: string;
    to: string;
    x1: number; y1: number;
    x2: number; y2: number;
    fromBiome: BiomeType;
    toBiome: BiomeType;
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
        x1: t.position.x, y1: t.position.y,
        x2: target.position.x, y2: target.position.y,
        fromBiome: t.biome,
        toBiome: target.biome,
      });
    });
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '130%',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 30px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)',
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

      {/* Animated fog overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 20% 30%, rgba(180,160,120,0.04), transparent),
            radial-gradient(ellipse 60% 50% at 80% 70%, rgba(160,140,100,0.03), transparent)
          `,
          animation: 'map-fog-drift 25s ease-in-out infinite alternate',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Content container */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {/* SVG roads */}
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
            <filter id="road-glow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {connections.map((conn) => {
            const fromStatus = getStatus(conn.from);
            const toStatus = getStatus(conn.to);
            const bothLocked = fromStatus === 'locked' && toStatus === 'locked';
            const isUnlocked = fromStatus !== 'locked' && toStatus !== 'locked';
            const hasCaptured = fromStatus === 'captured' || toStatus === 'captured';

            const roadColor = bothLocked
              ? 'rgba(100, 80, 50, 0.08)'
              : hasCaptured
                ? 'rgba(140, 100, 40, 0.4)'
                : isUnlocked
                  ? 'rgba(110, 85, 50, 0.3)'
                  : 'rgba(100, 80, 50, 0.12)';

            const roadWidth = bothLocked ? 1 : isUnlocked ? 2.5 : 1.5;
            const dash = isUnlocked ? 'none' : bothLocked ? '2 6' : '3 5';

            return (
              <g key={`${conn.from}-${conn.to}`}>
                {/* Road shadow */}
                {isUnlocked && (
                  <line
                    x1={`${conn.x1}%`} y1={`${conn.y1}%`}
                    x2={`${conn.x2}%`} y2={`${conn.y2}%`}
                    stroke="rgba(50, 35, 20, 0.15)"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                )}
                {/* Road main */}
                <line
                  x1={`${conn.x1}%`} y1={`${conn.y1}%`}
                  x2={`${conn.x2}%`} y2={`${conn.y2}%`}
                  stroke={roadColor}
                  strokeWidth={roadWidth}
                  strokeLinecap="round"
                  strokeDasharray={dash}
                  filter={hasCaptured ? 'url(#road-glow)' : undefined}
                  style={{ transition: 'stroke 0.5s, stroke-width 0.5s' }}
                />
                {/* Center dashes for unlocked roads */}
                {isUnlocked && (
                  <line
                    x1={`${conn.x1}%`} y1={`${conn.y1}%`}
                    x2={`${conn.x2}%`} y2={`${conn.y2}%`}
                    stroke="rgba(180, 150, 100, 0.08)"
                    strokeWidth="1"
                    strokeDasharray="3 7"
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

        {/* Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            backgroundColor: 'rgba(200, 180, 140, 0.85)',
            backdropFilter: 'blur(3px)',
            borderRadius: '4px',
            padding: '5px 8px',
            border: '1px solid rgba(120, 90, 50, 0.3)',
            zIndex: 20,
          }}
        >
          {[
            { color: '#6b5c48', label: '🔒 Закрыто' },
            { color: '#8a7c68', label: '🌫️ Туман' },
            { color: '#4a7c2e', label: '⚔️ Доступно' },
            { color: '#b87a0a', label: '🔥 В бою' },
            { color: '#8b6914', label: '👑 Захвачено' },
          ].map((item) => (
            <span
              key={item.label}
              style={{
                fontSize: '7px',
                color: item.color,
                fontFamily: 'serif',
                fontWeight: 600,
              }}
            >
              {item.label}
            </span>
          ))}
        </div>

        {/* Active territory banner */}
        {activeTerritory && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: 'rgba(200, 180, 140, 0.9)',
              border: '1px solid rgba(120, 90, 50, 0.4)',
              borderRadius: '4px',
              padding: '4px 10px',
              zIndex: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: 'rgba(80, 55, 30, 0.85)',
                fontWeight: 600,
                fontFamily: 'serif',
              }}
            >
              ⚔️ {activeTerritory.icon} {activeTerritory.name}
            </span>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes map-fog-drift {
          0% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate(1%, -0.5%) scale(1.01); opacity: 0.7; }
          100% { transform: translate(-0.5%, 0.5%) scale(0.99); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
