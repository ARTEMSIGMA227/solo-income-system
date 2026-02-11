'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { XP_REWARDS } from '@/lib/constants';
import { getLevelInfo } from '@/lib/xp';
import { toast } from 'sonner';
import type { Quest, Completion, Stats } from '@/types/database';

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  function getToday() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
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
  }, []);

  function getQuestProgress(quest: Quest): number {
    const questCompletions = completions.filter(c => c.quest_id === quest.id);
    return questCompletions.reduce((sum, c) => sum + c.count_done, 0);
  }

  async function doQuest(quest: Quest) {
    if (!userId || !stats) return;
    const today = getToday();
    const current = getQuestProgress(quest);

    if (current >= quest.target_count) {
      toast('Уже выполнено!');
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
      setCompletions(prev => [...prev, newCompletion]);
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
  }

  async function addCustomQuest() {
    const title = prompt('Название квеста:');
    if (!title || !userId) return;

    const xpStr = prompt('XP за выполнение (5/25/50):', '25');
    const xp = Number(xpStr) || 25;

    const { data: newQuest } = await supabase
      .from('quests')
      .insert({
        user_id: userId,
        title,
        quest_type: 'custom',
        category: 'other',
        xp_reward: xp,
        target_count: 1,
        is_template: false,
      })
      .select()
      .single();

    if (newQuest) {
      setQuests(prev => [...prev, newQuest]);
      toast.success('Квест добавлен!');
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: '#0a0a0f', color: '#a78bfa',
      }}>
        ⏳ Загрузка квестов...
      </div>
    );
  }

  const mandatory = quests.filter(q => q.quest_type === 'daily_mandatory');
  const optional = quests.filter(q => q.quest_type !== 'daily_mandatory');

  function getCategoryIcon(cat: string) {
    switch (cat) {
      case 'income_action': return '📞';
      case 'strategy': return '🧠';
      case 'skill': return '📚';
      case 'fitness': return '💪';
      default: return '📌';
    }
  }

  function renderQuest(quest: Quest) {
    const progress = getQuestProgress(quest);
    const isDone = progress >= quest.target_count;
    const percent = Math.min(Math.round((progress / quest.target_count) * 100), 100);

    return (
      <div key={quest.id} style={{
        backgroundColor: isDone ? '#12201a' : '#12121a',
        border: `1px solid ${isDone ? '#22c55e30' : '#1e1e2e'}`,
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span>{getCategoryIcon(quest.category)}</span>
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: isDone ? 'line-through' : 'none',
                color: isDone ? '#22c55e' : '#e2e8f0',
              }}>
                {quest.title}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                flex: 1, height: '6px', backgroundColor: '#16161f',
                borderRadius: '3px', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${percent}%`, height: '100%', borderRadius: '3px',
                  backgroundColor: isDone ? '#22c55e' : '#7c3aed',
                  transition: 'width 0.3s',
                }} />
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8', minWidth: '50px', textAlign: 'right' }}>
                {progress}/{quest.target_count}
              </span>
            </div>
          </div>

          <button
            onClick={() => doQuest(quest)}
            disabled={isDone}
            style={{
              marginLeft: '12px',
              padding: '10px 14px',
              backgroundColor: isDone ? '#16161f' : '#7c3aed',
              color: isDone ? '#475569' : '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: isDone ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {isDone ? '✓' : `+${quest.xp_reward} XP`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#e2e8f0',
      padding: '16px', maxWidth: '600px', margin: '0 auto',
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
        📋 Квесты дня
      </h1>

      {/* Обязательные */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '13px', fontWeight: 600, color: '#ef4444',
          textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px',
        }}>
          🔴 Обязательные
        </div>
        {mandatory.map(renderQuest)}
      </div>

      {/* Дополнительные */}
      {optional.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '13px', fontWeight: 600, color: '#94a3b8',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px',
          }}>
            Дополнительные
          </div>
          {optional.map(renderQuest)}
        </div>
      )}

      {/* Добавить квест */}
      <button
        onClick={addCustomQuest}
        style={{
          width: '100%', padding: '14px',
          backgroundColor: '#12121a', border: '1px dashed #1e1e2e',
          borderRadius: '12px', color: '#94a3b8', cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        + Добавить свой квест
      </button>
    </div>
  );
}