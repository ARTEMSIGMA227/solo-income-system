'use client';

import { useState, useRef, useEffect } from 'react';
import { useGuildChat, useSendMessage } from '@/hooks/useGuild';
import { Send } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function GuildChat() {
  const { data: messages, isLoading } = useGuildChat();
  const sendMessage = useSendMessage();
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useT();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    sendMessage.mutate(content.trim(), {
      onSuccess: () => setContent(''),
    });
  };

  const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US';

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return t.common.today;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return t.common.yesterday;
    return d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
  };

  // Группируем сообщения по дням
  const groupedMessages: { date: string; messages: NonNullable<typeof messages> }[] = [];
  let currentDate = '';

  (messages ?? []).forEach((msg) => {
    const date = new Date(msg.created_at).toDateString();
    if (date !== currentDate) {
      currentDate = date;
      groupedMessages.push({ date: msg.created_at, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg flex flex-col h-[500px]">
      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-400 py-8">{t.common.loading}</div>
        ) : !messages?.length ? (
          <div className="text-center text-gray-500 py-8">
            {t.guilds.chat.empty}
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-xs text-gray-500 px-2">
                  {formatDate(group.date)}
                </span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>
              {group.messages.map((msg) => (
                <div key={msg.id} className="mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-blue-400">
                      {msg.display_name}
                    </span>
                    <span className="text-xs text-gray-600">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-0.5 break-words">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Ввод */}
      <form onSubmit={handleSend} className="border-t border-gray-700 p-3 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t.guilds.chat.placeholder}
          maxLength={500}
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={sendMessage.isPending || !content.trim()}
          className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
