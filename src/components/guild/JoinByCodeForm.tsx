'use client';

import { useState } from 'react';
import { useJoinGuild } from '@/hooks/useGuild';
import { useT } from '@/lib/i18n';
import { Key } from 'lucide-react';

export default function JoinByCodeForm() {
  const { t } = useT();
  const [code, setCode] = useState('');
  const joinGuild = useJoinGuild();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    joinGuild.mutate(
      { invite_code: code.trim() },
      {
        onSuccess: (data) => {
          if (data.joined) {
            alert(t.guilds.joinByCode.success);
          }
        },
        onError: (err) => alert(err.message),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
        <Key className="w-4 h-4" />
        {t.guilds.joinByCode.title}
      </h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t.guilds.joinByCode.placeholder}
          maxLength={8}
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm"
        />
        <button
          type="submit"
          disabled={joinGuild.isPending || !code.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
        >
          {joinGuild.isPending ? t.guilds.joinByCode.joining : t.guilds.joinByCode.submit}
        </button>
      </div>
    </form>
  );
}