'use client';

import { useGuildRequests, useHandleRequest } from '@/hooks/useGuild';
import { UserCheck, UserX, Clock } from 'lucide-react';

export default function GuildRequestsPanel() {
  const { data: requests, isLoading } = useGuildRequests();
  const handleRequest = useHandleRequest();

  if (isLoading) {
    return <div className="text-center text-gray-400 py-8">Загрузка...</div>;
  }

  if (!requests?.length) {
    return (
      <div className="text-center text-gray-500 py-8 bg-gray-800/50 border border-gray-700 rounded-lg">
        Нет ожидающих заявок
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg divide-y divide-gray-700">
      {requests.map((req) => (
        <div key={req.id} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-yellow-400" />
            <div>
              <span className="text-white text-sm">ID: {req.user_id.slice(0, 8)}...</span>
              {req.message && (
                <p className="text-xs text-gray-400 mt-0.5">{req.message}</p>
              )}
              <span className="text-xs text-gray-600">
                {new Date(req.created_at).toLocaleDateString('ru-RU')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                handleRequest.mutate({ request_id: req.id, action: 'accept' })
              }
              disabled={handleRequest.isPending}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              title="Принять"
            >
              <UserCheck className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                handleRequest.mutate({ request_id: req.id, action: 'reject' })
              }
              disabled={handleRequest.isPending}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              title="Отклонить"
            >
              <UserX className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}