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

  useEffect(() => {
    const supported = isPushSupported();
    setPushSupported(supported);
    if (!supported) return;

    async function checkAndSubscribe() {
      const existing = await getCurrentSubscription();
      if (existing) {
        setPushEnabled(true);
        return;
      }
      const permission = getPermissionState();
      if (permission === 'granted') {
        const ok = await subscribeToPush();
        setPushEnabled(ok);
      }
    }

    checkAndSubscribe();
  }, []);

  const handlePushToggle = useCallback(async () => {
    setPushLoading(true);
    try {
      if (pushEnabled) {
        const ok = await unsubscribeFromPush();
        if (ok) { setPushEnabled(false); toast.success('\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u044B'); }
        else { toast.error('\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u044C'); }
      } else {
        if (getPermissionState() === 'denied') {
          toast.error('\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u044B \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435');
          setPushLoading(false);
          return;
        }
        const ok = await subscribeToPush();
        if (ok) { setPushEnabled(true); toast.success('\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u044B!'); }
        else { toast.error('\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F'); }
      }
    } catch { toast.error('\u041E\u0448\u0438\u0431\u043A\u0430'); }
    setPushLoading(false);
  }, [pushEnabled]);

  async function handleTestPush() {
    setTestLoading(true);
    setTestStatus(null);
    try {
      if (!pushEnabled) {
        const ok = await subscribeToPush();
        if (ok) setPushEnabled(true);
      }

      const res = await fetch('/api/notifications/test', { method: 'POST' });
      const body: Record<string, unknown> = await res.json();
      if (!res.ok) {
        setTestStatus('\u274C ' + ((body.error as string) ?? res.statusText));
      } else {
        setTestStatus('\u2705 \u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E: ' + String(body.sent));
      }
    } catch {
      setTestStatus('\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0442\u0438');
    }
    setTestLoading(false);
  }

  async function handleSave() {
    if (!profile) return;
    if (!displayName.trim()) { toast.error('\u0412\u0432\u0435\u0434\u0438 \u0438\u043C\u044F'); return; }
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
    if (error) { toast.error('\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F'); return; }
    toast.success('\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B! \u2694\uFE0F');
  }

  async function handleResetStats() {
    if (!profile) return;
    if (!confirm('\u26A0\uFE0F \u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0412\u0421\u042E \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0443?')) return;
    if (!confirm('\u0422\u043E\u0447\u043D\u043E \u0443\u0432\u0435\u0440\u0435\u043D?')) return;
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
    toast.success('\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u0430.');
    router.push('/dashboard');
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  }

  async function handleDeleteAccount() {
    if (!confirm('\u26A0\uFE0F \u0423\u0414\u0410\u041B\u0418\u0422\u042C \u0410\u041A\u041A\u0410\u0423\u041D\u0422?')) return;
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
    toast.success('\u0410\u043A\u043A\u0430\u0443\u043D\u0442 \u0443\u0434\u0430\u043B\u0451\u043D');
    router.push('/auth');
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: '#0a0a0f', color: '#a78bfa',
      }}>
        {'\u23F3'} \u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...
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
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>
        {'\u2699\uFE0F'} {'\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438'}
      </h1>

      {/* \u041F\u0440\u043E\u0444\u0438\u043B\u044C */}
      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
          {'\uD83D\uDC64'} {'\u041F\u0440\u043E\u0444\u0438\u043B\u044C'}
        </div>
        <SettingInput label={'\u0418\u043C\u044F \u043E\u0445\u043E\u0442\u043D\u0438\u043A\u0430'} value={displayName} onChange={setDisplayName} />
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
            {'\u0427\u0430\u0441\u043E\u0432\u043E\u0439 \u043F\u043E\u044F\u0441'}
          </label>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={{
            width: '100%', padding: '12px 16px', backgroundColor: '#16161f',
            border: '1px solid #1e1e2e', borderRadius: '8px', color: '#e2e8f0',
            fontSize: '14px', outline: 'none',
          }}>
            <option value="Europe/Berlin">{'\uD83C\uDDE9\uD83C\uDDEA'} {'\u0411\u0435\u0440\u043B\u0438\u043D'} (CET)</option>
            <option value="Europe/Moscow">{'\uD83C\uDDF7\uD83C\uDDFA'} {'\u041C\u043E\u0441\u043A\u0432\u0430'} (MSK)</option>
            <option value="Europe/Kiev">{'\uD83C\uDDFA\uD83C\uDDE6'} {'\u041A\u0438\u0435\u0432'} (EET)</option>
            <option value="Asia/Dubai">{'\uD83C\uDDE6\uD83C\uDDEA'} {'\u0414\u0443\u0431\u0430\u0439'} (GST)</option>
            <option value="Asia/Bangkok">{'\uD83C\uDDF9\uD83C\uDDED'} {'\u0411\u0430\u043D\u0433\u043A\u043E\u043A'} (ICT)</option>
            <option value="America/New_York">{'\uD83C\uDDFA\uD83C\uDDF8'} {'\u041D\u044C\u044E-\u0419\u043E\u0440\u043A'} (EST)</option>
            <option value="Asia/Tokyo">{'\uD83C\uDDEF\uD83C\uDDF5'} {'\u0422\u043E\u043A\u0438\u043E'} (JST)</option>
          </select>
        </div>
      </div>

      {/* \u0426\u0435\u043B\u0438 */}
      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
          {'\uD83C\uDFAF'} {'\u0426\u0435\u043B\u0438'}
        </div>
        <SettingInput label={'\u0426\u0435\u043B\u0435\u0432\u043E\u0439 \u0434\u043E\u0445\u043E\u0434 \u0432 \u043C\u0435\u0441\u044F\u0446'} value={monthlyIncomeTarget} onChange={setMonthlyIncomeTarget} type="number" suffix={'\u20BD/\u043C\u0435\u0441'} />
        <SettingInput label={'\u0426\u0435\u043B\u0435\u0432\u043E\u0439 \u0434\u043E\u0445\u043E\u0434 \u0432 \u0434\u0435\u043D\u044C'} value={dailyIncomeTarget} onChange={setDailyIncomeTarget} type="number" suffix={'\u20BD/\u0434\u0435\u043D\u044C'} />
        <SettingInput label={'\u0426\u0435\u043B\u0435\u0432\u044B\u0445 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u0432 \u0434\u0435\u043D\u044C'} value={dailyActionsTarget} onChange={setDailyActionsTarget} type="number" suffix={'\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439'} />
      </div>

      {/* \u0421\u0438\u0441\u0442\u0435\u043C\u0430 */}
      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
          {'\u26A1'} {'\u0421\u0438\u0441\u0442\u0435\u043C\u0430'}
        </div>
        <SettingInput label={'\u0428\u0442\u0440\u0430\u0444 \u0437\u0430 \u043F\u0440\u043E\u043F\u0443\u0441\u043A \u0434\u043D\u044F'} value={penaltyXp} onChange={setPenaltyXp} type="number" suffix="XP" />
        <SettingInput label={'\u0424\u043E\u043A\u0443\u0441-\u0440\u0435\u0436\u0438\u043C'} value={focusDuration} onChange={setFocusDuration} type="number" suffix={'\u043C\u0438\u043D\u0443\u0442'} />
      </div>

      {/* \u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C */}
      <button onClick={handleSave} disabled={saving} style={{
        width: '100%', padding: '14px', marginBottom: '16px',
        backgroundColor: saving ? '#4c1d95' : '#7c3aed',
        color: '#fff', border: 'none', borderRadius: '10px',
        fontSize: '16px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
      }}>
        {saving ? '\u23F3 \u0421\u043E\u0445\u0440\u0430\u043D\u044F\u044E...' : '\u2705 \u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438'}
      </button>

      {/* \u0421\u0441\u044B\u043B\u043A\u0438 */}
      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
          {'\uD83D\uDCF1'} {'\u0411\u044B\u0441\u0442\u0440\u044B\u0435 \u0441\u0441\u044B\u043B\u043A\u0438'}
        </div>
        {[
          { href: '/analytics', label: '\uD83D\uDCC8 \u0410\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430 \u0438 \u0433\u0440\u0430\u0444\u0438\u043A\u0438' },
          { href: '/stats', label: '\uD83D\uDCCA \u0421\u0442\u0430\u0442\u044B \u0438 \u043F\u0435\u0440\u043A\u0438' },
        ].map((link) => (
          <button key={link.href} onClick={() => router.push(link.href)} style={{
            width: '100%', padding: '12px', marginBottom: '8px',
            backgroundColor: '#16161f', border: '1px solid #1e1e2e',
            borderRadius: '8px', color: '#e2e8f0', cursor: 'pointer',
            fontSize: '14px', textAlign: 'left',
          }}>{link.label}</button>
        ))}
      </div>

      {/* Push */}
      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
          {'\uD83D\uDD14'} Push-{'\u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F'}
        </div>

        {!pushSupported && (
          <div style={{
            fontSize: '12px', color: '#f59e0b', padding: '8px 12px',
            backgroundColor: '#16161f', borderRadius: '8px',
          }}>
            {'\u0411\u0440\u0430\u0443\u0437\u0435\u0440 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 push-\u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 Chrome \u0438\u043B\u0438 Edge.'}
          </div>
        )}

        {pushSupported && (
          <>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '12px',
            }}>
              <div>
                <div style={{ fontSize: '14px' }}>{'\u041D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u044F \u043E \u043F\u043B\u0430\u043D\u0435'}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  {'\u0423\u0442\u0440\u043E\u043C, \u0432\u0435\u0447\u0435\u0440\u043E\u043C \u0438 \u043F\u0435\u0440\u0435\u0434 \u0434\u0435\u0434\u043B\u0430\u0439\u043D\u043E\u043C'}
                </div>
              </div>
              <button onClick={handlePushToggle} disabled={pushLoading} style={{
                padding: '8px 20px', borderRadius: '20px', border: 'none',
                backgroundColor: pushEnabled ? '#22c55e' : '#16161f',
                color: pushEnabled ? '#fff' : '#94a3b8',
                cursor: pushLoading ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease',
              }}>
                {pushLoading ? '...' : pushEnabled ? '\u2714 \u0412\u043A\u043B' : '\u0412\u044B\u043A\u043B'}
              </button>
            </div>

            {pushEnabled && (
              <div style={{
                fontSize: '11px', color: '#475569', padding: '8px 12px',
                backgroundColor: '#16161f', borderRadius: '8px', marginBottom: '12px',
              }}>
                {'\uD83D\uDD53'} 10:00 {'\u2014'} {'\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043C\u043E\u0442\u0438\u0432\u0430\u0446\u0438\u044F'}<br />
                {'\uD83D\uDD53'} 18:00 {'\u2014'} {'\u043F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435 \u0435\u0441\u043B\u0438 <50%'}<br />
                {'\uD83D\uDD53'} 21:00 {'\u2014'} {'\u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0448\u0430\u043D\u0441 \u0437\u0430\u043A\u0440\u044B\u0442\u044C \u0434\u0435\u043D\u044C'}
              </div>
            )}

            {!pushEnabled && getPermissionState() === 'denied' && (
              <div style={{
                fontSize: '11px', color: '#ef4444', padding: '8px 12px',
                backgroundColor: '#1a0f0f', borderRadius: '8px', marginBottom: '12px',
              }}>
                {'\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u044B \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435. \u0420\u0430\u0437\u0431\u043B\u043E\u043A\u0438\u0440\u0443\u0439 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u0441\u0430\u0439\u0442\u0430.'}
              </div>
            )}
          </>
        )}

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
          {testLoading ? '\u23F3 \u041E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u044E...' : '\uD83D\uDD14 \u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0442\u0435\u0441\u0442\u043E\u0432\u043E\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435'}
        </button>
        {testStatus && (
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>
            {testStatus}
          </div>
        )}
      </div>

      {/* \u041E\u043F\u0430\u0441\u043D\u0430\u044F \u0437\u043E\u043D\u0430 */}
      <div style={{
        backgroundColor: '#12121a', border: '1px solid #ef444430',
        borderRadius: '12px', padding: '20px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: '#ef4444' }}>
          {'\u26A0\uFE0F'} {'\u041E\u043F\u0430\u0441\u043D\u0430\u044F \u0437\u043E\u043D\u0430'}
        </div>
        {[
          { fn: handleLogout, label: '\uD83D\uDEAA \u0412\u044B\u0439\u0442\u0438 \u0438\u0437 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430', color: '#f59e0b', border: '#1e1e2e', bg: '#16161f' },
          { fn: handleResetStats, label: '\uD83D\uDD04 \u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0443', color: '#ef4444', border: '#ef444420', bg: '#16161f' },
          { fn: handleDeleteAccount, label: '\uD83D\uDC80 \u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442', color: '#ef4444', border: '#ef444430', bg: '#1a0f0f' },
        ].map((btn) => (
          <button key={btn.label} onClick={btn.fn} style={{
            width: '100%', padding: '12px', marginBottom: '8px',
            backgroundColor: btn.bg, border: `1px solid ${btn.border}`,
            borderRadius: '8px', color: btn.color, cursor: 'pointer',
            fontSize: '14px', textAlign: 'left',
          }}>{btn.label}</button>
        ))}
      </div>

      <div style={{ textAlign: 'center', color: '#475569', fontSize: '12px', marginBottom: '32px' }}>
        Solo Income System v1.0 {'\u2694\uFE0F'}
      </div>
      <div style={{ height: '32px' }} />
    </div>
  );
}