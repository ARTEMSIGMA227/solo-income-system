'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';
import { toast } from 'sonner';
import {
  Shield, Crown, Search, UserCheck, UserX,
  Loader2, AlertTriangle, Clock, Users,
} from 'lucide-react';

interface UserRow {
  id: string;
  display_name: string;
  email?: string;
  is_pro: boolean;
  pro_until: string | null;
  created_at: string;
}

export default function AdminPage() {
  const { locale } = useT();
  const supabase = createClient();
  const ru = locale === 'ru';

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<UserRow | null>(null);
  const [searching, setSearching] = useState(false);
  const [activating, setActivating] = useState(false);
  const [days, setDays] = useState(30);
  const [recentPro, setRecentPro] = useState<UserRow[]>([]);

  const ADMIN_EMAILS = [
    'samoilov.a4tem@mail.ru',
  ];

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Проверяем по email
      if (ADMIN_EMAILS.includes(user.email || '')) {
        setIsAdmin(true);
        await loadRecentPro();
      }

      // Или проверяем по полю в profiles (если добавишь is_admin)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single();

      // Временно: первый зарегистрированный = админ
      // Можно убрать после настройки ADMIN_EMAILS
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadRecentPro() {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, is_pro, pro_until, created_at')
      .eq('is_pro', true)
      .order('pro_until', { ascending: false })
      .limit(10);
    setRecentPro(data || []);
  }

  async function handleSearch() {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchResult(null);

    try {
      // Ищем через profiles по display_name или напрямую
      // Supabase не даёт доступ к auth.users с клиента,
      // поэтому ищем по display_name
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, is_pro, pro_until, created_at')
        .or(`display_name.ilike.%${searchEmail.trim()}%`)
        .limit(1)
        .single();

      if (data) {
        setSearchResult(data);
      } else {
        toast.error(ru ? 'Пользователь не найден' : 'User not found');
      }
    } catch {
      toast.error(ru ? 'Пользователь не найден' : 'User not found');
    } finally {
      setSearching(false);
    }
  }

  async function activatePro(userId: string) {
    setActivating(true);
    try {
      const proUntil = new Date();
      proUntil.setDate(proUntil.getDate() + days);

      const { error } = await supabase
        .from('profiles')
        .update({
          is_pro: true,
          pro_until: proUntil.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success(
        ru
          ? `PRO активирован на ${days} дней!`
          : `PRO activated for ${days} days!`
      );

      // Обновляем результат поиска
      if (searchResult && searchResult.id === userId) {
        setSearchResult({ ...searchResult, is_pro: true, pro_until: proUntil.toISOString() });
      }
      await loadRecentPro();
    } catch (err) {
      toast.error(ru ? 'Ошибка активации' : 'Activation error');
      console.error(err);
    } finally {
      setActivating(false);
    }
  }

  async function deactivatePro(userId: string) {
    if (!confirm(ru ? 'Деактивировать PRO?' : 'Deactivate PRO?')) return;
    setActivating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_pro: false,
          pro_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success(ru ? 'PRO деактивирован' : 'PRO deactivated');

      if (searchResult && searchResult.id === userId) {
        setSearchResult({ ...searchResult, is_pro: false, pro_until: null });
      }
      await loadRecentPro();
    } catch (err) {
      toast.error(ru ? 'Ошибка' : 'Error');
      console.error(err);
    } finally {
      setActivating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {ru ? 'Доступ запрещён' : 'Access Denied'}
          </h2>
          <p className="text-gray-400">
            {ru ? 'Только администраторы могут видеть эту страницу' : 'Only admins can view this page'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Shield className="w-7 h-7 text-red-400" />
          {ru ? 'Админ-панель' : 'Admin Panel'}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {ru ? 'Управление подписками PRO' : 'Manage PRO subscriptions'}
        </p>
      </div>

      {/* Search User */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-400" />
          {ru ? 'Найти пользователя' : 'Find User'}
        </h3>
        <div className="flex gap-3">
          <input
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={ru ? 'Имя пользователя...' : 'Username...'}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchEmail.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {ru ? 'Найти' : 'Search'}
          </button>
        </div>

        {/* Search Result */}
        {searchResult && (
          <div className="mt-4 bg-gray-900 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-semibold">{searchResult.display_name}</p>
                <p className="text-xs text-gray-500">ID: {searchResult.id.slice(0, 8)}...</p>
              </div>
              <div>
                {searchResult.is_pro ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">
                    <Crown className="w-3 h-3" /> PRO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-700 text-gray-400 text-xs font-medium rounded-full">
                    Free
                  </span>
                )}
              </div>
            </div>

            {searchResult.is_pro && searchResult.pro_until && (
              <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {ru ? 'PRO до:' : 'PRO until:'}{' '}
                {new Date(searchResult.pro_until).toLocaleDateString(ru ? 'ru-RU' : 'en-US')}
              </p>
            )}

            <div className="flex items-center gap-3">
              {/* Duration selector */}
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
              >
                <option value={7}>7 {ru ? 'дней' : 'days'}</option>
                <option value={30}>30 {ru ? 'дней' : 'days'}</option>
                <option value={90}>90 {ru ? 'дней' : 'days'}</option>
                <option value={180}>180 {ru ? 'дней' : 'days'}</option>
                <option value={365}>365 {ru ? 'дней' : 'days'}</option>
              </select>

              <button
                onClick={() => activatePro(searchResult.id)}
                disabled={activating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 disabled:opacity-50"
              >
                {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                {ru ? 'Активировать PRO' : 'Activate PRO'}
              </button>

              {searchResult.is_pro && (
                <button
                  onClick={() => deactivatePro(searchResult.id)}
                  disabled={activating}
                  className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-600/30 disabled:opacity-50"
                >
                  <UserX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active PRO Users */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-yellow-400" />
          {ru ? 'Активные PRO' : 'Active PRO Users'}
          <span className="text-sm font-normal text-gray-400">({recentPro.length})</span>
        </h3>

        {recentPro.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            {ru ? 'Нет PRO пользователей' : 'No PRO users yet'}
          </p>
        ) : (
          <div className="space-y-2">
            {recentPro.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{user.display_name}</p>
                  <p className="text-xs text-gray-500">
                    {user.pro_until
                      ? `${ru ? 'до' : 'until'} ${new Date(user.pro_until).toLocaleDateString(ru ? 'ru-RU' : 'en-US')}`
                      : ru ? 'Бессрочно' : 'Unlimited'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <button
                    onClick={() => deactivatePro(user.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                    title={ru ? 'Деактивировать' : 'Deactivate'}
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}