'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Goal } from './GoalItem';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  locale: string;
  userId: string;
  skillId?: string | null;
  parentId?: string | null;
  editGoal?: Goal | null;
}

const GOAL_TYPES = [
  { key: 'single', labelRu: 'Одноразовая', labelEn: 'Single' },
  { key: 'daily', labelRu: 'Ежедневная', labelEn: 'Daily' },
  { key: 'counter', labelRu: 'Счётчик', labelEn: 'Counter' },
  { key: 'checklist', labelRu: 'Чек-лист', labelEn: 'Checklist' },
  { key: 'short', labelRu: 'Краткосрочная', labelEn: 'Short-term' },
  { key: 'long', labelRu: 'Долгосрочная', labelEn: 'Long-term' },
] as const;

const TYPE_COLORS: Record<string, string> = {
  single: 'border-gray-500 text-gray-300',
  daily: 'border-orange-500 text-orange-300',
  counter: 'border-blue-500 text-blue-300',
  checklist: 'border-green-500 text-green-300',
  short: 'border-yellow-500 text-yellow-300',
  long: 'border-purple-500 text-purple-300',
};

export default function CreateGoalModal({ open, onClose, onSaved, locale, userId, skillId, parentId, editGoal }: Props) {
  const ru = locale === 'ru';
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState<string>('single');
  const [xpReward, setXpReward] = useState(10);
  const [goldReward, setGoldReward] = useState(0);
  const [targetCount, setTargetCount] = useState(2);
  const [deadline, setDeadline] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editGoal) {
      setTitle(editGoal.title);
      setDescription(editGoal.description || '');
      setGoalType(editGoal.goal_type);
      setXpReward(editGoal.xp_reward);
      setGoldReward(editGoal.gold_reward);
      setTargetCount(editGoal.target_count);
      setDeadline(editGoal.deadline ? editGoal.deadline.slice(0, 10) : '');
      setChecklistItems(editGoal.checklist_items.map(i => i.label));
    } else {
      setTitle('');
      setDescription('');
      setGoalType(parentId ? 'single' : 'single');
      setXpReward(10);
      setGoldReward(0);
      setTargetCount(2);
      setDeadline('');
      setChecklistItems([]);
    }
  }, [editGoal, open, parentId]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        user_id: userId,
        skill_id: skillId || null,
        parent_id: parentId || null,
        title: title.trim(),
        description: description.trim() || null,
        goal_type: goalType,
        xp_reward: xpReward,
        gold_reward: goldReward,
        target_count: goalType === 'counter' ? targetCount : 1,
        deadline: deadline || null,
        checklist_items: goalType === 'checklist'
          ? checklistItems.filter(i => i.trim()).map(label => ({ label, done: false }))
          : [],
      };

      if (editGoal) {
        await supabase.from('goals').update(data).eq('id', editGoal.id);
        toast.success(ru ? 'Обновлено' : 'Updated');
      } else {
        await supabase.from('goals').insert(data);
        toast.success(ru ? 'Создано' : 'Created');
      }
      onSaved();
      onClose();
    } catch {
      toast.error('Error');
    }
    setSaving(false);
  }

  function addChecklistItem() {
    setChecklistItems([...checklistItems, '']);
  }

  function removeChecklistItem(idx: number) {
    setChecklistItems(checklistItems.filter((_, i) => i !== idx));
  }

  function updateChecklistItem(idx: number, val: string) {
    const items = [...checklistItems];
    items[idx] = val;
    setChecklistItems(items);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold">
            {editGoal
              ? (ru ? 'Редактировать цель' : 'Edit Goal')
              : parentId
                ? (ru ? 'Новая подцель' : 'New Sub-goal')
                : (ru ? 'Новая цель' : 'New Goal')
            }
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Goal Type Selector */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">{ru ? 'Тип цели' : 'Goal Type'}</label>
            <div className="grid grid-cols-3 gap-2">
              {GOAL_TYPES.map(({ key, labelRu, labelEn }) => (
                <button
                  key={key}
                  onClick={() => setGoalType(key)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                    goalType === key
                      ? `${TYPE_COLORS[key]} bg-gray-800`
                      : 'border-gray-700 text-gray-500 hover:border-gray-600'
                  }`}
                >
                  {ru ? labelRu : labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">{ru ? 'Название' : 'Title'}</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={ru ? 'Название цели...' : 'Goal title...'}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">{ru ? 'Описание' : 'Description'}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={ru ? 'Опционально...' : 'Optional...'}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          {/* XP + Gold */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">XP</label>
              <input
                type="number" min={1} value={xpReward}
                onChange={e => setXpReward(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">{ru ? 'Золото' : 'Gold'}</label>
              <input
                type="number" min={0} value={goldReward}
                onChange={e => setGoldReward(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Counter target */}
          {goalType === 'counter' && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">{ru ? 'Целевое количество' : 'Target Count'}</label>
              <input
                type="number" min={2} value={targetCount}
                onChange={e => setTargetCount(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
          )}

          {/* Deadline */}
          {['counter', 'short', 'long'].includes(goalType) && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">{ru ? 'Дедлайн' : 'Deadline'}</label>
              <input
                type="date" value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
          )}

          {/* Checklist items */}
          {goalType === 'checklist' && (
            <div>
              <label className="text-sm text-gray-400 mb-2 block">{ru ? 'Пункты чек-листа' : 'Checklist Items'}</label>
              <div className="space-y-2">
                {checklistItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      value={item}
                      onChange={e => updateChecklistItem(idx, e.target.value)}
                      placeholder={`${ru ? 'Пункт' : 'Item'} ${idx + 1}`}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-purple-500 focus:outline-none"
                    />
                    <button onClick={() => removeChecklistItem(idx)} className="p-1 text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={addChecklistItem}
                  className="w-full py-2 border-2 border-dashed border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center gap-1">
                  <Plus className="w-4 h-4" /> {ru ? 'Добавить пункт' : 'Add item'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">
            {ru ? 'Отмена' : 'Cancel'}
          </button>
          <button onClick={handleSave} disabled={saving || !title.trim()}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-500 disabled:opacity-50">
            {saving ? '...' : editGoal ? (ru ? 'Сохранить' : 'Save') : (ru ? 'Создать' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}
