'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const L = {
  title: '\ud83d\udcc5 \u041a\u0430\u043b\u0435\u043d\u0434\u0430\u0440\u044c \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0438',
  less: '\u041c\u0435\u043d\u044c\u0448\u0435',
  more: '\u0411\u043e\u043b\u044c\u0448\u0435',
};

interface DayEntry {
  date: string;
  count: number;
}

export default function ActivityCalendar() {
  const [data, setData] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Last 90 days of completions
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 89);
      const startStr = startDate.toLocaleDateString('en-CA');

      const { data: completions } = await supabase
        .from('completions')
        .select('completion_date, count_done')
        .eq('user_id', user.id)
        .gte('completion_date', startStr);

      const map = new Map<string, number>();
      if (completions) {
        for (const c of completions) {
          const existing = map.get(c.completion_date) || 0;
          map.set(c.completion_date, existing + c.count_done);
        }
      }

      setData(map);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) return null;

  // Generate 90 days grid
  const days: DayEntry[] = [];
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-CA');
    days.push({ date: dateStr, count: data.get(dateStr) || 0 });
  }

  const maxCount = Math.max(...days.map(d => d.count), 1);

  function getColor(count: number): string {
    if (count === 0) return '#16161f';
    const intensity = Math.min(count / maxCount, 1);
    if (intensity < 0.25) return '#1a3a1a';
    if (intensity < 0.5) return '#2d5a2d';
    if (intensity < 0.75) return '#22c55e80';
    return '#22c55e';
  }

  function getTooltip(day: DayEntry): string {
    const d = new Date(day.date);
    const label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    return `${label}: ${day.count}`;
  }

  // 13 columns x 7 rows (weeks)
  const weeks: DayEntry[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div style={{
      backgroundColor: '#12121a',
      border: '1px solid #1e1e2e',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px',
    }}>
      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
        {L.title}
      </div>

      <div style={{
        display: 'flex',
        gap: '3px',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {week.map((day) => (
              <div
                key={day.date}
                title={getTooltip(day)}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '3px',
                  backgroundColor: getColor(day.count),
                  border: '1px solid #1e1e2e',
                  cursor: 'default',
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '4px', marginTop: '10px', fontSize: '10px', color: '#94a3b8',
      }}>
        <span>{L.less}</span>
        {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
          <div
            key={i}
            style={{
              width: '12px', height: '12px', borderRadius: '2px',
              backgroundColor: intensity === 0 ? '#16161f' :
                intensity < 0.5 ? '#1a3a1a' :
                intensity < 0.75 ? '#2d5a2d' :
                intensity < 1 ? '#22c55e80' : '#22c55e',
            }}
          />
        ))}
        <span>{L.more}</span>
      </div>
    </div>
  );
}