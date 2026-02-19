'use client';

import { useState } from 'react';
import { useGuildQuests, useCreateGuildQuest, useContributeQuest } from '@/hooks/useGuild';
import { Swords, Plus, Target, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Props {
  canManage: boolean;
}

export default function GuildQuestsPanel({ canManage }: Props) {
  const { data: quests, isLoading } = useGuildQuests();
  const createQuest = useCreateGuildQuest();
  const contribute = useContributeQuest();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState(10);
  const [xpReward, setXpReward] = useState(200);
  const [goldReward, setGoldReward] = useState(100);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createQuest.mutate(
      {
        title,
        description,
        target_value: targetValue,
        xp_reward: xpReward,
        gold_reward: goldReward,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setTitle('');
          setDescription('');
        },
        onError: (err) => alert(err.message),
      }
    );
  };

  const handleContribute = (questId: string) => {
    contribute.mutate(
      { quest_id: questId, value: 1 },
      {
        onSuccess: (data) => {
          if (data.completed) {
            alert('🎉 Квест выполнен!');
          }
        },
        onError: (err) => alert(err.message),
      }
    );
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'expired': return <Clock className="w-4 h-4 text-gray-400" />;
      default: return <Target className="w-4 h-4 text-blue-400" />;
    }
  };

  const activeQuests = (quests ?? []).filter((q) => q.status === 'active');
  const completedQuests = (quests ?? []).filter((q) => q.status !== 'active');

  return (
    <div className="space-y-4">
      {canManage && (
        <div>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Создать квест
            </button>
          ) : (
            <form
              onSubmit={handleCreate}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3"
            >
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название квеста"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание (необязательно)"
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 resize-none"
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Цель</label>
                  <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    min={1}
                    className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">XP награда</label>
                  <input
                    type="number"
                    value={xpReward}
                    onChange={(e) => setXpReward(Number(e.target.value))}
                    min={0}
                    className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Золото</label>
                  <input
                    type="number"
                    value={goldReward}
                    onChange={(e) => setGoldReward(Number(e.target.value))}
                    min={0}
                    className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createQuest.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
                >
                  {createQuest.isPending ? 'Создание...' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg"
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-gray-400 py-8">Загрузка...</div>
      ) : (
        <>
          {/* Активные квесты */}
          {activeQuests.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Активные квесты
              </h3>
              {activeQuests.map((quest) => {
                const progress = quest.target_value > 0
                  ? Math.round((quest.current_value / quest.target_value) * 100)
                  : 0;

                return (
                  <div
                    key={quest.id}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Swords className="w-4 h-4 text-blue-400" />
                        <h4 className="font-medium text-white">{quest.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-yellow-400">{quest.xp_reward} XP</span>
                        <span className="text-amber-400">{quest.gold_reward} 🪙</span>
                      </div>
                    </div>
                    {quest.description && (
                      <p className="text-sm text-gray-400 mb-3">{quest.description}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {quest.current_value}/{quest.target_value} ({progress}%)
                        </span>
                      </div>
                      <button
                        onClick={() => handleContribute(quest.id)}
                        disabled={contribute.isPending}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded-lg transition-colors"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Завершённые квесты */}
          {completedQuests.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Завершённые
              </h3>
              {completedQuests.map((quest) => (
                <div
                  key={quest.id}
                  className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3 opacity-70"
                >
                  <div className="flex items-center gap-2">
                    {statusIcon(quest.status)}
                    <span className="text-sm text-gray-300">{quest.title}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {quest.current_value}/{quest.target_value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!activeQuests.length && !completedQuests.length && (
            <div className="text-center text-gray-500 py-8">
              Нет квестов. {canManage ? 'Создайте первый!' : 'Лидер скоро добавит квесты.'}
            </div>
          )}
        </>
      )}
    </div>
  );
}