'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  isPushSupported,
  getPermissionState,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from '@/lib/push';
import type { Profile } from '@/types/database';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const router = useRouter();

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
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
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

  useEffect(() => {
    const supported = isPushSupported();
    setPushSupported(supported);
    if (!supported) return;
    getCurrentSubscription().then((sub) => setPushEnabled(!!sub));
  }, []);

  const handlePushToggle = useCallback(async () => {
    setPushLoading(true);
    try {
      if (pushEnabled) {
        const ok = await unsubscribeFromPush();
        if (ok) { setPushEnabled(false); toast.success('Уведомления отключены'); }
        else { toast.error('Не удалось отключить'); }
      } else {
        if (getPermissionState() === 'denied') {
          toast.error('Уведомления заблокированы в браузере');
          setPushLoading(false);
          return;
        }
        const ok = await subscribeToPush();
        if (ok) { setPushEnabled(true); toast.success('Уведомления включены!'); }
        else { toast.error('Не удалось подписаться'); }
      }
    } catch { toast.error('Ошибка'); }
    setPushLoading(false);
  }, [pushEnabled]);

  async function handleTestPush() {
    setTestLoading(true);
    setTestStatus(null);
    try {
      const res = await fetch('/api/notifications/test', { method: 'POST' });
      const body: Record<string, unknown> = await res.json();
      if (!res.ok) {
        setTestStatus(`❌ ${(body.message as string) ?? res.statusText}`);
      } else {
        setTestStatus(`✅ Отправлено: ${body.sent}, очищено: ${body.cleaned}`);
      }
    } catch {
      setTestStatus('❌ Ошибка сети');
    }
    setTestLoading(false);
  }

  async function handleSave() {
    if (!profile) return;
    if (!displayName.trim()) { toast.error('Введи имя'); return; }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update({
      display_name: displayName.trim(),
      daily_actions_target: dailyActionsTarget,
      daily_income_target: dailyIncomeTarget,
      monthly_income_target: monthlyIncomeTarget,
      penalty_xp: penaltyXp,
      focus_duration_minutes: focusDuration,
      timezone,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);
    setSaving(false);
    if (error) { toast.error('Ошибка сохранения'); return; }
    toast.success('Настройки сохранены! ⚔️');
  }

  async function handleResetStats() {
    if (!profile) return;
    if (!confirm('⚠️ Сбросить ВСЮ статистику?')) return;
    if (!confirm('Точно уверен?')) return;
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
    toast.success('Статистика сброшена.');
    router.push('/dashboard');
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  }

  async function handleDeleteAccount() {
    if (!confirm('⚠️ УДАЛИТЬ АККАУНТ?')) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const tables = [
      'character_config', 'perk_unlocks', 'xp_events', 'completions',
      'income_events', 'daily_summary', 'bosses', 'quests', 'habits', 'stats',
    ];
    for (const t of tables) {
      await supabase.from(t).delete().eq('user_id', user.id);
    }
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

  function SettingInput<T extends string | number>({ label, value, onChange, type = 'text', suffix = '' }: {
    label: string; value: T;
    onChange: (v: T) => void; type?: string; suffix?: string;
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
            onChange={(e) => onChange((type === 'number' ? Number(e.target.value) : e.target.value) as T)}
            style={{
              flex: 1, padding: '12px 16px', backgroundColor: '#16161f',
              border: '1px solid #1e1e2e', borderRadius: '8px', color: '#e2e8f0',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box',
            }}
          />
          {suffix && <span style={{ fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>{suffix}</span>}
        </div>
      </div>
    );
  }

  const cardStyle = {
    backgroundColor: '#12121a', border: '1px solid #1e1e2e',
    borderRadius: '12px', padding: '20px', marginBottom: '16px',
  };

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#e2e8f0',
      padding: '16px', maxWidth: '600px', margin: '0 auto',
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>⚙️ Настройки</h1>

      {/* Профиль */}
      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>👤 Профиль</div>
        <SettingInput label="Имя охотника" value={displayName} onChange={setDisplayName} />
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Часовой пояс</label>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={{
            width: '100%', padding: '12px 16px', backgroundColor: '#16161f',
            border: '1px solid #1e1e2e', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', outline: 'none',
          }}>
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
      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>🎯 Цели</div>
        <SettingInput label="Целевой доход в месяц" value={monthlyIncomeTarget} onChange={setMonthlyIncomeTarget} type="number" suffix="₽/мес" />
        <SettingInput label="Целевой доход в день" value={dailyIncomeTarget} onChange={setDailyIncomeTarget} type="number" suffix="₽/день" />
        <SettingInput label="Целевых действий в день" value={dailyActionsTarget} onChange={setDailyActionsTarget} type="number" suffix="действий" />
      </div>

      {/* Система */}
      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>⚡ Система</div>
        <SettingInput label="Штраф за пропуск дня" value={penaltyXp} onChange={setPenaltyXp} type="number" suffix="XP" />
        <SettingInput label="Фокус-режим" value={focusDuration} onChange={setFocusDuration} type="number" suffix="минут" />
      </div>

      {/* Сохранить */}
      <button onClick={handleSave} disabled={saving} style={{
        width: '100%', padding: '14px', marginBottom: '16px',
        backgroundColor: saving ? '#4c1d95' : '#7c3aed',
        color: '#fff', border: 'none', borderRadius: '10px',
        fontSize: '16px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
      }}>
        {saving ? '⏳ Сохраняю...' : '✅ Сохранить настройки'}
      </button>

      {/* Ссылки */}
      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>📱 Быстрые ссылки</div>
        {[
          { href: '/analytics', label: '📈 Аналитика и графики' },
          { href: '/stats', label: '📊 Статы и перки' },
        ].map((link) => (
          <button key={link.href} onClick={() => router.push(link.href)} style={{
            width: '100%', padding: '12px', marginBottom: '8px',
            backgroundColor: '#16161f', border: '1px solid #1e1e2e',
            borderRadius: '8px', color: '#e2e8f0', cursor: 'pointer', fontSize: '14px', textAlign: 'left',
          }}>{link.label}</button>
        ))}
      </div>

      {/* ═══════════════ PUSH-УВЕДОМЛЕНИЯ ═══════════════ */}
      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>🔔 Push-уведомления</div>

        {!pushSupported && (
          <div style={{ fontSize: '12px', color: '#f59e0b', padding: '8px 12px', backgroundColor: '#16161f', borderRadius: '8px' }}>
            Браузер не поддерживает push-уведомления. Попробуй Chrome или Edge.
          </div>
        )}

        {pushSupported && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '14px' }}>Напоминания о плане</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Утром, вечером и перед дедлайном
                </div>
              </div>
              <button onClick={handlePushToggle} disabled={pushLoading} style={{
                padding: '8px 20px', borderRadius: '20px', border: 'none',
                backgroundColor: pushEnabled ? '#22c55e' : '#16161f',
                color: pushEnabled ? '#fff' : '#94a3b8',
                cursor: pushLoading ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease',
              }}>
                {pushLoading ? '...' : pushEnabled ? '✓ Вкл' : 'Выкл'}
              </button>
            </div>

            {pushEnabled && (
              <div style={{
                fontSize: '11px', color: '#475569', padding: '8px 12px',
                backgroundColor: '#16161f', borderRadius: '8px', marginBottom: '12px',
              }}>
                📌 10:00 — утренняя мотивация<br />
                📌 18:00 — предупреждение если &lt;50%<br />
                📌 21:00 — последний шанс закрыть день
              </div>
            )}

            {!pushEnabled && getPermissionState() === 'denied' && (
              <div style={{
                fontSize: '11px', color: '#ef4444', padding: '8px 12px',
                backgroundColor: '#1a0f0f', borderRadius: '8px', marginBottom: '12px',
              }}>
                Уведомления заблокированы в браузере. Разблокируй в настройках сайта.
              </div>
            )}
          </>
        )}

        {/* ★ КНОПКА ТЕСТОВОГО PUSH — ВСЕГДА ВИДНА ★ */}
        <button
          onClick={handleTestPush}
          disabled={testLoading}
          style={{
            width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
            backgroundColor: '#3b82f6', color: '#fff', fontSize: '13px',
            fontWeight: 600, cursor: testLoading ? 'not-allowed' : 'pointer',
            opacity: testLoading ? 0.6 : 1, transition: 'all 0.2s ease',
          }}
        >
          {testLoading ? '⏳ Отправляю...' : '🔔 Отправить тестовое уведомление'}
        </button>
        {testStatus && (
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>
            {testStatus}
          </div>
        )}
      </div>

      {/* Опасная зона */}
      <div style={{
        backgroundColor: '#12121a', border: '1px solid #ef444430',
        borderRadius: '12px', padding: '20px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: '#ef4444' }}>⚠️ Опасная зона</div>
        {[
          { fn: handleLogout, label: '🚪 Выйти из аккаунта', color: '#f59e0b', border: '#1e1e2e', bg: '#16161f' },
          { fn: handleResetStats, label: '🔄 Сбросить статистику', color: '#ef4444', border: '#ef444420', bg: '#16161f' },
          { fn: handleDeleteAccount, label: '💀 Удалить аккаунт', color: '#ef4444', border: '#ef444430', bg: '#1a0f0f' },
        ].map((btn) => (
          <button key={btn.label} onClick={btn.fn} style={{
            width: '100%', padding: '12px', marginBottom: '8px',
            backgroundColor: btn.bg, border: `1px solid ${btn.border}`,
            borderRadius: '8px', color: btn.color, cursor: 'pointer', fontSize: '14px', textAlign: 'left',
          }}>{btn.label}</button>
        ))}
      </div>

      <div style={{ textAlign: 'center', color: '#475569', fontSize: '12px', marginBottom: '32px' }}>
        Solo Income System v1.0 ⚔️
      </div>
      <div style={{ height: '32px' }} />
    </div>
  );
}