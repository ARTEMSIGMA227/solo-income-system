'use client';

interface HunterAvatarProps {
  level: number;
  title: string;
}

// Персонаж меняется каждые несколько уровней
function getHunterAppearance(level: number) {
  if (level >= 50) {
    return {
      body: '👁️',
      armor: '🌟',
      weapon: '⚡',
      aura: '#f59e0b',
      auraGlow: '0 0 40px #f59e0b60, 0 0 80px #f59e0b30',
      bg: 'linear-gradient(180deg, #1a1a0f 0%, #0a0a0f 100%)',
      figure: [
        '        👑        ',
        '      ╔═👁️═╗      ',
        '    ╔═╩═══╩═╗    ',
        '   ║ ████████ ║   ',
        '   ║ ████████ ║   ',
        '   ╠═╗      ╔═╣   ',
        '   ║⚡║      ║⚡║   ',
        '   ╚═╝      ╚═╝   ',
        '     ║ ████ ║     ',
        '     ║ ████ ║     ',
        '     ╚══╗╔══╝     ',
        '      ▓▓║║▓▓      ',
      ],
      colorScheme: { primary: '#f59e0b', secondary: '#fbbf24', accent: '#92400e' },
    };
  }
  if (level >= 30) {
    return {
      body: '⚡',
      armor: '💎',
      weapon: '🗡️',
      aura: '#7c3aed',
      auraGlow: '0 0 30px #7c3aed50, 0 0 60px #7c3aed20',
      bg: 'linear-gradient(180deg, #150f1f 0%, #0a0a0f 100%)',
      colorScheme: { primary: '#7c3aed', secondary: '#a78bfa', accent: '#4c1d95' },
    };
  }
  if (level >= 20) {
    return {
      body: '👑',
      armor: '🛡️',
      weapon: '⚔️',
      aura: '#3b82f6',
      auraGlow: '0 0 25px #3b82f640, 0 0 50px #3b82f620',
      bg: 'linear-gradient(180deg, #0f1520 0%, #0a0a0f 100%)',
      colorScheme: { primary: '#3b82f6', secondary: '#60a5fa', accent: '#1e3a5f' },
    };
  }
  if (level >= 12) {
    return {
      body: '🔥',
      armor: '⚔️',
      weapon: '🏹',
      aura: '#ef4444',
      auraGlow: '0 0 20px #ef444430, 0 0 40px #ef444415',
      bg: 'linear-gradient(180deg, #1a0f0f 0%, #0a0a0f 100%)',
      colorScheme: { primary: '#ef4444', secondary: '#f87171', accent: '#7f1d1d' },
    };
  }
  if (level >= 5) {
    return {
      body: '🏹',
      armor: '🗡️',
      weapon: '🛡️',
      aura: '#22c55e',
      auraGlow: '0 0 15px #22c55e25',
      bg: 'linear-gradient(180deg, #0f1a0f 0%, #0a0a0f 100%)',
      colorScheme: { primary: '#22c55e', secondary: '#4ade80', accent: '#14532d' },
    };
  }
  if (level >= 3) {
    return {
      body: '🗡️',
      armor: '',
      weapon: '',
      aura: '#94a3b8',
      auraGlow: '0 0 10px #94a3b815',
      bg: 'linear-gradient(180deg, #111118 0%, #0a0a0f 100%)',
      colorScheme: { primary: '#94a3b8', secondary: '#cbd5e1', accent: '#334155' },
    };
  }
  return {
    body: '💀',
    armor: '',
    weapon: '',
    aura: '#475569',
    auraGlow: 'none',
    bg: 'linear-gradient(180deg, #0d0d12 0%, #0a0a0f 100%)',
    colorScheme: { primary: '#475569', secondary: '#64748b', accent: '#1e293b' },
  };
}

function getArmorParts(level: number) {
  const parts = [];

  // Шлем
  if (level >= 20) parts.push({ name: 'Шлем Монарха', icon: '👑', slot: 'head' });
  else if (level >= 12) parts.push({ name: 'Шлем Рыцаря', icon: '⛑️', slot: 'head' });
  else if (level >= 5) parts.push({ name: 'Капюшон', icon: '🎭', slot: 'head' });

  // Оружие
  if (level >= 30) parts.push({ name: 'Клинок Теней', icon: '⚡', slot: 'weapon' });
  else if (level >= 20) parts.push({ name: 'Меч Короля', icon: '⚔️', slot: 'weapon' });
  else if (level >= 8) parts.push({ name: 'Длинный меч', icon: '🗡️', slot: 'weapon' });
  else if (level >= 3) parts.push({ name: 'Кинжал', icon: '🔪', slot: 'weapon' });

  // Броня
  if (level >= 25) parts.push({ name: 'Доспех Архитектора', icon: '🛡️', slot: 'armor' });
  else if (level >= 16) parts.push({ name: 'Латы', icon: '🦺', slot: 'armor' });
  else if (level >= 8) parts.push({ name: 'Кольчуга', icon: '🧥', slot: 'armor' });

  // Аксессуар
  if (level >= 40) parts.push({ name: 'Корона Магната', icon: '👑', slot: 'accessory' });
  else if (level >= 15) parts.push({ name: 'Амулет силы', icon: '📿', slot: 'accessory' });

  return parts;
}

export default function HunterAvatar({ level, title }: HunterAvatarProps) {
  const appearance = getHunterAppearance(level);
  const armor = getArmorParts(level);
  const { colorScheme } = appearance;

  // Размер персонажа растёт с уровнем
  const figureSize = Math.min(80 + level * 2, 140);

  return (
    <div style={{
      background: appearance.bg,
      borderRadius: '16px',
      padding: '20px',
      border: `1px solid ${colorScheme.accent}`,
      boxShadow: appearance.auraGlow,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Аура */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${figureSize + 40}px`,
        height: `${figureSize + 40}px`,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${appearance.aura}15 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Персонаж */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Основная фигура */}
        <div style={{
          fontSize: `${figureSize}px`,
          lineHeight: 1,
          marginBottom: '8px',
          filter: level >= 30 ? 'drop-shadow(0 0 10px ' + appearance.aura + ')' : 'none',
        }}>
          {appearance.body}
        </div>

        {/* Титул */}
        <div style={{
          fontSize: '11px',
          color: colorScheme.primary,
          textTransform: 'uppercase',
          letterSpacing: '2px',
          fontWeight: 700,
          marginBottom: '12px',
        }}>
          {title}
        </div>

        {/* Экипировка */}
        {armor.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '6px',
            flexWrap: 'wrap',
          }}>
            {armor.map((part, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                backgroundColor: colorScheme.accent + '40',
                borderRadius: '12px',
                border: `1px solid ${colorScheme.accent}`,
                fontSize: '11px',
                color: colorScheme.secondary,
              }}>
                <span>{part.icon}</span>
                <span>{part.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}