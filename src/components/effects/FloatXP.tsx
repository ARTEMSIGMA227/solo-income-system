'use client';

import { useEffect, useState } from 'react';

interface FloatItem {
  id: number;
  text: string;
  color: string;
  x: number;
}

let nextId = 0;

export function useFloatXP() {
  const [items, setItems] = useState<FloatItem[]>([]);

  const addFloat = (text: string, color: string = '#a78bfa') => {
    const id = nextId++;
    const x = 30 + Math.random() * 40;
    setItems(prev => [...prev, { id, text, color, x }]);
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
    }, 1500);
  };

  return { items, addFloat };
}

export function FloatXPContainer({ items }: { items: FloatItem[] }) {
  if (items.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100,
    }}>
      {items.map(item => (
        <FloatText key={item.id} text={item.text} color={item.color} x={item.x} />
      ))}
    </div>
  );
}

function FloatText({ text, color, x }: { text: string; color: string; x: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`,
      top: visible ? '35%' : '55%',
      opacity: visible ? 0 : 1,
      fontSize: '20px',
      fontWeight: 800,
      color,
      textShadow: `0 0 20px ${color}80`,
      transition: 'all 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    }}>
      {text}
    </div>
  );
}