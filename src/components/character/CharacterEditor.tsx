'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { CharacterConfig } from '@/types/database';

interface CharacterEditorProps {
  userId: string;
  config: CharacterConfig | null;
  onSave: (config: CharacterConfig) => void;
  onClose: () => void;
}

const BODY_TYPES = [
  { value: 'male_1', label: '👤 Мужской' },
  { value: 'female_1', label: '👩 Женский' },
];

const HAIR_STYLES = [
  { value: 'spiky', label: 'Острые' },
  { value: 'long', label: 'Длинные' },
  { value: 'short', label: 'Короткие' },
  { value: 'mohawk', label: 'Ирокез' },
  { value: 'bald', label: 'Без волос' },
];

const SKIN_COLORS = ['#f5d0a9', '#e8b88a', '#d4956b', '#a0714f', '#6b4423', '#f9e0c8'];
const HAIR_COLORS = ['#1a1a2e', '#4a2511', '#8b4513', '#daa520', '#c0c0c0', '#ff4444', '#7c3aed', '#3b82f6', '#22c55e'];
const EYE_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#7c3aed', '#475569', '#000000'];
const OUTFIT_COLORS = ['#7c3aed', '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#ec4899', '#1a1a2e', '#475569'];

export default function CharacterEditor({ userId, config, onSave, onClose }: CharacterEditorProps) {
  const [useCustomImage, setUseCustomImage] = useState(config?.use_custom_image || false);
  const [imageUrl, setImageUrl] = useState(config?.custom_image_url || '');
  const [bodyType, setBodyType] = useState(config?.body_type || 'male_1');
  const [skinColor, setSkinColor] = useState(config?.skin_color || '#f5d0a9');
  const [hairStyle, setHairStyle] = useState(config?.hair_style || 'spiky');
  const [hairColor, setHairColor] = useState(config?.hair_color || '#1a1a2e');
  const [eyeColor, setEyeColor] = useState(config?.eye_color || '#3b82f6');
  const [outfitColor, setOutfitColor] = useState(config?.outfit_color || '#7c3aed');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const data = {
      user_id: userId,
      use_custom_image: useCustomImage,
      custom_image_url: useCustomImage ? imageUrl : null,
      body_type: bodyType,
      skin_color: skinColor,
      hair_style: hairStyle,
      hair_color: hairColor,
      eye_color: eyeColor,
      outfit_color: outfitColor,
      updated_at: new Date().toISOString(),
    };

    if (config) {
      await supabase.from('character_config').update(data).eq('user_id', userId);
    } else {
      await supabase.from('character_config').insert(data);
    }

    setSaving(false);
    toast.success('Персонаж сохранён!');
    onSave({ ...data, id: config?.id || '', created_at: config?.created_at || '' } as CharacterConfig);
  }

  function ColorPicker({ colors, value, onChange, label }: {
    colors: string[]; value: string; onChange: (c: string) => void; label: string;
  }) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>{label}</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {colors.map(c => (
            <button key={c} onClick={() => onChange(c)} style={{
              width: '32px', height: '32px', borderRadius: '8px',
              backgroundColor: c, border: value === c ? '3px solid #fff' : '2px solid #1e1e2e',
              cursor: 'pointer', transition: 'transform 0.1s',
              transform: value === c ? 'scale(1.15)' : 'scale(1)',
            }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#0a0a0f', borderRadius: '16px', border: '1px solid #1e1e2e',
        padding: '24px', width: '100%', maxWidth: '450px', maxHeight: '85vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>✏️ Редактор персонажа</h2>
          <button onClick={onClose} style={{
            padding: '6px 12px', backgroundColor: '#16161f', border: '1px solid #1e1e2e',
            borderRadius: '8px', color: '#94a3b8', cursor: 'pointer',
          }}>✕</button>
        </div>

        {/* Переключатель: конструктор / своя картинка */}
        <div style={{
          display: 'flex', marginBottom: '20px', backgroundColor: '#16161f',
          borderRadius: '8px', padding: '4px',
        }}>
          <button onClick={() => setUseCustomImage(false)} style={{
            flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
            cursor: 'pointer', fontSize: '13px', fontWeight: 500,
            backgroundColor: !useCustomImage ? '#7c3aed' : 'transparent',
            color: !useCustomImage ? '#fff' : '#94a3b8',
          }}>
            🎨 Конструктор
          </button>
          <button onClick={() => setUseCustomImage(true)} style={{
            flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
            cursor: 'pointer', fontSize: '13px', fontWeight: 500,
            backgroundColor: useCustomImage ? '#7c3aed' : 'transparent',
            color: useCustomImage ? '#fff' : '#94a3b8',
          }}>
            🖼️ Своя картинка
          </button>
        </div>

        {useCustomImage ? (
          <div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
              Ссылка на картинку (URL)
            </div>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/my-avatar.png"
              style={{
                width: '100%', padding: '12px', backgroundColor: '#16161f',
                border: '1px solid #1e1e2e', borderRadius: '8px', color: '#e2e8f0',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                marginBottom: '12px',
              }}
            />
            {imageUrl && (
              <div style={{
                width: '120px', height: '120px', margin: '0 auto',
                borderRadius: '12px', overflow: 'hidden', border: '2px solid #1e1e2e',
              }}>
                <img src={imageUrl} alt="Preview" style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                }} />
              </div>
            )}
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px', textAlign: 'center' }}>
              Совет: загрузи картинку на imgur.com и вставь ссылку
            </div>
          </div>
        ) : (
          <div>
            {/* Тип тела */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Тип тела</div>
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

            <ColorPicker colors={SKIN_COLORS} value={skinColor} onChange={setSkinColor} label="Цвет кожи" />

            {/* Причёска */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Причёска</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {HAIR_STYLES.map(hs => (
                  <button key={hs.value} onClick={() => setHairStyle(hs.value)} style={{
                    padding: '6px 12px', borderRadius: '8px',
                    backgroundColor: hairStyle === hs.value ? '#7c3aed20' : '#16161f',
                    border: `1px solid ${hairStyle === hs.value ? '#7c3aed' : '#1e1e2e'}`,
                    color: '#e2e8f0', cursor: 'pointer', fontSize: '12px',
                  }}>
                    {hs.label}
                  </button>
                ))}
              </div>
            </div>

            <ColorPicker colors={HAIR_COLORS} value={hairColor} onChange={setHairColor} label="Цвет волос" />
            <ColorPicker colors={EYE_COLORS} value={eyeColor} onChange={setEyeColor} label="Цвет глаз" />
            <ColorPicker colors={OUTFIT_COLORS} value={outfitColor} onChange={setOutfitColor} label="Цвет одежды" />
          </div>
        )}

        {/* Кнопка сохранить */}
        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', padding: '14px', marginTop: '20px',
          backgroundColor: saving ? '#4c1d95' : '#7c3aed',
          color: '#fff', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
        }}>
          {saving ? '⏳ Сохраняю...' : '✅ Сохранить персонажа'}
        </button>
      </div>
    </div>
  );
}