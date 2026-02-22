'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';
import type { CharacterConfig, LevelImages } from '@/types/database';

interface CharacterEditorProps {
  userId: string;
  config: CharacterConfig | null;
  onSave: (config: CharacterConfig) => void;
  onClose: () => void;
}

export default function CharacterEditor({ userId, config, onSave, onClose }: CharacterEditorProps) {
  const { t } = useT();
  const ed = t.character.editor;

  const [tab, setTab] = useState<'single' | 'levels'>('single');
  const [singleImage, setSingleImage] = useState(config?.custom_image_url || '');
  const [levelImages, setLevelImages] = useState<LevelImages>(config?.level_images || {});
  const [bodyType, setBodyType] = useState(config?.body_type || 'male_1');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string>('single');

  const LEVEL_TIERS = [
    { key: 'novice' as const, label: t.character.tiers.novice, levels: 'LV 1-4', rank: 'E', color: '#475569' },
    { key: 'hunter' as const, label: t.character.tiers.hunter, levels: 'LV 5-11', rank: 'C', color: '#22c55e' },
    { key: 'warrior' as const, label: t.character.tiers.warrior, levels: 'LV 12-19', rank: 'B', color: '#ef4444' },
    { key: 'knight' as const, label: t.character.tiers.knight, levels: 'LV 20-29', rank: 'A', color: '#3b82f6' },
    { key: 'srank' as const, label: t.character.tiers.srank, levels: 'LV 30-39', rank: 'S', color: '#7c3aed' },
    { key: 'monarch' as const, label: t.character.tiers.monarch, levels: 'LV 40+', rank: 'SS', color: '#f59e0b' },
  ];

  async function uploadImage(file: File, target: string) {
    setUploading(target);
    const supabase = createClient();

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${target}_${Date.now()}.${fileExt}`;

    const { data: oldFiles } = await supabase.storage
      .from('avatars')
      .list(userId, { search: target });

    if (oldFiles && oldFiles.length > 0) {
      const toDelete = oldFiles
        .filter(f => f.name.startsWith(target))
        .map(f => `${userId}/${f.name}`);
      if (toDelete.length > 0) {
        await supabase.storage.from('avatars').remove(toDelete);
      }
    }

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (error) {
      toast.error(ed.uploadError + error.message);
      setUploading(null);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    setUploading(null);
    return urlData.publicUrl;
  }

  function triggerFileUpload(target: string) {
    setUploadTarget(target);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(ed.fileTooLarge);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error(ed.onlyImages);
      return;
    }

    const url = await uploadImage(file, uploadTarget);
    if (!url) return;

    if (uploadTarget === 'single') {
      setSingleImage(url);
    } else {
      setLevelImages(prev => ({ ...prev, [uploadTarget]: url }));
    }

    toast.success(ed.imageUploaded);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

    if (config?.id) {
      await supabase.from('character_config').update(data).eq('user_id', userId);
    } else {
      await supabase.from('character_config').insert(data);
    }

    setSaving(false);
    toast.success(ed.saved);
    onSave({ ...data, id: config?.id || '', created_at: config?.created_at || '' } as CharacterConfig);
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div style={{
        backgroundColor: '#0a0a0f', borderRadius: '20px', border: '1px solid #1e1e2e',
        padding: '24px', width: '100%', maxWidth: '450px', maxHeight: '85vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{ed.title}</h2>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', backgroundColor: '#16161f', border: '1px solid #1e1e2e',
            borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Body type */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>{ed.bodyType}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { value: 'male_1', label: ed.male },
              { value: 'female_1', label: ed.female },
            ].map(bt => (
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

        {/* Tabs */}
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
            {ed.singleTab}
          </button>
          <button onClick={() => setTab('levels')} style={{
            flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
            cursor: 'pointer', fontSize: '12px', fontWeight: 500,
            backgroundColor: tab === 'levels' ? '#7c3aed' : 'transparent',
            color: tab === 'levels' ? '#fff' : '#94a3b8',
          }}>
            {ed.levelsTab}
          </button>
        </div>

        {tab === 'single' ? (
          <div>
            {/* Preview */}
            <div style={{
              width: '160px', height: '200px', margin: '0 auto 16px',
              borderRadius: '16px', overflow: 'hidden',
              border: '2px dashed #1e1e2e', backgroundColor: '#16161f',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', cursor: 'pointer',
            }}
              onClick={() => triggerFileUpload('single')}
            >
              {singleImage ? (
                <img src={singleImage} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>📷</div>
                  <div style={{ fontSize: '12px', color: '#475569', textAlign: 'center', padding: '0 8px' }}>
                    {ed.clickToUpload}
                  </div>
                </>
              )}
            </div>

            {/* Buttons */}
            <button
              onClick={() => triggerFileUpload('single')}
              disabled={uploading === 'single'}
              style={{
                width: '100%', padding: '12px',
                backgroundColor: '#16161f', border: '1px solid #1e1e2e',
                borderRadius: '10px', color: '#e2e8f0', cursor: 'pointer',
                fontSize: '14px', marginBottom: '8px',
              }}
            >
              {uploading === 'single' ? ed.uploading : ed.uploadFromDevice}
            </button>

            {singleImage && (
              <button
                onClick={() => setSingleImage('')}
                style={{
                  width: '100%', padding: '10px',
                  backgroundColor: 'transparent', border: '1px solid #ef444430',
                  borderRadius: '10px', color: '#ef4444', cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {ed.deleteImage}
              </button>
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
              {ed.levelsHint}
            </div>

            {LEVEL_TIERS.map((tier) => (
              <div key={tier.key} style={{
                marginBottom: '10px', padding: '12px', backgroundColor: '#16161f',
                borderRadius: '10px', border: `1px solid ${tier.color}20`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                      fontWeight: 800, backgroundColor: tier.color + '20', color: tier.color,
                    }}>
                      {tier.rank}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{tier.label}</span>
                    <span style={{ fontSize: '11px', color: '#475569' }}>{tier.levels}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* Preview */}
                  <div
                    onClick={() => triggerFileUpload(tier.key)}
                    style={{
                      width: '50px', height: '60px', borderRadius: '8px',
                      overflow: 'hidden', border: `1px dashed ${tier.color}30`,
                      backgroundColor: '#0a0a0f', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {levelImages[tier.key] ? (
                      <img src={levelImages[tier.key]} alt={tier.label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '16px', opacity: 0.3 }}>+</span>
                    )}
                  </div>

                  {/* Upload button */}
                  <button
                    onClick={() => triggerFileUpload(tier.key)}
                    disabled={uploading === tier.key}
                    style={{
                      flex: 1, padding: '10px',
                      backgroundColor: '#0a0a0f', border: `1px solid ${tier.color}20`,
                      borderRadius: '8px', color: '#94a3b8', cursor: 'pointer',
                      fontSize: '12px', textAlign: 'center',
                    }}
                  >
                    {uploading === tier.key ? '⏳...' : levelImages[tier.key] ? ed.replace : ed.upload}
                  </button>

                  {/* Delete */}
                  {levelImages[tier.key] && (
                    <button
                      onClick={() => setLevelImages(prev => {
                        const next = { ...prev };
                        delete next[tier.key];
                        return next;
                      })}
                      style={{
                        width: '36px', height: '36px',
                        backgroundColor: '#0a0a0f', border: '1px solid #ef444420',
                        borderRadius: '8px', color: '#ef4444', cursor: 'pointer',
                        fontSize: '12px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save */}
        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', padding: '14px', marginTop: '20px',
          backgroundColor: saving ? '#4c1d95' : '#7c3aed',
          color: '#fff', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
        }}>
          {saving ? t.common.saving : ed.save}
        </button>
      </div>
    </div>
  );
}