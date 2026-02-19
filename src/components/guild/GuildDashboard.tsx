'use client';

import { useState } from 'react';
import { useMyGuild, useLeaveGuild, useManageMember } from '@/hooks/useGuild';
import GuildChat from './GuildChat';
import GuildQuestsPanel from './GuildQuestsPanel';
import GuildRequestsPanel from './GuildRequestsPanel';
import {
  Shield, Users, Crown, Star, LogOut, Copy, Check,
  MessageSquare, Swords, ClipboardList, UserMinus, ChevronUp, ChevronDown
} from 'lucide-react';

type Tab = 'members' | 'chat' | 'quests' | 'requests';

export default function GuildDashboard() {
  const { data, isLoading } = useMyGuild();
  const leaveGuild = useLeaveGuild();
  const manageMember = useManageMember();
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return <div className="text-center text-gray-400 py-8">Загрузка...</div>;
  }

  if (!data?.guild || !data?.membership) return null;

  const { guild, membership } = data;
  const isLeader = membership.role === 'leader';
  const isOfficer = membership.role === 'officer';
  const canManage = isLeader || isOfficer;

  const handleCopyCode = () => {
    void navigator.clipboard.writeText(guild.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    const msg = isLeader
      ? '⚠️ Вы лидер. Гильдия будет распущена! Продолжить?'
      : 'Покинуть гильдию?';

    if (confirm(msg)) {
      leaveGuild.mutate(undefined, {
        onError: (err) => alert(err.message),
      });
    }
  };

  const handleKick = (memberId: string, name: string) => {
    if (confirm(`Исключить ${name}?`)) {
      manageMember.mutate({ member_id: memberId, action: 'kick' });
    }
  };

  const handlePromote = (memberId: string, newRole: 'officer' | 'member') => {
    manageMember.mutate({ member_id: memberId, action: 'promote', role: newRole });
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case 'leader': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'officer': return <Star className="w-4 h-4 text-blue-400" />;
      default: return <Users className="w-4 h-4 text-gray-400" />;
    }
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'leader': return 'Лидер';
      case 'officer': return 'Офицер';
      default: return 'Участник';
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'members', label: 'Участники', icon: <Users className="w-4 h-4" /> },
    { key: 'chat', label: 'Чат', icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'quests', label: 'Квесты', icon: <Swords className="w-4 h-4" /> },
    ...(canManage ? [{ key: 'requests' as Tab, label: 'Заявки', icon: <ClipboardList className="w-4 h-4" /> }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Шапка гильдии */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{guild.name}</h2>
              {guild.description && (
                <p className="text-gray-400 text-sm mt-1">{guild.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-blue-400">Ур. {guild.level}</span>
                <span className="text-yellow-400">{guild.total_xp} XP</span>
                <span className="text-gray-400 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {guild.member_count}/{guild.max_members}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-sm text-gray-300 rounded-lg transition-colors"
              title="Копировать код приглашения"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {guild.invite_code}
            </button>
            <button
              onClick={handleLeave}
              className="p-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
              title="Покинуть гильдию"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Табы */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Контент */}
      {activeTab === 'members' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg divide-y divide-gray-700">
          {guild.members.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {roleIcon(member.role)}
                <div>
                  <span className="text-white font-medium">
                    {member.display_name ?? 'Охотник'}
                  </span>
                  <div className="text-xs text-gray-500">
                    {roleLabel(member.role)} · {member.xp_contributed} XP
                  </div>
                </div>
              </div>

              {isLeader && member.user_id !== membership.user_id && (
                <div className="flex items-center gap-1">
                  {member.role === 'member' ? (
                    <button
                      onClick={() => handlePromote(member.id, 'officer')}
                      className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                      title="Повысить до офицера"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  ) : member.role === 'officer' ? (
                    <button
                      onClick={() => handlePromote(member.id, 'member')}
                      className="p-1.5 text-orange-400 hover:bg-orange-900/30 rounded transition-colors"
                      title="Понизить до участника"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  ) : null}
                  <button
                    onClick={() => handleKick(member.id, member.display_name ?? 'Охотник')}
                    className="p-1.5 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                    title="Исключить"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'chat' && <GuildChat />}
      {activeTab === 'quests' && <GuildQuestsPanel canManage={canManage} />}
      {activeTab === 'requests' && canManage && <GuildRequestsPanel />}
    </div>
  );
}