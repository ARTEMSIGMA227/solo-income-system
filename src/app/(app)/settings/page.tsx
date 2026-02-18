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

// --- Russian strings as constants (safe for any encoding) ---
const S = {
  title: '\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438',
  profile: '\u041f\u0440\u043e\u0444\u0438\u043b\u044c',
  hunterName: '\u0418\u043c\u044f \u043e\u0445\u043e\u0442\u043d\u0438\u043a\u0430',
  tz: '\u0427\u0430\u0441\u043e\u0432\u043e\u0439 \u043f\u043e\u044f\u0441',
  berlin: '\u0411\u0435\u0440\u043b\u0438\u043d',
  moscow: '\u041c\u043e\u0441\u043a\u0432\u0430',
  kiev: '\u041a\u0438\u0435\u0432',
  dubai: '\u0414\u0443\u0431\u0430\u0439',
  bangkok: '\u0411\u0430\u043d\u0433\u043a\u043e\u043a',
  ny: '\u041d\u044c\u044e-\u0419\u043e\u0440\u043a',
  tokyo: '\u0422\u043e\u043a\u0438\u043e',
  goals: '\u0426\u0435\u043b\u0438',
  monthIncome: '\u0426\u0435\u043b\u0435\u0432\u043e\u0439 \u0434\u043e\u0445\u043e\u0434 \u0432 \u043c\u0435\u0441\u044f\u0446',
  dayIncome: '\u0426\u0435\u043b\u0435\u0432\u043e\u0439 \u0434\u043e\u0445\u043e\u0434 \u0432 \u0434\u0435\u043d\u044c',
  dayActions: '\u0426\u0435\u043b\u0435\u0432\u044b\u0445 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u0432 \u0434\u0435\u043d\u044c',
  system: '\u0421\u0438\u0441\u0442\u0435\u043c\u0430',
  penalty: '\u0428\u0442\u0440\u0430\u0444 \u0437\u0430 \u043f\u0440\u043e\u043f\u0443\u0441\u043a \u0434\u043d\u044f',
  focus: '\u0424\u043e\u043a\u0443\u0441-\u0440\u0435\u0436\u0438\u043c',
  minutes: '\u043c\u0438\u043d\u0443\u0442',
  actions: '\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439',
  perMonth: '\u20bd/\u043c\u0435\u0441',
  perDay: '\u20bd/\u0434\u0435\u043d\u044c',
  saving: '\u0421\u043e\u0445\u0440\u0430\u043d\u044f\u044e...',
  save: '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438',
  saved: '\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b!',
  saveErr: '\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u044f',
  enterName: '\u0412\u0432\u0435\u0434\u0438 \u0438\u043c\u044f',
  links: '\u0411\u044b\u0441\u0442\u0440\u044b\u0435 \u0441\u0441\u044b\u043b\u043a\u0438',
  analytics: '\u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430 \u0438 \u0433\u0440\u0430\u0444\u0438\u043a\u0438',
  stats: '\u0421\u0442\u0430\u0442\u044b \u0438 \u043f\u0435\u0440\u043a\u0438',
  push: 'Push-\u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f',
  pushOff: '\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f \u043e\u0442\u043a\u043b\u044e\u0447\u0435\u043d\u044b',
  pushOn: '\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f \u0432\u043a\u043b\u044e\u0447\u0435\u043d\u044b!',
  pushBlocked: '\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f \u0437\u0430\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u043d\u044b \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435',
  pushFail: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u043e\u0434\u043f\u0438\u0441\u0430\u0442\u044c\u0441\u044f',
  pushOffFail: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043a\u043b\u044e\u0447\u0438\u0442\u044c',
  pushNotSupported: '\u0411\u0440\u0430\u0443\u0437\u0435\u0440 \u043d\u0435 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 push-\u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 Chrome \u0438\u043b\u0438 Edge.',
  pushUnblock: '\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f \u0437\u0430\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u043d\u044b. \u0420\u0430\u0437\u0431\u043b\u043e\u043a\u0438\u0440\u0443\u0439 \u0432 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0430\u0445 \u0441\u0430\u0439\u0442\u0430.',
  remind: '\u041d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f \u043e \u043f\u043b\u0430\u043d\u0435',
  remindDesc: '\u0423\u0442\u0440\u043e\u043c, \u0432\u0435\u0447\u0435\u0440\u043e\u043c \u0438 \u043f\u0435\u0440\u0435\u0434 \u0434\u0435\u0434\u043b\u0430\u0439\u043d\u043e\u043c',
  morning: '\u0443\u0442\u0440\u0435\u043d\u043d\u044f\u044f \u043c\u043e\u0442\u0438\u0432\u0430\u0446\u0438\u044f',
  warning: '\u043f\u0440\u0435\u0434\u0443\u043f\u0440\u0435\u0436\u0434\u0435\u043d\u0438\u0435 \u0435\u0441\u043b\u0438 <50%',
  lastChance: '\u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0439 \u0448\u0430\u043d\u0441 \u0437\u0430\u043a\u0440\u044b\u0442\u044c \u0434\u0435\u043d\u044c',
  on: '\u0412\u043a\u043b',
  off: '\u0412\u044b\u043a\u043b',
  sending: '\u041e\u0442\u043f\u0440\u0430\u0432\u043b\u044f\u044e...',
  testPush: '\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0442\u0435\u0441\u0442\u043e\u0432\u043e\u0435 \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u0435',
  sent: '\u041e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u043e',
  netErr: '\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u0435\u0442\u0438',
  danger: '\u041e\u043f\u0430\u0441\u043d\u0430\u044f \u0437\u043e\u043d\u0430',
  logout: '\u0412\u044b\u0439\u0442\u0438 \u0438\u0437 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430',
  reset: '\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0443',
  delete: '\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442',
  resetConfirm: '\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c \u0412\u0421\u042e \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0443?',
  sure: '\u0422\u043e\u0447\u043d\u043e \u0443\u0432\u0435\u0440\u0435\u043d?',
  resetDone: '\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430 \u0441\u0431\u0440\u043e\u0448\u0435\u043d\u0430.',
  deleteConfirm: '\u0423\u0414\u0410\u041b\u0418\u0422\u042c \u0410\u041a\u041a\u0410\u0423\u041d\u0422?',
  deleted: '\u0410\u043a\u043a\u0430\u0443\u043d\u0442 \u0443\u0434\u0430\u043b\u0451\u043d',
  loading: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...',
  error: '\u041e\u0448\u0438\u0431\u043a\u0430',
};

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
        if (ok) { setPushEnabled(false); toast.success(S.pushOff); }
        else { toast.error(S.pushOffFail); }
      } else {
        if (getPermissionState() === 'denied') {
          toast.error(S.pushBlocked);
          setPushLoading(false);
          return;
        }
        const ok = await subscribeToPush();
        if (ok) { setPushEnabled(true); toast.success(S.pushOn); }
        else { toast.error(S.pushFail); }
      }
    } catch { toast.error(S.error); }
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
        setTestStatus('\u274c ' + ((body.error as string) ?? res.statusText));
      } else {
        setTestStatus('\u2705 ' + S.sent + ': ' + String(body.sent));
      }
    } catch {
      setTestStatus('\u274c ' + S.netErr);
    }
    setTestLoading(false);
  }

  async function handleSave() {
    if (!profile) return;
    if (!displayName.trim()) { toast.error(S.enterName); return; }
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
    if (error) { toast.error(S.saveErr); return; }
    toast.success(S.saved + ' \u2694\ufe0f');
  }

  async function handleResetStats() {
    if (!profile) return;
    if (!confirm('\u26a0\ufe0f ' + S.resetConfirm)) return;
    if (!confirm(S.sure)) return;
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
    toast.success(S.resetDone);
    router.push('/dashboard');
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  }

  async function handleDeleteAccount() {
    if (!confirm('\u26a0\ufe0f ' + S.deleteConfirm)) return;
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
    toast.success(S.deleted);
    router.push('/auth');
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: '#0a0a0f', color: '#a78bfa',
      }}>
        {'\u23f3'} {S.loading}
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
        {'\u2699\ufe0f'} {S.title}
      </h1>

      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
          {'\ud83d\udc64'} {S.profile}
        </div>
        <SettingInput label={S.hunterName} value={displayName} onChange={setDisplayName} />
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
            {S.tz}
          </label>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={{
            width: '100%', padding: '12px 16px', backgroundColor: '#16161f',
            border: '1px solid #1e1e2e', borderRadius: '8px', color: '#e2e8f0',
            fontSize: '14px', outline: 'none',
          }}>
            <option value="Europe/Berlin">{'\ud83c\udde9\ud83c\uddea'} {S.berlin} (CET)</option>
            <option value="Europe/Moscow">{'\ud83c\uddf7\ud83c\uddfa'} {S.moscow} (MSK)</option>
            <option value="Europe/Kiev">{'\ud83c\uddfa\ud83c\udde6'} {S.kiev} (EET)</option>
            <option value="Asia/Dubai">{'\ud83c\udde6\ud83c\uddea'} {S.dubai} (GST)</option>
            <option value="Asia/Bangkok">{'\ud83c\uddf9\ud83c\udded'} {S.bangkok} (ICT)</option>
            <option value="America/New_York">{'\ud83c\uddfa\ud83c\uddf8'} {S.ny} (EST)</option>
            <option value="Asia/Tokyo">{'\ud83c\uddef\ud83c\uddf5'} {S.tokyo} (JST)</option>
          </select>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
          {'\ud83c\udfaf'} {S.goals}
        </div>
        <SettingInput label={S.monthIncome} value={monthlyIncomeTarget} onChange={setMonthlyIncomeTarget} type="number" suffix={S.perMonth} />
        <SettingInput label={S.dayIncome} value={dailyIncomeTarget} onChange={setDailyIncomeTarget} type="number" suffix={S.perDay} />
        <SettingInput label={S.dayActions} value={dailyActionsTarget} onChange={setDailyActionsTarget} type="number" suffix={S.actions} />
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
          {'\u26a1'} {S.system}
        </div>
        <SettingInput label={S.penalty} value={penaltyXp} onChange={setPenaltyXp} type="number" suffix="XP" />
        <SettingInput label={S.focus} value={focusDuration} onChange={setFocusDuration} type="number" suffix={S.minutes} />
      </div>

      <button onClick={handleSave} disabled={saving} style={{
        width: '100%', padding: '14px', marginBottom: '16px',
        backgroundColor: saving ? '#4c1d95' : '#7c3aed',
        color: '#fff', border: 'none', borderRadius: '10px',
        fontSize: '16px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
      }}>
        {saving ? '\u23f3 ' + S.saving : '\u2705 ' + S.save}
      </button>

      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
          {'\ud83d\udcf1'} {S.links}
        </div>
        {[
          { href: '/analytics', label: '\ud83d\udcc8 ' + S.analytics },
          { href: '/stats', label: '\ud83d\udcca ' + S.stats },
        ].map((link) => (
          <button key={link.href} onClick={() => router.push(link.href)} style={{
            width: '100%', padding: '12px', marginBottom: '8px',
            backgroundColor: '#16161f', border: '1px solid #1e1e2e',
            borderRadius: '8px', color: '#e2e8f0', cursor: 'pointer',
            fontSize: '14px', textAlign: 'left',
          }}>{link.label}</button>
        ))}
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
          {'\ud83d\udd14'} {S.push}
        </div>

        {!pushSupported && (
          <div style={{
            fontSize: '12px', color: '#f59e0b', padding: '8px 12px',
            backgroundColor: '#16161f', borderRadius: '8px',
          }}>
            {S.pushNotSupported}
          </div>
        )}

        {pushSupported && (
          <>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '12px',
            }}>
              <div>
                <div style={{ fontSize: '14px' }}>{S.remind}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  {S.remindDesc}
                </div>
              </div>
              <button onClick={handlePushToggle} disabled={pushLoading} style={{
                padding: '8px 20px', borderRadius: '20px', border: 'none',
                backgroundColor: pushEnabled ? '#22c55e' : '#16161f',
                color: pushEnabled ? '#fff' : '#94a3b8',
                cursor: pushLoading ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease',
              }}>
                {pushLoading ? '...' : pushEnabled ? '\u2714 ' + S.on : S.off}
              </button>
            </div>

            {pushEnabled && (
              <div style={{
                fontSize: '11px', color: '#475569', padding: '8px 12px',
                backgroundColor: '#16161f', borderRadius: '8px', marginBottom: '12px',
              }}>
                {'\ud83d\udd53'} 10:00 — {S.morning}<br />
                {'\ud83d\udd53'} 18:00 — {S.warning}<br />
                {'\ud83d\udd53'} 21:00 — {S.lastChance}
              </div>
            )}

            {!pushEnabled && getPermissionState() === 'denied' && (
              <div style={{
                fontSize: '11px', color: '#ef4444', padding: '8px 12px',
                backgroundColor: '#1a0f0f', borderRadius: '8px', marginBottom: '12px',
              }}>
                {S.pushUnblock}
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
          {testLoading ? '\u23f3 ' + S.sending : '\ud83d\udd14 ' + S.testPush}
        </button>
        {testStatus && (
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>
            {testStatus}
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: '#12121a', border: '1px solid #ef444430',
        borderRadius: '12px', padding: '20px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: '#ef4444' }}>
          {'\u26a0\ufe0f'} {S.danger}
        </div>
        {[
          { fn: handleLogout, label: '\ud83d\udeaa ' + S.logout, color: '#f59e0b', border: '#1e1e2e', bg: '#16161f' },
          { fn: handleResetStats, label: '\ud83d\udd04 ' + S.reset, color: '#ef4444', border: '#ef444420', bg: '#16161f' },
          { fn: handleDeleteAccount, label: '\ud83d\udc80 ' + S.delete, color: '#ef4444', border: '#ef444430', bg: '#1a0f0f' },
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
        Solo Income System v1.0 {'\u2694\ufe0f'}
      </div>
      <div style={{ height: '32px' }} />
    </div>
  );
}