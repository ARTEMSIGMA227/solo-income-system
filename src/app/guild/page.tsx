'use client';

import { useMyGuild } from '@/hooks/useGuild';
import GuildDashboard from '@/components/guild/GuildDashboard';
import GuildBrowser from '@/components/guild/GuildBrowser';
import CreateGuildForm from '@/components/guild/CreateGuildForm';
import JoinByCodeForm from '@/components/guild/JoinByCodeForm';
import { Shield } from 'lucide-react';

export default function GuildPage() {
  const { data, isLoading } = useMyGuild();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    );
  }

  const hasGuild = !!data?.guild;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold">Гильдия</h1>
            <p className="text-gray-400 text-sm">
              {hasGuild
                ? 'Управляйте вашей гильдией'
                : 'Создайте или вступите в гильдию'}
            </p>
          </div>
        </div>

        {hasGuild ? (
          <GuildDashboard />
        ) : (
          <div className="space-y-8">
            <JoinByCodeForm />
            <CreateGuildForm />
            <div>
              <h2 className="text-xl font-bold mb-4">Обзор гильдий</h2>
              <GuildBrowser />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}