'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getLevelInfo } from '@/lib/xp';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';
import { useProfile } from '@/hooks/use-profile';
import { canCreateQuest, PRO_LIMITS } from '@/lib/pro';
import { ProLimitBadge } from '@/components/ui/pro-gate';
import type { Quest, Completion, Stats } from '@/types/database';
import { grantLootbox } from '@/lib/lootbox-rewards';

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('other');
  const [formType, setFormType] = useState('custom');
  const [formXP, setFormXP] = useState(25);
  const [formTarget, setFormTarget] = useState(1);

  const supabase = createClient();
  const { t, locale } = useT();
  const { data: profile } = useProfile();

  const isPro = profile?.is_pro === true;
  const activeQuestCount = quests.length;
  const canCreate = canCreateQuest(activeQuestCount, isPro);

  function getToday() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
  }

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const today = getToday();

      const { data: questsData } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('quest_type');
      setQuests(questsData || []);

      const { data: completionsData } = await supabase
        .from('completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_date', today);
      setCompletions(completionsData || []);

      const { data: statsData } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setStats(statsData);

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getQuestProgress(quest: Quest): number {
    return completions
      .filter((c) => c.quest_id === quest.id)
      .reduce((sum, c) => sum + c.count_done, 0);
  }

  async function doQuest(quest: Quest) {
    if (!userId || !stats) return;
    const today = getToday();
    const current = getQuestProgress(quest);

    if (current >= quest.target_count) {
      toast(t.quests.alreadyDone);
      return;
    }

    const { data: newCompletion } = await supabase
      .from('completions')
      .insert({
        user_id: userId,
        quest_id: quest.id,
        completion_date: today,
        count_done: 1,
        notes: quest.title,
      })
      .select()
      .single();

    if (newCompletion) {
      setCompletions((prev) => [...prev, newCompletion]);
    }

    const xp = quest.xp_reward;
    await supabase.from('xp_events').insert({
      user_id: userId,
      event_type: quest.category === 'income_action' ? 'action' : 'task',
      xp_amount: xp,
      description: quest.title,
      event_date: today,
    });

    const newTotalEarned = stats.total_xp_earned + xp;
    const newActions = stats.total_actions + 1;
    const levelInfo = getLevelInfo(newTotalEarned, stats.total_xp_lost);

    await supabase
      .from('stats')
      .update({
        level: levelInfo.level,
        current_xp: levelInfo.currentXP,
        total_xp_earned: newTotalEarned,
        total_actions: newActions,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    setStats({
      ...stats,
      level: levelInfo.level,
      current_xp: levelInfo.currentXP,
      total_xp_earned: newTotalEarned,
      total_actions: newActions,
    });

    toast.success(`+${xp} XP — ${quest.title}`);

    const newProgress = current + 1;
    if (newProgress >= quest.target_count) {
      const boxType = quest.quest_type === 'daily_mandatory' ? 'common' as const : 'rare' as const;
      await grantLootbox(supabase, userId!, boxType, 'quest', quest.quest_type);
      toast.success(locale === 'ru' ? '🎁 Лутбокс за квест!' : '🎁 Quest lootbox!');
    }
  }

  function openAddForm() {
    if (!canCreate) {
      toast.error(
        locale === 'ru'
          ? `Лимит: ${PRO_LIMITS.FREE_MAX_ACTIVE_QUESTS} квестов. Оформите PRO для безлимита!`
          : `Limit: ${PRO_LIMITS.FREE_MAX_ACTIVE_QUESTS} quests. Get PRO for unlimited!`
      );
      return;
    }
    setFormTitle('');
    setFormDescription('');
    setFormCategory('other');
    setFormType('custom');
    setFormXP(25);
    setFormTarget(1);
    setEditingQuest(null);
    setShowAddForm(true);
  }

  function openEditForm(quest: Quest) {
    setFormTitle(quest.title);
    setFormDescription(quest.description || '');
    setFormCategory(quest.category);
    setFormType(quest.quest_type);
    setFormXP(quest.xp_reward);
    setFormTarget(quest.target_count);
    setEditingQuest(quest);
    setShowAddForm(true);
  }

  async function handleSaveQuest() {
    if (!userId || !formTitle.trim()) {
      toast.error(t.quests.enterName);
      return;
    }

    if (editingQuest) {
      const { data: updated } = await supabase
        .from('quests')
        .update({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          category: formCategory,
          quest_type: formType,
          xp_reward: formXP,
          target_count: formTarget,
        })
        .eq('id', editingQuest.id)
        .select()
        .single();

      if (updated) {
        setQuests((prev) => prev.map((q) => (q.id === editingQuest.id ? updated : q)));
        toast.success(t.quests.questUpdated);
      }
    } else {
      if (!canCreate) {
        toast.error(locale === 'ru' ? 'Лимит квестов достигнут!' : 'Quest limit reached!');
        return;
      }

      const { data: newQuest } = await supabase
        .from('quests')
        .insert({
          user_id: userId,
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          quest_type: formType,
          category: formCategory,
          xp_reward: formXP,
          target_count: formTarget,
          is_template: false,
        })
        .select()
        .single();

      if (newQuest) {
        setQuests((prev) => [...prev, newQuest]);
        toast.success(t.quests.questCreated);
      }
    }

    setShowAddForm(false);
    setEditingQuest(null);
  }

  async function deleteQuest(quest: Quest) {
    const confirmed = confirm(t.quests.deleteConfirm(quest.title));
    if (!confirmed) return;

    await supabase.from('quests').update({ is_active: false }).eq('id', quest.id);
    setQuests((prev) => prev.filter((q) => q.id !== quest.id));
    toast.success(t.quests.questDeleted);
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          color: '#a78bfa',
        }}
      >
        {t.quests.loading}
      </div>
    );
  }

  const mandatory = quests.filter((q) => q.quest_type === 'daily_mandatory');
  const optional = quests.filter((q) => q.quest_type !== 'daily_mandatory');

  function getCategoryIcon(cat: string) {
    switch (cat) {
      case 'income_action':
        return '💰';
      case 'strategy':
        return '🧠';
      case 'skill':
        return '📚';
      case 'fitness':
        return '💪';
      default:
        return '📌';
    }
  }

  function renderQuest(quest: Quest) {
    const progress = getQuestProgress(quest);
    const isDone = progress >= quest.target_count;
    const percent = Math.min(Math.round((progress / quest.target_count) * 100), 100);

    return (
      <div
        key={quest.id}
        style={{
          backgroundColor: isDone ? '#12201a' : '#12121a',
          border: `1px solid ${isDone ? '#22c55e30' : '#1e1e2e'}`,
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span>{getCategoryIcon(quest.category)}</span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: isDone ? 'line-through' : 'none',
                  color: isDone ? '#22c55e' : '#e2e8f0',
                }}
              >
                {quest.title}
              </span>
            </div>

            {quest.description && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#475569',
                  marginBottom: '6px',
                  paddingLeft: '28px',
                }}
              >
                {quest.description}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  flex: 1,
                  height: '6px',
                  backgroundColor: '#16161f',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    height: '100%',
                    borderRadius: '3px',
                    backgroundColor: isDone ? '#22c55e' : '#7c3aed',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  minWidth: '50px',
                  textAlign: 'right',
                }}
              >
                {progress}/{quest.target_count}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginLeft: '12px', flexShrink: 0 }}>
            <button
              onClick={() => doQuest(quest)}
              disabled={isDone}
              style={{
                padding: '8px 12px',
                backgroundColor: isDone ? '#16161f' : '#7c3aed',
                color: isDone ? '#475569' : '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: isDone ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {isDone ? '✓' : `+${quest.xp_reward}`}
            </button>

            <button
              onClick={() => openEditForm(quest)}
              style={{
                padding: '8px',
                backgroundColor: '#16161f',
                border: '1px solid #1e1e2e',
                borderRadius: '8px',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ✏️
            </button>

            <button
              onClick={() => deleteQuest(quest)}
              style={{
                padding: '8px',
                backgroundColor: '#16161f',
                border: '1px solid #ef444420',
                borderRadius: '8px',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  }

  const questTypeOptions = [
    { value: 'daily_mandatory', label: t.quests.types.daily_mandatory || '🔴 Mandatory' },
    { value: 'daily_optional', label: t.quests.types.daily_optional || '🟡 Optional' },
    { value: 'weekly', label: t.quests.types.weekly || '🔵 Weekly' },
    { value: 'custom', label: t.quests.types.custom || '⚪ Custom' },
  ];

  const categoryOptions = [
    { value: 'income_action', label: t.quests.categories.income_action || '💰 Income' },
    { value: 'strategy', label: t.quests.categories.strategy || '🧠 Strategy' },
    { value: 'skill', label: t.quests.categories.skill || '📚 Skill' },
    { value: 'fitness', label: t.quests.categories.fitness || '💪 Fitness' },
    { value: 'other', label: t.quests.categories.other || '📌 Other' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0f',
        color: '#e2e8f0',
        padding: '16px',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>📋 {t.quests.title}</h1>
          <ProLimitBadge
            current={activeQuestCount}
            max={PRO_LIMITS.FREE_MAX_ACTIVE_QUESTS}
            isPro={isPro}
          />
        </div>
        <button
          onClick={openAddForm}
          disabled={!canCreate}
          style={{
            padding: '8px 16px',
            backgroundColor: canCreate ? '#7c3aed' : '#1e1e2e',
            color: canCreate ? '#fff' : '#475569',
            border: 'none',
            borderRadius: '8px',
            cursor: canCreate ? 'pointer' : 'not-allowed',
            fontSize: '13px',
            fontWeight: 600,
            opacity: canCreate ? 1 : 0.6,
          }}
        >
          {canCreate ? t.quests.newQuest : `🔒 ${t.quests.newQuest}`}
        </button>
      </div>

      {mandatory.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#ef4444',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px',
            }}
          >
            {t.quests.mandatory}
          </div>
          {mandatory.map(renderQuest)}
        </div>
      )}

      {optional.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px',
            }}
          >
            {t.quests.optional}
          </div>
          {optional.map(renderQuest)}
        </div>
      )}

      {quests.length === 0 && (
        <div
          style={{
            backgroundColor: '#12121a',
            border: '1px solid #1e1e2e',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: '#475569',
          }}
        >
          {t.quests.emptyState}
        </div>
      )}

      {showAddForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#0a0a0f',
              borderRadius: '20px',
              border: '1px solid #1e1e2e',
              padding: '24px',
              width: '100%',
              maxWidth: '450px',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
                {editingQuest ? t.quests.editTitle : t.quests.addTitle}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingQuest(null);
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#16161f',
                  border: '1px solid #1e1e2e',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}
              >
                {t.quests.form.name}
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t.quests.form.namePlaceholder}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#16161f',
                  border: '1px solid #1e1e2e',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}
              >
                {t.quests.form.description}
              </label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t.quests.form.descriptionPlaceholder}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#16161f',
                  border: '1px solid #1e1e2e',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}
              >
                {t.quests.form.questType}
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {questTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFormType(opt.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: formType === opt.value ? '#7c3aed20' : '#16161f',
                      border: `1px solid ${formType === opt.value ? '#7c3aed' : '#1e1e2e'}`,
                      color: '#e2e8f0',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}
              >
                {t.quests.form.category}
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {categoryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFormCategory(opt.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: formCategory === opt.value ? '#7c3aed20' : '#16161f',
                      border: `1px solid ${formCategory === opt.value ? '#7c3aed' : '#1e1e2e'}`,
                      color: '#e2e8f0',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#94a3b8',
                    marginBottom: '6px',
                  }}
                >
                  {t.quests.form.xpReward}
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[5, 10, 25, 50, 100].map((xp) => (
                    <button
                      key={xp}
                      onClick={() => setFormXP(xp)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: formXP === xp ? '#7c3aed' : '#16161f',
                        border: `1px solid ${formXP === xp ? '#7c3aed' : '#1e1e2e'}`,
                        color: formXP === xp ? '#fff' : '#e2e8f0',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      {xp}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}
              >
                {t.quests.form.targetCount}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setFormTarget(Math.max(1, formTarget - 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#16161f',
                    border: '1px solid #1e1e2e',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  -
                </button>
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#a78bfa',
                    minWidth: '40px',
                    textAlign: 'center',
                  }}
                >
                  {formTarget}
                </span>
                <button
                  onClick={() => setFormTarget(formTarget + 1)}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#16161f',
                    border: '1px solid #1e1e2e',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  +
                </button>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 5, 10, 30, 50].map((n) => (
                    <button
                      key={n}
                      onClick={() => setFormTarget(n)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: formTarget === n ? '#7c3aed20' : '#16161f',
                        border: `1px solid ${formTarget === n ? '#7c3aed' : '#1e1e2e'}`,
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '11px',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '12px',
                backgroundColor: '#16161f',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                {t.quests.form.totalForQuest}{' '}
              </span>
              <span style={{ color: '#a78bfa', fontSize: '16px', fontWeight: 700 }}>
                {formXP * formTarget} XP
              </span>
              <span style={{ color: '#475569', fontSize: '12px' }}>
                {' '}
                ({formTarget} × {formXP})
              </span>
            </div>

            <button
              onClick={handleSaveQuest}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {editingQuest ? t.quests.saveChanges : t.quests.createQuest}
            </button>
          </div>
        </div>
      )}

      <div style={{ height: '32px' }} />
    </div>
  );
}