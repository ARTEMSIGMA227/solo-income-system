'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Profile } from '@/types/database';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Форма
  const [displayName, setDisplayName] = useState('');
  const [dailyActionsTarget, setDailyActionsTarget] = useState(30);
  const [dailyIncomeTarget, setDailyIncomeTarget] = useState(5000);
  const [monthlyIncomeTarget, setMonthlyIncomeTarget] = useState(150000);
  const [penaltyXp, setPenaltyXp] = useState(100);
  const [focusDuration, setFocusDuration] = useState(90);
  const [timezone, setTimezone] = useState('Europe/Berlin');

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }

      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (p) {
        setProfile(p);
        setDisplayName(p.display_name);
        setDailyActionsTarget(p.daily_actions_target);
        setDailyIncomeTarget(p.daily_income_target);
        setMonthlyIncomeTarget(p.monthly_income_target);
        setPenaltyXp(p.penalty_xp);
        setFocusDuration(p.focus_duration_minutes);
        setTimezone(p.timezone);
      }

      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    if (!profile) return;
    if (!displayName.trim()) {
      toast.error('Введи имя');
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        daily_actions_target: dailyActionsTarget,
        daily_income_target: dailyIncomeTarget,
        monthly_income_target: monthlyIncomeTarget,
        penalty_xp: penaltyXp,
        focus_duration_minutes: focusDuration,
        timezone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    setSaving(false);

    if (error) {
      toast.error('Ошибка сохранения');
      return;
    }

    toast.success('Настройки сохранены! ⚔️');
  }

  async function handleResetStats() {
    if (!profile) return;
    const confirmed = confirm('⚠️ Сбросить ВСЮ статистику? XP, уровень, действия — всё обнулится. Это нельзя отменить!');
    if (!confirmed) return;

    const doubleConfirm = confirm('Ты точно уверен? Напиши в голове "ДА" и нажми ОК.');
    if (!doubleConfirm) return;

    const supabase = createClient();

    await supabase.from('stats').update({
      level: 1, current_xp: 0, total_xp_earned: 0,
      total_xp_lost: 0, total_sales: 0, total_clients: 0,
      total_income: 0, total_actions: 0,
      updated_at: new Date().toISOString(),
    }).eq('user_id', profile.id);

    await supabase.from('xp_events').delete().eq('user_id', profile.id);
    await supabase.from('completions').delete().eq('user_id', profile.id);
    await supabase.from('income_events').delete().eq('user_id', profile.id);
    await supabase.from('daily_summary').delete().eq('user_id', profile.id);

    toast.success('Статистика сброшена. Начинай заново, Охотник!');
    router.push('/dashboard');
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  }

  async function handleDeleteAccount() {
    const confirmed = confirm('⚠️ УДАЛИТЬ АККАУНТ? Все данные будут потеряны навсегда!');
    if (!confirmed) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Удаляем данные
    await supabase.from('character_config').delete().eq('user_id', user.id);
    await supabase.from('perk_unlocks').delete().eq('user_id', user.id);
    await supabase.from('xp_events').delete().eq('user_id', user.id);
    await supabase.from('completions').delete().eq('user_id', user.id);
    await supabase.from('income_events').delete().eq('user_id', user.id);
    await supabase.from('daily_summary').delete().eq('user_id', user.id);
    await supabase.from('bosses').delete().eq('user_id', user.id);
    await supabase.from('quests').delete().eq('user_id', user.id);
    await supabase.from('habits').delete().eq('user_id', user.id);
    await supabase.from('stats').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('id', user.id);

    await supabase.auth.signOut();
    toast.success('Аккаунт удалён');
    router.push('/auth');
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: '#0a0a0f', color: '#a78bfa',
      }}>
        ⏳ Загрузка...
      </div>
    );
  }

  function SettingInput({ label, value, onChange, type = 'text', suffix = '' }: {
    label: string; value: string | number;
    onChange: (v: any) => void; type?: string; suffix?: string;
  }) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
          {label}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
            style={{
              flex: 1, padding: '12px 16px', backgroundColor: '#16161f',
              border: '1px solid #1e1e2e', borderRadius: '8px', color: '#e2e8f0',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box',
            }}
          />
          {suffix && (
            <span style={{ fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{suffix}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#e2e8f0',
      padding: '16px', maxWidth: '600px', margin: '0 auto',
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>
        ⚙️ Настройки
      </h1>

      {/* Профиль */}
      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e',
        borderRadius: '12px', padding: '20px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
          👤 Профиль
        </div>

        <SettingInput
          label="Имя охотника"
          value={displayName}
          onChange={setDisplayName}
        />

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
            Часовой пояс
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px', backgroundColor: '#16161f',
              border: '1px solid #1e1e2e', borderRadius: '8px', color: '#e2e8f0',
              fontSize: '14px', outline: 'none',
            }}
          >
            <option value="Europe/Berlin">🇩🇪 Берлин (CET)</option>
            <option value="Europe/Moscow">🇷🇺 Москва (MSK)</option>
            <option value="Europe/Kiev">🇺🇦 Киев (EET)</option>
            <option value="Asia/Dubai">🇦🇪 Дубай (GST)</option>
            <option value="Asia/Bangkok">🇹🇭 Бангкок (ICT)</option>
            <option value="America/New_York">🇺🇸 Нью-Йорк (EST)</option>
            <option value="Asia/Tokyo">🇯🇵 Токио (JST)</option>
          </select>
        </div>
      </div>

      {/* Цели */}
      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e',
        borderRadius: '12px', padding: '20px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
          🎯 Цели
        </div>

        <SettingInput
          label="Целевой доход в месяц"
          value={monthlyIncomeTarget}
          onChange={setMonthlyIncomeTarget}
          type="number"
          suffix="₽/мес"
        />

        <SettingInput
          label="Целевой доход в день"
          value={dailyIncomeTarget}
          onChange={setDailyIncomeTarget}
          type="number"
          suffix="₽/день"
        />

        <SettingInput
          label="Целевых действий в день"
          value={dailyActionsTarget}
          onChange={setDailyActionsTarget}
          type="number"
          suffix="действий"
        />
      </div>

      {/* Система */}
      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e',
        borderRadius: '12px', padding: '20px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
          ⚡ Система
        </div>

        <SettingInput
          label="Штраф за пропуск дня"
          value={penaltyXp}
          onChange={setPenaltyXp}
          type="number"
          suffix="XP"
        />

        <SettingInput
          label="Фокус-режим"
          value={focusDuration}
          onChange={setFocusDuration}
          type="number"
          suffix="минут"
        />
      </div>

      {/* Кнопка сохранить */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%', padding: '14px', marginBottom: '16px',
          backgroundColor: saving ? '#4c1d95' : '#7c3aed',
          color: '#fff', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? '⏳ Сохраняю...' : '✅ Сохранить настройки'}
      </button>

      {/* Быстрые ссылки */}
      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e',
        borderRadius: '12px', padding: '16px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
          📱 Быстрые ссылки
        </div>

        <button
          onClick={() => router.push('/analytics')}
          style={{
            width: '100%', padding: '12px', marginBottom: '8px',
            backgroundColor: '#16161f', border: '1px solid #1e1e2e',
            borderRadius: '8px', color: '#e2e8f0', cursor: 'pointer',
            fontSize: '14px', textAlign: 'left',
          }}
        >
          📈 Аналитика и графики
        </button>

        <button
          onClick={() => router.push('/stats')}
          style={{
            width: '100%', padding: '12px',
            backgroundColor: '#16161f', border: '1px solid #1e1e2e',
            borderRadius: '8px', color: '#e2e8f0', cursor: 'pointer',
            fontSize: '14px', textAlign: 'left',
          }}
        >
          📊 Статы и перки
        </button>
      </div>

      {/* Опасная зона */}
      <div style={{
        backgroundColor: '#12121a', border: '1px solid #ef444430',
        borderRadius: '12px', padding: '20px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: '#ef4444' }}>
          ⚠️ Опасная зона
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '12px', marginBottom: '8px',
            backgroundColor: '#16161f', border: '1px solid #1e1e2e',
            borderRadius: '8px', color: '#f59e0b', cursor: 'pointer',
            fontSize: '14px', textAlign: 'left',
          }}
        >
          🚪 Выйти из аккаунта
        </button>

        <button
          onClick={handleResetStats}
          style={{
            width: '100%', padding: '12px', marginBottom: '8px',
            backgroundColor: '#16161f', border: '1px solid #ef444420',
            borderRadius: '8px', color: '#ef4444', cursor: 'pointer',
            fontSize: '14px', textAlign: 'left',
          }}
        >
          🔄 Сбросить статистику
        </button>

        <button
          onClick={handleDeleteAccount}
          style={{
            width: '100%', padding: '12px',
            backgroundColor: '#1a0f0f', border: '1px solid #ef444430',
            borderRadius: '8px', color: '#ef4444', cursor: 'pointer',
            fontSize: '14px', textAlign: 'left',
          }}
        >
          💀 Удалить аккаунт
        </button>
      </div>

      {/* Версия */}
      <div style={{ textAlign: 'center', color: '#475569', fontSize: '12px', marginBottom: '32px' }}>
        Solo Income System v1.0 ⚔️
      </div>

      <div style={{ height: '32px' }} />
    </div>
  );
}