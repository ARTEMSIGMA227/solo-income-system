'use client';

import { useEffect, useState, useCallback } from 'react';

interface FloatItem {
  id: number;
  text: string;
  color: string;
}

let nextId = 0;

export function useFloatXP() {
  const [items, setItems] = useState<FloatItem[]>([]);

  const addFloat = useCallback((text: string, color: string = '#a78bfa') => {
    const id = nextId++;
    setItems(prev => [...prev, { id, text, color }]);
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
    }, 1600);
  }, []);

  return { items, addFloat };
}

export function FloatXPContainer({ items }: { items: FloatItem[] }) {
  if (items.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: 100,
      width: '200px',
      height: '200px',
    }}>
      {items.map((item, index) => (
        <FloatText key={item.id} text={item.text} color={item.color} index={index} />
      ))}
    </div>
  );
}

function FloatText({ text, color, index }: { text: string; color: string; index: number }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Каждый элемент немного смещён по горизонтали
  const offsetX = (index % 3 - 1) * 30;

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: `translate(calc(-50% + ${offsetX}px), ${animate ? '-80px' : '0px'})`,
      opacity: animate ? 0 : 1,
      fontSize: '18px',
      fontWeight: 800,
      color,
      textShadow: `0 0 12px ${color}60`,
      transition: 'all 1.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    }}>
      {text}
    </div>
  );
}