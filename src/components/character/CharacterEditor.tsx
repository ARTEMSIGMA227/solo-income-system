'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { CharacterConfig, LevelImages } from '@/types/database';

interface CharacterEditorProps {
  userId: string;
  config: CharacterConfig | null;
  onSave: (config: CharacterConfig) => void;
  onClose: () => void;
}

const LEVEL_TIERS = [
  { key: 'novice' as const, label: 'Новичок', levels: 'LV 1-4', rank: 'E', color: '#475569' },
  { key: 'hunter' as const, label: 'Охотник', levels: 'LV 5-11', rank: 'C', color: '#22c55e' },
  { key: 'warrior' as const, label: 'Воин', levels: 'LV 12-19', rank: 'B', color: '#ef4444' },
  { key: 'knight' as const, label: 'Рыцарь', levels: 'LV 20-29', rank: 'A', color: '#3b82f6' },
  { key: 'srank' as const, label: 'S-ранг', levels: 'LV 30-39', rank: 'S', color: '#7c3aed' },
  { key: 'monarch' as const, label: 'Монарх', levels: 'LV 40+', rank: 'SS', color: '#f59e0b' },
];

const BODY_TYPES = [
  { value: 'male_1', label: '👤 Мужской' },
  { value: 'female_1', label: '👩 Женский' },
];

export default function CharacterEditor({ userId, config, onSave, onClose }: CharacterEditorProps) {
  const [tab, setTab] = useState<'single' | 'levels'>('single');
  const [singleImage, setSingleImage] = useState(config?.custom_image_url || '');
  const [levelImages, setLevelImages] = useState<LevelImages>(config?.level_images || {});
  const [bodyType, setBodyType] = useState(config?.body_type || 'male_1');
  const [saving, setSaving] = useState(false);

  function updateLevelImage(key: keyof LevelImages, url: string) {
    setLevelImages(prev => ({ ...prev, [key]: url }));
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const useSingle = tab === 'single' && singleImage;

    const data = {
      user_id: userId,
      use_custom_image: !!useSingle,
      custom_image_url: useSingle ? singleImage : null,
      body_type: bodyType,
      skin_color: config?.skin_color || '#f5d0a9',
      hair_style: config?.hair_style || 'spiky',
      hair_color: config?.hair_color || '#1a1a2e',
      eye_color: config?.eye_color || '#3b82f6',
      outfit_color: config?.outfit_color || '#7c3aed',
      level_images: tab === 'levels' ? levelImages : (config?.level_images || {}),
      updated_at: new Date().toISOString(),
    };

    if (config) {
      await supabase.from('character_config').update(data).eq('user_id', userId);
    } else {
      await supabase.from('character_config').insert(data);
    }

    setSaving(false);
    toast.success('Персонаж сохранён! ⚔️');
    onSave({ ...data, id: config?.id || '', created_at: config?.created_at || '' } as CharacterConfig);
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#0a0a0f', borderRadius: '20px', border: '1px solid #1e1e2e',
        padding: '24px', width: '100%', maxWidth: '450px', maxHeight: '85vh',
        overflowY: 'auto',
      }}>
        {/* Шапка */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>⚔️ Персонаж</h2>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', backgroundColor: '#16161f', border: '1px solid #1e1e2e',
            borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Тип тела */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Тип персонажа</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {BODY_TYPES.map(bt => (
              <button key={bt.value} onClick={() => setBodyType(bt.value)} style={{
                flex: 1, padding: '10px', borderRadius: '8px',
                backgroundColor: bodyType === bt.value ? '#7c3aed20' : '#16161f',
                border: `1px solid ${bodyType === bt.value ? '#7c3aed' : '#1e1e2e'}`,
                color: '#e2e8f0', cursor: 'pointer', fontSize: '14px',
              }}>
                {bt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Табы: одна картинка / по уровням */}
        <div style={{
          display: 'flex', marginBottom: '20px', backgroundColor: '#16161f',
          borderRadius: '8px', padding: '4px',
        }}>
          <button onClick={() => setTab('single')} style={{
            flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
            cursor: 'pointer', fontSize: '12px', fontWeight: 500,
            backgroundColor: tab === 'single' ? '#7c3aed' : 'transparent',
            color: tab === 'single' ? '#fff' : '#94a3b8',
          }}>
            🖼️ Одна картинка
          </button>
          <button onClick={() => setTab('levels')} style={{
            flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
            cursor: 'pointer', fontSize: '12px', fontWeight: 500,
            backgroundColor: tab === 'levels' ? '#7c3aed' : 'transparent',
            color: tab === 'levels' ? '#fff' : '#94a3b8',
          }}>
            ⚔️ По уровням (6 шт)
          </button>
        </div>

        {tab === 'single' ? (
          <div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
              Ссылка на картинку
            </div>
            <input
              type="text"
              value={singleImage}
              onChange={(e) => setSingleImage(e.target.value)}
              placeholder="https://i.imgur.com/xxxxx.png"
              style={{
                width: '100%', padding: '12px', backgroundColor: '#16161f',
                border: '1px solid #1e1e2e', borderRadius: '8px', color: '#e2e8f0',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              }}
            />
            {singleImage && (
              <div style={{
                width: '150px', height: '180px', margin: '12px auto 0',
                borderRadius: '12px', overflow: 'hidden', border: '2px solid #7c3aed40',
              }}>
                <img src={singleImage} alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px', textAlign: 'center' }}>
              Эта картинка будет использоваться для всех уровней
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
              Загрузи разные картинки для каждого этапа прокачки.
              Персонаж будет меняться с ростом уровня!
            </div>
            {LEVEL_TIERS.map((tier) => (
              <div key={tier.key} style={{
                marginBottom: '12px', padding: '12px', backgroundColor: '#16161f',
                borderRadius: '10px', border: `1px solid ${tier.color}20`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                    fontWeight: 800, backgroundColor: tier.color + '20', color: tier.color,
                  }}>
                    {tier.rank}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{tier.label}</span>
                  <span style={{ fontSize: '11px', color: '#475569' }}>{tier.levels}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={levelImages[tier.key] || ''}
                    onChange={(e) => updateLevelImage(tier.key, e.target.value)}
                    placeholder="https://i.imgur.com/..."
                    style={{
                      flex: 1, padding: '8px', backgroundColor: '#0a0a0f',
                      border: '1px solid #1e1e2e', borderRadius: '6px', color: '#e2e8f0',
                      fontSize: '12px', outline: 'none',
                    }}
                  />
                  {levelImages[tier.key] && (
                    <div style={{
                      width: '40px', height: '50px', borderRadius: '6px',
                      overflow: 'hidden', border: `1px solid ${tier.color}30`, flexShrink: 0,
                    }}>
                      <img src={levelImages[tier.key]} alt={tier.label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Сохранить */}
        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', padding: '14px', marginTop: '20px',
          backgroundColor: saving ? '#4c1d95' : '#7c3aed',
          color: '#fff', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
        }}>
          {saving ? '⏳ Сохраняю...' : '✅ Сохранить'}
        </button>

        {/* Инструкция */}
        <div style={{
          marginTop: '16px', padding: '12px', backgroundColor: '#16161f',
          borderRadius: '8px', fontSize: '11px', color: '#475569', lineHeight: 1.6,
        }}>
          💡 <strong style={{ color: '#94a3b8' }}>Как добавить картинку:</strong><br />
          1. Сгенерируй на leonardo.ai или bing.com/create<br />
          2. Сохрани картинку<br />
          3. Загрузи на imgur.com → Copy image link<br />
          4. Вставь ссылку сюда
        </div>
      </div>
    </div>
  );
}