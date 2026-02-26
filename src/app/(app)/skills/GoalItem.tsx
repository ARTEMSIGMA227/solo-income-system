'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Check, ChevronDown, ChevronRight, Copy, FileText,
  Pencil, Trash2, CornerDownRight, Flame, Minus, Plus,
} from 'lucide-react';
import { toast } from 'sonner';

export interface Goal {
  id: string;
  user_id: string;
  skill_id: string | null;
  parent_id: string | null;
  title: string;
  description: string | null;
  goal_type: 'single' | 'daily' | 'counter' | 'checklist' | 'short' | 'long';
  xp_reward: number;
  gold_reward: number;
  target_count: number;
  current_count: number;
  checklist_items: { label: string; done: boolean }[];
  streak_current: number;
  streak_best: number;
  last_completed_date: string | null;
  is_completed: boolean;
  is_archived: boolean;
  completed_at: string | null;
  deadline: string | null;
  sort_order: number;
  created_at: string;
  children?: Goal[];
}

interface GoalItemProps {
  goal: Goal;
  depth?: number;
  locale: string;
  onRefresh: () => void;
  onEdit: (goal: Goal) => void;
  onAddSub: (parentId: string) => void;
  onNotes: (goalId: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  single: 'border-l-gray-500',
  daily: 'border-l-orange-500',
  counter: 'border-l-blue-500',
  checklist: 'border-l-green-500',
  short: 'border-l-yellow-500',
  long: 'border-l-purple-500',
};

export default function GoalItem({ goal, depth = 0, locale, onRefresh, onEdit, onAddSub, onNotes }: GoalItemProps) {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const hasChildren = goal.children && goal.children.length > 0;
  const ru = locale === 'ru';

  // Complete single/short/long goal
  async function completeGoal() {
    setLoading(true);
    try {
      await supabase.from('goals').update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      }).eq('id', goal.id);
      await supabase.from('goal_completions').insert({
        goal_id: goal.id, user_id: goal.user_id,
      });
      // Add XP to skill if linked
      if (goal.skill_id) {
        const { data: skill } = await supabase.from('user_skills')
          .select('current_xp, xp_to_next, level')
          .eq('id', goal.skill_id).single();
        if (skill) {
          let newXP = skill.current_xp + goal.xp_reward;
          let newLevel = skill.level;
          let newToNext = skill.xp_to_next;
          while (newXP >= newToNext) {
            newXP -= newToNext;
            newLevel++;
            newToNext = Math.floor(newToNext * 1.2);
          }
          await supabase.from('user_skills').update({
            current_xp: newXP, level: newLevel, xp_to_next: newToNext,
          }).eq('id', goal.skill_id);
        }
      }
      toast.success(`+${goal.xp_reward} XP`);
      onRefresh();
    } catch { toast.error('Error'); }
    setLoading(false);
  }

  // Daily check-in
  async function dailyCheckIn() {
    const today = new Date().toISOString().slice(0, 10);
    if (goal.last_completed_date === today) return;
    setLoading(true);
    try {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newStreak = goal.last_completed_date === yesterday ? goal.streak_current + 1 : 1;
      await supabase.from('goals').update({
        last_completed_date: today,
        streak_current: newStreak,
        streak_best: Math.max(newStreak, goal.streak_best),
      }).eq('id', goal.id);
      await supabase.from('goal_completions').insert({ goal_id: goal.id, user_id: goal.user_id });
      if (goal.skill_id) {
        const { data: skill } = await supabase.from('user_skills')
          .select('current_xp, xp_to_next, level').eq('id', goal.skill_id).single();
        if (skill) {
          let newXP = skill.current_xp + goal.xp_reward;
          let newLevel = skill.level;
          let newToNext = skill.xp_to_next;
          while (newXP >= newToNext) { newXP -= newToNext; newLevel++; newToNext = Math.floor(newToNext * 1.2); }
          await supabase.from('user_skills').update({ current_xp: newXP, level: newLevel, xp_to_next: newToNext }).eq('id', goal.skill_id);
        }
      }
      toast.success(`+${goal.xp_reward} XP 🔥${newStreak}`);
      onRefresh();
    } catch { toast.error('Error'); }
    setLoading(false);
  }

  // Counter increment
  async function incrementCounter() {
    if (goal.current_count >= goal.target_count) return;
    setLoading(true);
    try {
      const newCount = goal.current_count + 1;
      const completed = newCount >= goal.target_count;
      await supabase.from('goals').update({
        current_count: newCount,
        is_completed: completed,
        completed_at: completed ? new Date().toISOString() : null,
      }).eq('id', goal.id);
      await supabase.from('goal_completions').insert({ goal_id: goal.id, user_id: goal.user_id });
      if (completed && goal.skill_id) {
        const { data: skill } = await supabase.from('user_skills')
          .select('current_xp, xp_to_next, level').eq('id', goal.skill_id).single();
        if (skill) {
          let newXP = skill.current_xp + goal.xp_reward;
          let newLevel = skill.level;
          let newToNext = skill.xp_to_next;
          while (newXP >= newToNext) { newXP -= newToNext; newLevel++; newToNext = Math.floor(newToNext * 1.2); }
          await supabase.from('user_skills').update({ current_xp: newXP, level: newLevel, xp_to_next: newToNext }).eq('id', goal.skill_id);
        }
      }
      if (completed) toast.success(`+${goal.xp_reward} XP`);
      onRefresh();
    } catch { toast.error('Error'); }
    setLoading(false);
  }

  async function decrementCounter() {
    if (goal.current_count <= 0) return;
    setLoading(true);
    await supabase.from('goals').update({ current_count: goal.current_count - 1, is_completed: false, completed_at: null }).eq('id', goal.id);
    onRefresh();
    setLoading(false);
  }

  // Checklist toggle
  async function toggleChecklistItem(idx: number) {
    const items = [...goal.checklist_items];
    items[idx] = { ...items[idx], done: !items[idx].done };
    const allDone = items.every(i => i.done);
    setLoading(true);
    await supabase.from('goals').update({
      checklist_items: items,
      is_completed: allDone,
      completed_at: allDone ? new Date().toISOString() : null,
    }).eq('id', goal.id);
    if (allDone && goal.skill_id) {
      const { data: skill } = await supabase.from('user_skills')
        .select('current_xp, xp_to_next, level').eq('id', goal.skill_id).single();
      if (skill) {
        let newXP = skill.current_xp + goal.xp_reward;
        let newLevel = skill.level;
        let newToNext = skill.xp_to_next;
        while (newXP >= newToNext) { newXP -= newToNext; newLevel++; newToNext = Math.floor(newToNext * 1.2); }
        await supabase.from('user_skills').update({ current_xp: newXP, level: newLevel, xp_to_next: newToNext }).eq('id', goal.skill_id);
      }
      toast.success(`+${goal.xp_reward} XP`);
    }
    onRefresh();
    setLoading(false);
  }

  // Delete
  async function deleteGoal() {
    if (!confirm(ru ? 'Удалить цель?' : 'Delete goal?')) return;
    await supabase.from('goals').delete().eq('id', goal.id);
    toast.success(ru ? 'Удалено' : 'Deleted');
    onRefresh();
  }

  // Archive
  async function archiveGoal() {
    await supabase.from('goals').update({ is_archived: true }).eq('id', goal.id);
    onRefresh();
  }

  // Duplicate
  async function duplicateGoal() {
    const { id, children, created_at, completed_at, is_completed, is_archived, current_count, streak_current, last_completed_date, ...rest } = goal;
    await supabase.from('goals').insert({
      ...rest,
      is_completed: false, is_archived: false, current_count: 0,
      streak_current: 0, last_completed_date: null,
      checklist_items: goal.checklist_items.map(i => ({ ...i, done: false })),
    });
    toast.success(ru ? 'Скопировано' : 'Duplicated');
    onRefresh();
  }

  const today = new Date().toISOString().slice(0, 10);
  const isDailyDone = goal.goal_type === 'daily' && goal.last_completed_date === today;

  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div className={`bg-gray-800/60 border-l-4 ${TYPE_COLORS[goal.goal_type]} rounded-lg p-3 mb-2 ${goal.is_completed ? 'opacity-60' : ''}`}>
        <div className="flex items-center gap-2">
          {/* Expand/collapse for goals with children */}
          {hasChildren ? (
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-white">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : <div className="w-4" />}

          {/* Main action area — depends on type */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* SINGLE / SHORT / LONG: checkbox */}
              {['single', 'short', 'long'].includes(goal.goal_type) && (
                <button
                  onClick={completeGoal}
                  disabled={loading || goal.is_completed}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    goal.is_completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-500 hover:border-green-400'
                  }`}
                >
                  {goal.is_completed && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              )}

              {/* DAILY: checkbox with streak */}
              {goal.goal_type === 'daily' && (
                <button
                  onClick={dailyCheckIn}
                  disabled={loading || isDailyDone}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isDailyDone
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-500 hover:border-orange-400'
                  }`}
                >
                  {isDailyDone && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              )}

              {/* COUNTER: -/+ buttons */}
              {goal.goal_type === 'counter' && (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={decrementCounter} disabled={loading || goal.current_count <= 0}
                    className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center disabled:opacity-30">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-mono font-bold text-white min-w-[40px] text-center">
                    {goal.current_count}/{goal.target_count}
                  </span>
                  <button onClick={incrementCounter} disabled={loading || goal.current_count >= goal.target_count}
                    className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center disabled:opacity-30">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Title */}
              <span className={`text-sm font-medium ${goal.is_completed ? 'line-through text-gray-500' : 'text-white'}`}>
                {goal.title}
              </span>

              {/* XP badge */}
              <span className="text-xs text-green-400 font-medium shrink-0">
                +{goal.xp_reward} XP
              </span>

              {/* Daily streak badge */}
              {goal.goal_type === 'daily' && goal.streak_current > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-orange-400 font-medium shrink-0">
                  <Flame className="w-3 h-3" />×{goal.streak_current}
                </span>
              )}
            </div>

            {/* CHECKLIST items inline */}
            {goal.goal_type === 'checklist' && goal.checklist_items.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {goal.checklist_items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleChecklistItem(idx)}
                    disabled={loading}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                      item.done
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] ${
                      item.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-500'
                    }`}>
                      {item.done && '✓'}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {/* Counter deadline */}
            {goal.goal_type === 'counter' && goal.deadline && (
              <p className="text-xs text-gray-500 mt-1">
                {ru ? 'Осталось' : 'Remaining'} {goal.target_count - goal.current_count} {ru ? 'раз до' : 'times by'}{' '}
                {new Date(goal.deadline).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', year: '2-digit' })}
              </p>
            )}

            {/* Deadline for short goals */}
            {goal.goal_type === 'short' && goal.deadline && (
              <p className="text-xs text-gray-500 mt-1">
                {ru ? 'До' : 'By'}{' '}
                {new Date(goal.deadline).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', year: '2-digit' })}
              </p>
            )}

            {/* Daily label */}
            {goal.goal_type === 'daily' && (
              <p className="text-xs text-gray-500 mt-0.5">{ru ? 'Ежедневная' : 'Daily'}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {['long', 'short', 'single'].includes(goal.goal_type) && (
              <button onClick={() => onAddSub(goal.id)} className="p-1.5 text-gray-500 hover:text-purple-400 transition-colors" title={ru ? 'Подцель' : 'Sub-goal'}>
                <CornerDownRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={duplicateGoal} className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors" title={ru ? 'Копировать' : 'Copy'}>
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onNotes(goal.id)} className="p-1.5 text-gray-500 hover:text-yellow-400 transition-colors" title={ru ? 'Заметки' : 'Notes'}>
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onEdit(goal)} className="p-1.5 text-gray-500 hover:text-amber-400 transition-colors" title={ru ? 'Редактировать' : 'Edit'}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={deleteGoal} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors" title={ru ? 'Удалить' : 'Delete'}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Render children recursively */}
      {hasChildren && expanded && (
        <div>
          {goal.children!.map(child => (
            <GoalItem
              key={child.id}
              goal={child}
              depth={depth + 1}
              locale={locale}
              onRefresh={onRefresh}
              onEdit={onEdit}
              onAddSub={onAddSub}
              onNotes={onNotes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
