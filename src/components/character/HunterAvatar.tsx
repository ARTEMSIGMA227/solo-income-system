'use client';

import type { CharacterConfig, LevelImages } from '@/types/database';

interface HunterAvatarProps {
  level: number;
  title: string;
  config: CharacterConfig | null;
  onEdit?: () => void;
}

// Дефолтные картинки (placeholder — замени на свои)
const DEFAULT_IMAGES: Record<string, string> = {
  novice: '',
  hunter: '',
  warrior: '',
  knight: '',
  srank: '',
  monarch: '',
};

function getLevelTier(level: number): { key: keyof LevelImages; name: string; rank: string } {
  if (level >= 40) return { key: 'monarch', name: 'Теневой Монарх', rank: 'SS' };
  if (level >= 30) return { key: 'srank', name: 'S-ранг Охотник', rank: 'S' };
  if (level >= 20) return { key: 'knight', name: 'Рыцарь', rank: 'A' };
  if (level >= 12) return { key: 'warrior', name: 'Воин', rank: 'B' };
  if (level >= 5) return { key: 'hunter', name: 'Охотник', rank: 'C' };
  return { key: 'novice', name: 'Новичок', rank: 'E' };
}

function getAuraStyle(level: number) {
  if (level >= 40) return {
    color: '#f59e0b', glow: '0 0 60px #f59e0b30, 0 0 120px #f59e0b15',
    border: '#f59e0b50', particles: ['✨', '⚡', '👑'], bg: '#1a1a0f',
  };
  if (level >= 30) return {
    color: '#7c3aed', glow: '0 0 50px #7c3aed30, 0 0 100px #7c3aed15',
    border: '#7c3aed50', particles: ['⚡', '🔮'], bg: '#150f1f',
  };
  if (level >= 20) return {
    color: '#3b82f6', glow: '0 0 40px #3b82f625, 0 0 80px #3b82f610',
    border: '#3b82f650', particles: ['💠', '⚔️'], bg: '#0f1520',
  };
  if (level >= 12) return {
    color: '#ef4444', glow: '0 0 30px #ef444420, 0 0 60px #ef444410',
    border: '#ef444450', particles: ['🔥'], bg: '#1a0f0f',
  };
  if (level >= 5) return {
    color: '#22c55e', glow: '0 0 20px #22c55e15',
    border: '#22c55e40', particles: [], bg: '#0f1a0f',
  };
  return {
    color: '#475569', glow: 'none',
    border: '#1e1e2e', particles: [], bg: '#0d0d12',
  };
}

function getEquipment(level: number) {
  const items: { name: string; icon: string }[] = [];
  if (level >= 40) items.push({ name: 'Клинок Монарха', icon: '⚡' });
  else if (level >= 30) items.push({ name: 'Теневой Меч', icon: '🗡️' });
  else if (level >= 20) items.push({ name: 'Королевский Клинок', icon: '⚔️' });
  else if (level >= 12) items.push({ name: 'Огненный Меч', icon: '🔥' });
  else if (level >= 5) items.push({ name: 'Стальной Меч', icon: '🗡️' });
  else if (level >= 3) items.push({ name: 'Кинжал', icon: '🔪' });

  if (level >= 25) items.push({ name: 'Доспех Архитектора', icon: '🛡️' });
  else if (level >= 16) items.push({ name: 'Латы', icon: '🦺' });
  else if (level >= 8) items.push({ name: 'Кольчуга', icon: '🧥' });

  if (level >= 30) items.push({ name: 'Корона Теней', icon: '👑' });
  if (level >= 20) items.push({ name: 'Амулет Силы', icon: '📿' });
  if (level >= 40) items.push({ name: 'Печать Магната', icon: '💎' });

  return items;
}

export default function HunterAvatar({ level, title, config, onEdit }: HunterAvatarProps) {
  const tier = getLevelTier(level);
  const aura = getAuraStyle(level);
  const equipment = getEquipment(level);

  // Определяем какую картинку показать
  const levelImages = config?.level_images || {};
  const customImage = config?.use_custom_image && config?.custom_image_url;
  const tierImage = levelImages[tier.key] || DEFAULT_IMAGES[tier.key];
  const imageToShow = customImage || tierImage;

  return (
    <div style={{
      backgroundColor: aura.bg,
      border: `1px solid ${aura.border}`,
      borderRadius: '20px',
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
          ✏️
        </button>
      )}

      {/* Ранг */}
      <div style={{
        position: 'absolute', top: '12px', left: '12px', zIndex: 5,
        padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800,
        backgroundColor: aura.color + '20', color: aura.color,
        border: `1px solid ${aura.color}40`,
      }}>
        {tier.rank}-ранг
      </div>

      {/* Частицы */}
      {aura.particles.length > 0 && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          pointerEvents: 'none', zIndex: 2, overflow: 'hidden',
        }}>
          {aura.particles.map((p, i) => (
            <span key={i} style={{
              position: 'absolute',
              top: `${15 + i * 25}%`,
              left: `${10 + i * 30}%`,
              fontSize: '14px',
              opacity: 0.4,
              animation: 'pulse 2s ease-in-out infinite',
              animationDelay: `${i * 0.5}s`,
            }}>
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Аура фон */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '250px', height: '250px', borderRadius: '50%',
        background: `radial-gradient(circle, ${aura.color}10 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 3 }}>
        {/* Картинка персонажа */}
        {imageToShow ? (
          <div style={{
            width: '180px', height: '220px', margin: '0 auto 12px',
            borderRadius: '16px', overflow: 'hidden',
            border: `2px solid ${aura.color}40`,
            boxShadow: `0 0 30px ${aura.color}20`,
          }}>
            <img
              src={imageToShow}
              alt="Персонаж"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          /* Placeholder если нет картинки */
          <div style={{
            width: '180px', height: '220px', margin: '0 auto 12px',
            borderRadius: '16px', overflow: 'hidden',
            border: `2px dashed ${aura.border}`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#16161f',
          }}>
            <div style={{ fontSize: '60px', marginBottom: '8px' }}>
              {level >= 40 ? '👁️' : level >= 30 ? '⚡' : level >= 20 ? '👑' :
               level >= 12 ? '🔥' : level >= 5 ? '🏹' : level >= 3 ? '🗡️' : '💀'}
            </div>
            <div style={{ fontSize: '11px', color: '#475569' }}>
              Нажми ✏️ чтобы добавить аватар
            </div>
          </div>
        )}

        {/* Титул */}
        <div style={{
          fontSize: '12px', color: aura.color,
          textTransform: 'uppercase', letterSpacing: '2px',
          fontWeight: 700, marginBottom: '10px',
          textShadow: level >= 20 ? `0 0 10px ${aura.color}` : 'none',
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
                borderRadius: '10px', border: `1px solid ${aura.color}20`,
                fontSize: '10px', color: '#94a3b8',
              }}>
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 0.6; transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}