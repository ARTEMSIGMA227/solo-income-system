'use client';

import { useState } from 'react';
import type { CharacterConfig } from '@/types/database';

interface HunterAvatarProps {
  level: number;
  title: string;
  config: CharacterConfig | null;
  onEdit?: () => void;
}

function getEquipment(level: number) {
  const items: { name: string; icon: string; slot: string }[] = [];

  // Оружие
  if (level >= 40) items.push({ name: 'Клинок Монарха', icon: '⚡', slot: 'weapon' });
  else if (level >= 30) items.push({ name: 'Теневой Меч', icon: '🗡️', slot: 'weapon' });
  else if (level >= 20) items.push({ name: 'Королевский Клинок', icon: '⚔️', slot: 'weapon' });
  else if (level >= 12) items.push({ name: 'Огненный Меч', icon: '🔥', slot: 'weapon' });
  else if (level >= 8) items.push({ name: 'Длинный Лук', icon: '🏹', slot: 'weapon' });
  else if (level >= 5) items.push({ name: 'Стальной Меч', icon: '🗡️', slot: 'weapon' });
  else if (level >= 3) items.push({ name: 'Кинжал', icon: '🔪', slot: 'weapon' });

  // Шлем
  if (level >= 30) items.push({ name: 'Корона Теней', icon: '👑', slot: 'head' });
  else if (level >= 20) items.push({ name: 'Шлем Рыцаря', icon: '⛑️', slot: 'head' });
  else if (level >= 12) items.push({ name: 'Маска Охотника', icon: '🎭', slot: 'head' });

  // Броня
  if (level >= 25) items.push({ name: 'Доспех Архитектора', icon: '🛡️', slot: 'armor' });
  else if (level >= 16) items.push({ name: 'Мифриловые Латы', icon: '🦺', slot: 'armor' });
  else if (level >= 8) items.push({ name: 'Кольчуга', icon: '🧥', slot: 'armor' });

  // Аксессуар
  if (level >= 40) items.push({ name: 'Печать Магната', icon: '💎', slot: 'accessory' });
  else if (level >= 20) items.push({ name: 'Амулет Силы', icon: '📿', slot: 'accessory' });
  else if (level >= 10) items.push({ name: 'Кольцо XP', icon: '💍', slot: 'accessory' });

  return items;
}

function getAuraStyle(level: number) {
  if (level >= 50) return { color: '#f59e0b', glow: '0 0 60px #f59e0b40, 0 0 120px #f59e0b20', particles: '✨' };
  if (level >= 40) return { color: '#ef4444', glow: '0 0 50px #ef444430, 0 0 100px #ef444415', particles: '🔥' };
  if (level >= 30) return { color: '#7c3aed', glow: '0 0 40px #7c3aed30, 0 0 80px #7c3aed15', particles: '⚡' };
  if (level >= 20) return { color: '#3b82f6', glow: '0 0 30px #3b82f625, 0 0 60px #3b82f610', particles: '💠' };
  if (level >= 12) return { color: '#ef4444', glow: '0 0 20px #ef444420', particles: '🔥' };
  if (level >= 5) return { color: '#22c55e', glow: '0 0 15px #22c55e15', particles: '' };
  return { color: '#475569', glow: 'none', particles: '' };
}

function getBodySVG(config: CharacterConfig | null, level: number) {
  const c = config || {
    body_type: 'male_1', skin_color: '#f5d0a9', hair_style: 'spiky',
    hair_color: '#1a1a2e', eye_color: '#3b82f6', outfit_color: '#7c3aed',
  };

  // Цвет брони меняется с уровнем
  let armorColor = c.outfit_color;
  if (level >= 40) armorColor = '#f59e0b';
  else if (level >= 30) armorColor = '#7c3aed';
  else if (level >= 20) armorColor = '#3b82f6';
  else if (level >= 12) armorColor = '#ef4444';

  const hairStyles: Record<string, string> = {
    spiky: 'M50,25 L40,10 L45,20 L35,5 L50,18 L55,3 L55,18 L65,5 L60,20 L70,10 L55,25 Z',
    long: 'M30,25 Q30,15 50,10 Q70,15 70,25 L70,50 Q70,55 65,55 L35,55 Q30,55 30,50 Z',
    short: 'M35,25 Q35,12 50,10 Q65,12 65,25 L65,30 L35,30 Z',
    mohawk: 'M47,25 L45,5 L50,15 L50,0 L55,15 L55,5 L53,25 Z',
    bald: '',
  };

  const isFemale = c.body_type.startsWith('female');

  return (
    <svg viewBox="0 0 100 160" style={{ width: '100%', maxWidth: '200px', height: 'auto' }}>
      {/* Волосы (сзади для long) */}
      {c.hair_style === 'long' && (
        <path d="M30,25 L25,70 Q25,75 30,75 L70,75 Q75,75 75,70 L70,25 Z"
          fill={c.hair_color} opacity="0.5" />
      )}

      {/* Тело */}
      {isFemale ? (
        <>
          {/* Женское тело */}
          <ellipse cx="50" cy="90" rx="22" ry="25" fill={armorColor} />
          <ellipse cx="50" cy="85" rx="20" ry="15" fill={armorColor} />
          {/* Юбка/низ */}
          <path d="M30,105 L25,145 L40,140 L50,150 L60,140 L75,145 L70,105 Z"
            fill={armorColor} opacity="0.8" />
        </>
      ) : (
        <>
          {/* Мужское тело */}
          <rect x="35" y="75" width="30" height="35" rx="5" fill={armorColor} />
          {/* Плечи */}
          <rect x="25" y="75" width="50" height="12" rx="6" fill={armorColor} />
          {/* Ноги */}
          <rect x="37" y="110" width="10" height="35" rx="3" fill={armorColor} opacity="0.8" />
          <rect x="53" y="110" width="10" height="35" rx="3" fill={armorColor} opacity="0.8" />
        </>
      )}

      {/* Руки */}
      <rect x="22" y="78" width="8" height="30" rx="4" fill={c.skin_color} />
      <rect x="70" y="78" width="8" height="30" rx="4" fill={c.skin_color} />

      {/* Голова */}
      <circle cx="50" cy="40" r="20" fill={c.skin_color} />

      {/* Волосы */}
      {c.hair_style !== 'bald' && (
        <path d={hairStyles[c.hair_style] || hairStyles.spiky} fill={c.hair_color} />
      )}

      {/* Глаза */}
      <ellipse cx="43" cy="40" rx="3" ry="3.5" fill="white" />
      <ellipse cx="57" cy="40" rx="3" ry="3.5" fill="white" />
      <circle cx="43" cy="40" r="2" fill={c.eye_color} />
      <circle cx="57" cy="40" r="2" fill={c.eye_color} />
      <circle cx="43.5" cy="39.5" r="0.8" fill="white" />
      <circle cx="57.5" cy="39.5" r="0.8" fill="white" />

      {/* Рот */}
      <path d="M45,48 Q50,52 55,48" stroke={c.skin_color} strokeWidth="0.5"
        fill="none" opacity="0.5" />

      {/* Детали брони для высоких уровней */}
      {level >= 8 && (
        <line x1="50" y1="78" x2="50" y2="108" stroke="#ffffff20" strokeWidth="2" />
      )}
      {level >= 16 && (
        <>
          <circle cx="50" cy="82" r="3" fill="#ffffff30" />
          <rect x="28" y="75" width="44" height="2" rx="1" fill="#ffffff15" />
        </>
      )}
      {level >= 25 && (
        <>
          <path d="M35,75 L30,70 L25,75" fill={armorColor} stroke="#ffffff30" strokeWidth="0.5" />
          <path d="M65,75 L70,70 L75,75" fill={armorColor} stroke="#ffffff30" strokeWidth="0.5" />
        </>
      )}

      {/* Ботинки */}
      <ellipse cx="42" cy="147" rx="7" ry="4"
        fill={level >= 20 ? armorColor : '#1a1a2e'} />
      <ellipse cx="58" cy="147" rx="7" ry="4"
        fill={level >= 20 ? armorColor : '#1a1a2e'} />
    </svg>
  );
}

export default function HunterAvatar({ level, title, config, onEdit }: HunterAvatarProps) {
  const equipment = getEquipment(level);
  const aura = getAuraStyle(level);

  return (
    <div style={{
      backgroundColor: '#12121a',
      border: '1px solid #1e1e2e',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: aura.glow,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Кнопка редактирования */}
      {onEdit && (
        <button onClick={onEdit} style={{
          position: 'absolute', top: '12px', right: '12px', zIndex: 5,
          padding: '6px 12px', backgroundColor: '#16161f', border: '1px solid #1e1e2e',
          borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '12px',
        }}>
          ✏️ Изменить
        </button>
      )}

      {/* Аура фон */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '200px', height: '200px', borderRadius: '50%',
        background: `radial-gradient(circle, ${aura.color}15 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Частицы */}
      {aura.particles && (
        <div style={{
          position: 'absolute', top: '10px', right: '50px',
          fontSize: '16px', opacity: 0.5, pointerEvents: 'none',
        }}>
          {aura.particles} {aura.particles}
        </div>
      )}

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Персонаж */}
        {config?.use_custom_image && config.custom_image_url ? (
          <div style={{
            width: '150px', height: '150px', margin: '0 auto 12px',
            borderRadius: '16px', overflow: 'hidden',
            border: `2px solid ${aura.color}40`,
          }}>
            <img
              src={config.custom_image_url}
              alt="Персонаж"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div style={{ maxWidth: '150px', margin: '0 auto 8px' }}>
            {getBodySVG(config, level)}
          </div>
        )}

        {/* Титул */}
        <div style={{
          fontSize: '11px', color: aura.color,
          textTransform: 'uppercase', letterSpacing: '2px',
          fontWeight: 700, marginBottom: '8px',
        }}>
          {title}
        </div>

        {/* Экипировка */}
        {equipment.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'center',
            gap: '4px', flexWrap: 'wrap',
          }}>
            {equipment.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '3px',
                padding: '3px 8px', backgroundColor: '#16161f',
                borderRadius: '10px', border: '1px solid #1e1e2e',
                fontSize: '10px', color: '#94a3b8',
              }}>
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}