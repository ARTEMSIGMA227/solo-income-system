'use client';

import { useState } from 'react';
import { usePublicGuilds, useJoinGuild } from '@/hooks/useGuild';
import { Users, Shield, Search, UserPlus } from 'lucide-react';

export default function GuildBrowser() {
  const [search, setSearch] = useState('');
  const { data: guilds, isLoading } = usePublicGuilds(search);
  const joinGuild = useJoinGuild();

  const handleJoin = (guildId: string) => {
    joinGuild.mutate(
      { guild_id: guildId },
      {
        onSuccess: (data) => {
          if (data.joined) {
            alert('✅ Вы вступили в гильдию!');
          } else if (data.request_sent) {
            alert('📩 Заявка отправлена');
          }
        },
        onError: (err) => alert(err.message),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск гильдий..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 py-8">Загрузка...</div>
      ) : !guilds?.length ? (
        <div className="text-center text-gray-400 py-8">Гильдии не найдены</div>
      ) : (
        <div className="space-y-3">
          {guilds.map((guild) => (
            <div
              key={guild.id}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{guild.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {guild.member_count}/{guild.max_members}
                    </span>
                    <span>Ур. {guild.level}</span>
                    <span>{guild.total_xp} XP</span>
                  </div>
                  {guild.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{guild.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleJoin(guild.id)}
                disabled={joinGuild.isPending || guild.member_count >= guild.max_members}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                {guild.member_count >= guild.max_members ? 'Полная' : 'Вступить'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}