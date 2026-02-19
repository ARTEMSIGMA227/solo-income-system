'use client';

import { useState } from 'react';
import { useCreateGuild } from '@/hooks/useGuild';
import { Plus, Globe, Lock } from 'lucide-react';

export default function CreateGuildForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [maxMembers, setMaxMembers] = useState(20);
  const createGuild = useCreateGuild();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGuild.mutate(
      { name, description, is_public: isPublic, max_members: maxMembers },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
        },
        onError: (err) => alert(err.message),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Plus className="w-5 h-5" />
        Создать гильдию
      </h3>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Название</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Охотники Тени"
          maxLength={30}
          required
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Описание</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание вашей гильдии..."
          rows={2}
          maxLength={200}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Макс. участников</label>
          <select
            value={maxMembers}
            onChange={(e) => setMaxMembers(Number(e.target.value))}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            {[5, 10, 15, 20, 30, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Тип</label>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              isPublic
                ? 'bg-green-900/30 border-green-700 text-green-400'
                : 'bg-red-900/30 border-red-700 text-red-400'
            }`}
          >
            {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {isPublic ? 'Публичная' : 'Приватная'}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={createGuild.isPending || name.trim().length < 2}
        className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all"
      >
        {createGuild.isPending ? 'Создание...' : 'Создать гильдию'}
      </button>
    </form>
  );
}