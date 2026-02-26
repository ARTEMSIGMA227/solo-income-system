'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';
import GoalItem, { type Goal } from './GoalItem';
import CreateGoalModal from './CreateGoalModal';
import NotesModal from './NotesModal';
import TemplatesTab from './TemplatesTab';
import SaveTemplateModal from './SaveTemplateModal';
import { canCreateSkill } from '@/lib/pro';
import { toast } from 'sonner';
import {
  Plus, Loader2, ChevronDown, ChevronRight, Pencil, Trash2,
  FileText, Archive, Zap, Target, Crown, Bookmark,
} from 'lucide-react';

interface Skill {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  goal: string | null;
  emoji: string;
  level: number;
  current_xp: number;
  xp_to_next: number;
  checklist: { text: string; done: boolean }[];
  is_active: boolean;
  created_at: string;
}

export default function SkillsPage() {
  const { t, locale } = useT();
  const ru = locale === 'ru';
  const supabase = createClient();

  const [userId, setUserId] = useState<string>('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [mainTab, setMainTab] = useState<'skills' | 'templates'>('skills');
  const [isPro, setIsPro] = useState(false);

  // Modals
  const [showCreateSkill, setShowCreateSkill] = useState(false);
  const [editSkill, setEditSkill] = useState<Skill | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [goalParentId, setGoalParentId] = useState<string | null>(null);
  const [notesGoalId, setNotesGoalId] = useState<string | null>(null);
  const [notesSkillId, setNotesSkillId] = useState<string | null>(null);
  const [notesType, setNotesType] = useState<'goal' | 'skill'>('goal');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [saveTemplateSkill, setSaveTemplateSkill] = useState<Skill | null>(null);

  // Skill form state
  const [skillName, setSkillName] = useState('');
  const [skillDesc, setSkillDesc] = useState('');
  const [skillGoal, setSkillGoal] = useState('');
  const [skillEmoji, setSkillEmoji] = useState('⚡');
  const [skillChecklist, setSkillChecklist] = useState<string[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [{ data: skillsData }, { data: goalsData }] = await Promise.all([
      supabase.from('user_skills').select('*').eq('user_id', user.id).order('sort_order'),
      supabase.from('goals').select('*').eq('user_id', user.id).order('sort_order'),
    ]);

    setSkills(skillsData || []);
    setGoals(goalsData || []);

    // Load PRO status
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', user.id)
      .maybeSingle();
    setIsPro(profileData?.is_pro ?? false);

    setLoading(false);
  }

  // Build goal tree for a skill
  function buildGoalTree(skillId: string | null, archived: boolean): Goal[] {
    const filtered = goals.filter(g =>
      g.skill_id === skillId && g.is_archived === archived
    );
    const map = new Map<string | null, Goal[]>();
    filtered.forEach(g => {
      const pid = g.parent_id;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(g);
    });

    function attachChildren(parentId: string | null): Goal[] {
      const children = map.get(parentId) || [];
      return children.map(g => ({
        ...g,
        children: attachChildren(g.id),
      }));
    }

    return attachChildren(null);
  }

  const archivedCount = (skillId: string | null) =>
    goals.filter(g => g.skill_id === skillId && g.is_archived).length;

  // Create/edit skill
  function openCreateSkill() {
    if (!canCreateSkill(skills.length, isPro)) {
      toast.error(
        ru
          ? `Максимум ${5} навыков на Free. Оформите PRO!`
          : `Max ${5} skills on Free plan. Upgrade to PRO!`
      );
      return;
    }
    setEditSkill(null);
    setSkillName(''); setSkillDesc(''); setSkillGoal(''); setSkillEmoji('⚡'); setSkillChecklist([]);
    setShowCreateSkill(true);
  }

  function openEditSkill(skill: Skill) {
    setEditSkill(skill);
    setSkillName(skill.name);
    setSkillDesc(skill.description || '');
    setSkillGoal(skill.goal || '');
    setSkillEmoji(skill.emoji);
    setSkillChecklist(skill.checklist.map(c => c.text));
    setShowCreateSkill(true);
  }

  async function saveSkill() {
    if (!skillName.trim()) return;
    const data = {
      user_id: userId,
      name: skillName.trim(),
      description: skillDesc.trim() || null,
      goal: skillGoal.trim() || null,
      emoji: skillEmoji || '⚡',
      checklist: skillChecklist.filter(t => t.trim()).map(text => ({ text, done: false })),
    };

    if (editSkill) {
      await supabase.from('user_skills').update(data).eq('id', editSkill.id);
      toast.success(ru ? 'Обновлено' : 'Updated');
    } else {
      await supabase.from('user_skills').insert(data);
      toast.success(ru ? 'Навык создан' : 'Skill created');
    }
    setShowCreateSkill(false);
    loadData();
  }

  async function deleteSkill(id: string) {
    if (!confirm(ru ? 'Удалить навык и все его цели?' : 'Delete skill and all its goals?')) return;
    await supabase.from('goals').delete().eq('skill_id', id);
    await supabase.from('user_skills').delete().eq('id', id);
    if (activeSkillId === id) setActiveSkillId(null);
    toast.success(ru ? 'Удалено' : 'Deleted');
    loadData();
  }

  // Toggle skill checklist item
  async function toggleSkillChecklist(skill: Skill, idx: number) {
    const items = [...skill.checklist];
    items[idx] = { ...items[idx], done: !items[idx].done };
    await supabase.from('user_skills').update({ checklist: items }).eq('id', skill.id);
    loadData();
  }

  // Open goal create
  function openCreateGoal(parentId: string | null = null) {
    setEditGoal(null);
    setGoalParentId(parentId);
    setShowGoalModal(true);
  }

  function openEditGoal(goal: Goal) {
    setEditGoal(goal);
    setGoalParentId(goal.parent_id);
    setShowGoalModal(true);
  }

  // Unarchive all
  async function unarchiveAll(skillId: string | null) {
    const ids = goals.filter(g => g.skill_id === skillId && g.is_archived).map(g => g.id);
    if (ids.length === 0) return;
    for (const id of ids) {
      await supabase.from('goals').update({ is_archived: false, is_completed: false, completed_at: null }).eq('id', id);
    }
    loadData();
  }

  // Create skill from template
  async function createFromTemplate(data: {
    name: string;
    emoji: string;
    description?: string;
    goal?: string;
    checklist?: { text: string; done: boolean }[];
  }) {
    if (!canCreateSkill(skills.length, isPro)) {
      toast.error(
        ru
          ? `Максимум ${5} навыков на Free. Оформите PRO!`
          : `Max ${5} skills on Free plan. Upgrade to PRO!`
      );
      return;
    }
    await supabase.from('user_skills').insert({
      user_id: userId,
      name: data.name,
      emoji: data.emoji,
      description: data.description || null,
      goal: data.goal || null,
      checklist: data.checklist || [],
    });
    toast.success(ru ? 'Навык создан из шаблона!' : 'Skill created from template!');
    setMainTab('skills');
    loadData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const activeSkill = skills.find(s => s.id === activeSkillId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-7 h-7 text-purple-400" />
          {ru ? 'Навыки' : 'Skills'}
        </h1>
        {mainTab === 'skills' && (
          <button onClick={openCreateSkill}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-500">
            <Plus className="w-4 h-4" /> {ru ? 'Навык' : 'Skill'}
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-2">
        <button
          onClick={() => setMainTab('skills')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mainTab === 'skills'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 inline mr-1.5" />
          {ru ? 'Навыки' : 'Skills'}
          <span className="ml-1.5 text-xs opacity-60">({skills.length})</span>
        </button>
        <button
          onClick={() => setMainTab('templates')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mainTab === 'templates'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1.5" />
          {ru ? 'Шаблоны' : 'Templates'}
          {!isPro && <Crown className="w-3 h-3 inline ml-1.5 text-yellow-400" />}
        </button>
      </div>

      {/* Templates tab */}
      {mainTab === 'templates' && (
        <TemplatesTab
          userId={userId}
          locale={locale}
          isPro={isPro}
          onCreateFromTemplate={createFromTemplate}
        />
      )}

      {/* Skills tab */}
      {mainTab === 'skills' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Skills List (sidebar) */}
          <div className="lg:col-span-4 space-y-3">
            {skills.length === 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
                <Zap className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">{ru ? 'Создайте первый навык' : 'Create your first skill'}</p>
                <button onClick={openCreateSkill}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500">
                  <Plus className="w-4 h-4 inline mr-1" /> {ru ? 'Создать навык' : 'Create Skill'}
                </button>
              </div>
            )}

            {/* PRO limit hint */}
            {!isPro && skills.length >= 3 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
                <p className="text-xs text-yellow-400">
                  {ru
                    ? `${skills.length}/5 навыков на Free`
                    : `${skills.length}/5 skills on Free`}
                  {' · '}
                  <a href="/subscription" className="underline hover:text-yellow-300">
                    {ru ? 'PRO' : 'PRO'}
                  </a>
                </p>
              </div>
            )}

            {skills.map(skill => {
              const isActive = activeSkillId === skill.id;
              const goalCount = goals.filter(g => g.skill_id === skill.id && !g.is_archived).length;
              const pct = skill.xp_to_next > 0 ? (skill.current_xp / skill.xp_to_next) * 100 : 0;

              return (
                <button
                  key={skill.id}
                  onClick={() => setActiveSkillId(isActive ? null : skill.id)}
                  className={`w-full text-left bg-gray-800/50 border rounded-xl p-4 transition-all ${
                    isActive ? 'border-purple-500 shadow-lg shadow-purple-500/10' : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{skill.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white truncate">{skill.name}</h3>
                        <span className="text-xs text-gray-400 shrink-0">
                          {ru ? 'Ур.' : 'Lv.'} {skill.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{skill.current_xp}/{skill.xp_to_next}</span>
                      </div>
                      {goalCount > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {goalCount} {ru ? 'целей' : 'goals'}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Skill Detail + Goals */}
          <div className="lg:col-span-8">
            {!activeSkill ? (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
                <Target className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">{ru ? 'Выберите навык слева' : 'Select a skill on the left'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Skill header card */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{activeSkill.emoji}</span>
                      <div>
                        <h2 className="text-xl font-bold text-white">{activeSkill.name}</h2>
                        {activeSkill.description && (
                          <p className="text-sm text-gray-400">{activeSkill.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setNotesType('skill'); setNotesSkillId(activeSkill.id); }}
                        className="p-2 text-gray-500 hover:text-yellow-400" title={ru ? 'Заметки' : 'Notes'}>
                        <FileText className="w-4 h-4" />
                      </button>
                      {isPro && (
                        <button
                          onClick={() => { setSaveTemplateSkill(activeSkill); setShowSaveTemplate(true); }}
                          className="p-2 text-gray-500 hover:text-purple-400"
                          title={ru ? 'Сохранить как шаблон' : 'Save as Template'}
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => openEditSkill(activeSkill)}
                        className="p-2 text-gray-500 hover:text-amber-400" title={ru ? 'Редактировать' : 'Edit'}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteSkill(activeSkill.id)}
                        className="p-2 text-gray-500 hover:text-red-400" title={ru ? 'Удалить' : 'Delete'}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {activeSkill.goal && (
                    <div className="mb-3 p-3 bg-gray-900 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">{ru ? 'Цель навыка' : 'Skill Goal'}</p>
                      <p className="text-sm text-gray-300">{activeSkill.goal}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-purple-400">{ru ? 'Ур.' : 'Lv.'} {activeSkill.level}</span>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${(activeSkill.current_xp / activeSkill.xp_to_next) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">{activeSkill.current_xp} / {activeSkill.xp_to_next} XP</span>
                  </div>

                  {activeSkill.checklist.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-500 mb-2">{ru ? 'Чек-лист' : 'Checklist'}</p>
                      <div className="space-y-1.5">
                        {activeSkill.checklist.map((item, idx) => (
                          <button key={idx} onClick={() => toggleSkillChecklist(activeSkill, idx)}
                            className="flex items-center gap-2 text-sm w-full text-left hover:bg-gray-800 rounded px-2 py-1 transition-colors">
                            <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                              item.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-600'
                            }`}>
                              {item.done && '✓'}
                            </span>
                            <span className={item.done ? 'text-gray-500 line-through' : 'text-gray-300'}>{item.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Goals section */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{ru ? 'Цели' : 'Goals'}</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openCreateGoal()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500">
                        <Plus className="w-3.5 h-3.5" /> {ru ? 'Цель' : 'Goal'}
                      </button>
                    </div>
                  </div>

                  {buildGoalTree(activeSkillId, false).length === 0 ? (
                    <p className="text-center text-gray-500 py-8">{ru ? 'Нет целей. Создайте первую!' : 'No goals yet. Create one!'}</p>
                  ) : (
                    <div>
                      {buildGoalTree(activeSkillId, false).map(goal => (
                        <GoalItem
                          key={goal.id}
                          goal={goal}
                          locale={locale}
                          onRefresh={loadData}
                          onEdit={openEditGoal}
                          onAddSub={(pid) => { setGoalParentId(pid); setEditGoal(null); setShowGoalModal(true); }}
                          onNotes={(gid) => { setNotesType('goal'); setNotesGoalId(gid); }}
                        />
                      ))}
                    </div>
                  )}

                  {archivedCount(activeSkillId) > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <button onClick={() => setShowArchive(!showArchive)}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                        {showArchive ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Archive className="w-4 h-4" />
                        {ru ? 'Архив' : 'Archive'} ({archivedCount(activeSkillId)})
                      </button>
                      {showArchive && (
                        <div className="mt-3 opacity-60">
                          {buildGoalTree(activeSkillId, true).map(goal => (
                            <GoalItem
                              key={goal.id}
                              goal={goal}
                              locale={locale}
                              onRefresh={loadData}
                              onEdit={openEditGoal}
                              onAddSub={() => {}}
                              onNotes={(gid) => { setNotesType('goal'); setNotesGoalId(gid); }}
                            />
                          ))}
                          <button onClick={() => unarchiveAll(activeSkillId)}
                            className="mt-2 text-xs text-purple-400 hover:text-purple-300">
                            {ru ? 'Восстановить все' : 'Restore all'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Skill Modal */}
      {showCreateSkill && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateSkill(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold">{editSkill ? (ru ? 'Редактировать навык' : 'Edit Skill') : (ru ? 'Новый навык' : 'New Skill')}</h3>
              <button onClick={() => setShowCreateSkill(false)} className="p-1 text-gray-400 hover:text-white">
                <span className="text-xl">×</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">{ru ? 'Иконка' : 'Icon'}</label>
                <div className="flex gap-2 flex-wrap">
                  {['⚡', '💪', '🧠', '📚', '💰', '🎯', '🏋️', '🎨', '💻', '🗣️', '🎵', '🔬'].map(e => (
                    <button key={e} onClick={() => setSkillEmoji(e)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        skillEmoji === e ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-gray-800 hover:bg-gray-700'
                      }`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">{ru ? 'Название навыка' : 'Skill Name'}</label>
                <input value={skillName} onChange={e => setSkillName(e.target.value)}
                  placeholder={ru ? 'Например: Английский' : 'e.g., English'}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">{ru ? 'Что я хочу от навыка' : 'What I want from this skill'}</label>
                <input value={skillGoal} onChange={e => setSkillGoal(e.target.value)}
                  placeholder={ru ? 'Например: Сдать IELTS на 7+' : 'e.g., Pass IELTS 7+'}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">{ru ? 'Описание' : 'Description'}</label>
                <textarea value={skillDesc} onChange={e => setSkillDesc(e.target.value)} rows={2}
                  placeholder={ru ? 'Опционально...' : 'Optional...'}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">{ru ? 'Чек-лист навыка' : 'Skill Checklist'}</label>
                {skillChecklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input value={item} onChange={e => { const c = [...skillChecklist]; c[idx] = e.target.value; setSkillChecklist(c); }}
                      placeholder={`${ru ? 'Пункт' : 'Item'} ${idx + 1}`}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-purple-500 focus:outline-none" />
                    <button onClick={() => setSkillChecklist(skillChecklist.filter((_, i) => i !== idx))}
                      className="p-1 text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => setSkillChecklist([...skillChecklist, ''])}
                  className="w-full py-2 border-2 border-dashed border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white hover:border-gray-500 flex items-center justify-center gap-1">
                  <Plus className="w-4 h-4" /> {ru ? 'Добавить пункт' : 'Add item'}
                </button>
              </div>
            </div>
            <div className="p-4 border-t border-gray-700 flex gap-3">
              <button onClick={() => setShowCreateSkill(false)} className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">
                {ru ? 'Отмена' : 'Cancel'}
              </button>
              <button onClick={saveSkill} disabled={!skillName.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-500 disabled:opacity-50">
                {editSkill ? (ru ? 'Сохранить' : 'Save') : (ru ? 'Создать' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Goal Modal */}
      <CreateGoalModal
        open={showGoalModal}
        onClose={() => { setShowGoalModal(false); setEditGoal(null); setGoalParentId(null); }}
        onSaved={loadData}
        locale={locale}
        userId={userId}
        skillId={activeSkillId}
        parentId={goalParentId}
        editGoal={editGoal}
      />

      {/* Notes Modal */}
      <NotesModal
        open={notesGoalId !== null || notesSkillId !== null}
        onClose={() => { setNotesGoalId(null); setNotesSkillId(null); }}
        goalId={notesGoalId}
        skillId={notesSkillId}
        userId={userId}
        locale={locale}
        type={notesType}
      />

      {/* Save Template Modal */}
      {showSaveTemplate && saveTemplateSkill && (
        <SaveTemplateModal
          open={showSaveTemplate}
          onClose={() => { setShowSaveTemplate(false); setSaveTemplateSkill(null); }}
          skill={saveTemplateSkill}
          userId={userId}
          locale={locale}
        />
      )}
    </div>
  );
}