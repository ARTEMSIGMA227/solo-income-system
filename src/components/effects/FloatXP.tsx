'use client';

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface FloatItem {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
}

export function useFloatXP() {
  const [items, setItems] = useState<FloatItem[]>([]);

  const addFloat = useCallback((text: string, color: string, event?: React.MouseEvent | { clientX: number; clientY: number }) => {
    let x: number;
    let y: number;

    if (event && 'clientX' in event) {
      x = event.clientX;
      y = event.clientY;
    } else {
      // Fallback: center-top area
      x = window.innerWidth / 2;
      y = window.innerHeight / 2;
    }

    const id = `float-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setItems(prev => [...prev, { id, text, color, x, y }]);

    setTimeout(() => {
      setItems(prev => prev.filter(item => item.id !== id));
    }, 1200);
  }, []);

  return { items, addFloat };
}

function FloatXPItem({ item }: { item: FloatItem }) {
  return (
    <div
      style={{
        position: 'fixed',
        left: item.x,
        top: item.y,
        pointerEvents: 'none',
        zIndex: 99999,
        color: item.color,
        fontWeight: 800,
        fontSize: '18px',
        textShadow: `0 0 12px ${item.color}60, 0 2px 4px rgba(0,0,0,0.8)`,
        animation: 'floatXPUp 1.2s ease-out forwards',
        willChange: 'transform, opacity',
      }}
    >
      {item.text}
      <style>{`
        @keyframes floatXPUp {
          0% {
            transform: translate(-50%, 0) scale(0.5);
            opacity: 0;
          }
          15% {
            transform: translate(-50%, -10px) scale(1.2);
            opacity: 1;
          }
          30% {
            transform: translate(-50%, -20px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -80px) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export function FloatXPContainer({ items }: { items: FloatItem[] }) {
  if (typeof window === 'undefined') return null;
  if (items.length === 0) return null;

  return createPortal(
    <>
      {items.map((item, index) => (
        <div
          key={item.id}
          style={{
            position: 'fixed',
            left: item.x,
            top: item.y - index * 28,
            pointerEvents: 'none',
            zIndex: 99999 + index,
          }}
        >
          <FloatXPItem item={{ ...item, y: item.y - index * 28 }} />
        </div>
      ))}
    </>,
    document.body
  );
}