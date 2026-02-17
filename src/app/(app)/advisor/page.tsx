'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateAdvice } from '@/lib/advisor';
import type { Advice } from '@/lib/advisor';
import type { Stats, Profile } from '@/types/database';

const priorityStyles: Record<Advice['priority'], { bg: string; border: string; accent: string; label: string }> = {
  critical: { bg: '#1a0f0f', border: '#ef444440', accent: '#ef4444', label: 'Критично' },
  warning: { bg: '#1a1a0f', border: '#f59e0b40', accent: '#f59e0b', label: 'Внимание' },
  positive: { bg: '#0f1a12', border: '#22c55e40', accent: '#22c55e', label: 'Отлично' },
  info: { bg: '#0f1219', border: '#3b82f640', accent: '#3b82f6', label: 'Совет' },
};

export default function AdvisorPage() {
  const [greeting, setGreeting] = useState('');
  const [advice, setAdvice] = useState<Advice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: stats } = await supabase.from('stats').select('*').eq('user_id', user.id).single();
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      if (!stats || !profile) {
        setLoading(false);
        return;
      }

      const now = new Date();
      const today = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
      const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const { data: ct } = await supabase.from('completions').select('count_done')
        .eq('user_id', user.id).eq('completion_date', today);
      const todayActions = ct?.reduce((sum: number, c: { count_done: number }) => sum + c.count_done, 0) ?? 0;

      const { data: todayInc } = await supabase.from('income_events').select('amount')
        .eq('user_id', user.id).eq('event_date', today);
      const todayIncome = todayInc?.reduce((sum: number, i: { amount: number }) => sum + Number(i.amount), 0) ?? 0;

      const { data: monthInc } = await supabase.from('income_events').select('amount')
        .eq('user_id', user.id).gte('event_date', firstOfMonth).lte('event_date', today);
      const monthIncome = monthInc?.reduce((sum: number, i: { amount: number }) => sum + Number(i.amount), 0) ?? 0;

      const hour = parseInt(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin', hour: 'numeric', hour12: false }), 10);

      const result = generateAdvice({
        stats: stats as Stats,
        profile: profile as Profile,
        todayActions,
        todayIncome,
        monthIncome,
        hour,
        dayOfWeek: now.getDay(),
        dayOfMonth: now.getDate(),
        daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
      });

      setGreeting(result.greeting);
      setAdvice(result.advice);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0f', color: '#a78bfa' }}>
        ⏳ Анализ данных...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#e2e8f0', padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
        🤖 AI-советник
      </h1>

      <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px', fontStyle: 'italic' }}>
        {greeting}
      </div>

      {advice.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 16px',
          backgroundColor: '#12121a', borderRadius: '16px',
          border: '1px solid #1e1e2e',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✨</div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Всё отлично!</div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            Нет рекомендаций — ты на правильном пути.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {advice.map((item, i) => {
            const style = priorityStyles[item.priority];
            return (
              <div key={i} style={{
                backgroundColor: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: '14px',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: style.accent }}>
                      {item.title}
                    </div>
                    <span style={{
                      fontSize: '9px', padding: '2px 6px', borderRadius: '4px',
                      backgroundColor: style.accent + '20', color: style.accent,
                    }}>
                      {style.label}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                  {item.message}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ height: '80px' }} />
    </div>
  );
}
