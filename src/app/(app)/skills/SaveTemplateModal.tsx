'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Globe, Lock } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  emoji: string;
  checklist: { text: string; done: boolean }[];
}

interface SaveTemplateModalProps {
  open: boolean;
  onClose: () => void;
  skill: Skill;
  userId: string;
  locale: string;
}

export default function SaveTemplateModal({
  open,
  onClose,
  skill,
  userId,
  locale,
}: SaveTemplateModalProps) {
  const ru = locale === 'ru';
  const [name, setName] = useState(skill.name);
  const [nameRu, setNameRu] = useState('');
  const [description, setDescription] = useState(skill.description || '');
  const [descriptionRu, setDescriptionRu] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.from('templates').insert({
      user_id: userId,
      name: name.trim(),
      name_ru: nameRu.trim() || null,
      description: description.trim() || null,
      description_ru: descriptionRu.trim() || null,
      template_type: 'skill',
      template_data: {
        name: skill.name,
        emoji: skill.emoji,
        description: skill.description,
        goal: skill.goal,
        checklist: skill.checklist,
      },
      is_public: isPublic,
    });

    setSaving(false);
    if (error) {
      toast.error(ru ? 'Ошибка сохранения' : 'Save error');
      return;
    }

    toast.success(ru ? 'Шаблон сохранён!' : 'Template saved!');
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold">
            {ru ? 'Сохранить как шаблон' : 'Save as Template'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white text-xl">
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              {ru ? 'Название шаблона' : 'Template Name'}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              {ru ? 'Название (RU)' : 'Name (RU)'}
            </label>
            <input
              value={nameRu}
              onChange={(e) => setNameRu(e.target.value)}
              placeholder={ru ? 'Для русскоязычных пользователей' : 'For Russian users'}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              {ru ? 'Описание' : 'Description'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              {ru ? 'Описание (RU)' : 'Description (RU)'}
            </label>
            <textarea
              value={descriptionRu}
              onChange={(e) => setDescriptionRu(e.target.value)}
              rows={2}
              placeholder={ru ? 'Опционально' : 'Optional'}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2">
              {ru ? 'Содержимое шаблона:' : 'Template contents:'}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span>{skill.emoji}</span>
              <span className="text-white">{skill.name}</span>
            </div>
            {skill.goal && <p className="text-xs text-gray-400 mt-1">🎯 {skill.goal}</p>}
            {skill.checklist.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                ✅ {skill.checklist.length} {ru ? 'пунктов' : 'items'}
              </p>
            )}
          </div>

          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-2 w-full p-3 rounded-lg border transition-colors ${
              isPublic
                ? 'border-green-500/30 bg-green-500/10'
                : 'border-gray-700 bg-gray-800'
            }`}
          >
            {isPublic ? (
              <Globe className="w-4 h-4 text-green-400" />
            ) : (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm">
              {isPublic
                ? ru
                  ? 'Публичный — все могут использовать'
                  : 'Public — everyone can use'
                : ru
                  ? 'Приватный — только вы'
                  : 'Private — only you'}
            </span>
          </button>
        </div>

        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700"
          >
            {ru ? 'Отмена' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-500 disabled:opacity-50"
          >
            {saving ? '...' : ru ? 'Сохранить' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}