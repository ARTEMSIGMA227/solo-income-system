'use client';

import { useGuildRequests, useHandleRequest } from '@/hooks/useGuild';
import { useT } from '@/lib/i18n';
import { UserCheck, UserX, Clock } from 'lucide-react';

interface RequestWithName {
  id: string;
  guild_id: string;
  user_id: string;
  message: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  display_name?: string;
}

export default function GuildRequestsPanel() {
  const { t, locale } = useT();
  const { data: requests, isLoading } = useGuildRequests();
  const handleRequest = useHandleRequest();

  if (isLoading) {
    return (
      <div className="text-center text-gray-400 py-8">
        {t.guilds.guildRequests.loading}
      </div>
    );
  }

  const typedRequests = (requests ?? []) as RequestWithName[];

  if (typedRequests.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 bg-gray-800/50 border border-gray-700 rounded-lg">
        {t.guilds.guildRequests.empty}
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg divide-y divide-gray-700">
      {typedRequests.map((req) => (
        <div key={req.id} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-yellow-400" />
            <div>
              <span className="text-white text-sm font-medium">
                {req.display_name ?? t.guilds.guildRequests.hunterLabel(req.user_id.slice(0, 4))}
              </span>
              {req.message && (
                <p className="text-xs text-gray-400 mt-0.5">{req.message}</p>
              )}
              <span className="text-xs text-gray-600 block mt-0.5">
                {new Date(req.created_at).toLocaleDateString(
                  locale === 'ru' ? 'ru-RU' : 'en-US',
                  {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                handleRequest.mutate({ request_id: req.id, action: 'accept' })
              }
              disabled={handleRequest.isPending}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              title={t.guilds.guildRequests.accept}
            >
              <UserCheck className="w-4 h-4" />
              {t.guilds.guildRequests.accept}
            </button>
            <button
              onClick={() =>
                handleRequest.mutate({ request_id: req.id, action: 'reject' })
              }
              disabled={handleRequest.isPending}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              title={t.guilds.guildRequests.reject}
            >
              <UserX className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}