'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getDailyChallenge } from '@/lib/challenges';

const L = {
  title: '\ud83c\udfb2 \u0414\u043d\u0435\u0432\u043d\u043e\u0439 \u0447\u0435\u043b\u043b\u0435\u043d\u0434\u0436',
  completed: '\u0412\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u043e!',
  progress: '\u041f\u0440\u043e\u0433\u0440\u0435\u0441\u0441',
  reward: '\u041d\u0430\u0433\u0440\u0430\u0434\u0430',
  bonus: 'x2 XP',
};

interface Challenge {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  target_count: number;
  current_count: number;
  is_completed: boolean;
}

export default function DailyChallenge() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date().toLocaleDateString('en-CA');

      // Try to get existing challenge
      const { data: existing } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_date', today)
        .single();

      if (existing) {
        setChallenge(existing as Challenge);
        setLoading(false);
        return;
      }

      // Generate new challenge
      const template = getDailyChallenge(user.id, today);
      const { data: created } = await supabase
        .from('daily_challenges')
        .insert({
          user_id: user.id,
          challenge_date: today,
          title: template.title,
          description: template.description,
          xp_reward: template.xpReward,
          target_count: template.targetCount,
          current_count: 0,
          is_completed: false,
        })
        .select()
        .single();

      if (created) setChallenge(created as Challenge);
      setLoading(false);
    }

    load();
  }, []);

  if (loading || !challenge) return null;

  const progress = Math.min(
    Math.round((challenge.current_count / challenge.target_count) * 100),
    100,
  );

  return (
    <div style={{
      backgroundColor: challenge.is_completed ? '#0f1f0f' : '#12121a',
      border: challenge.is_completed ? '1px solid #22c55e40' : '1px solid #7c3aed40',
      borderRadius: '12px',
      padding: '14px',
      marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600 }}>{L.title}</div>
        <div style={{
          fontSize: '11px', fontWeight: 700,
          color: '#f59e0b', backgroundColor: '#f59e0b20',
          padding: '2px 8px', borderRadius: '10px',
        }}>
          {L.bonus}
        </div>
      </div>

      <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
        {challenge.title}
      </div>
      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
        {challenge.description}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '11px', color: '#94a3b8', marginBottom: '4px',
        }}>
          <span>{L.progress}: {challenge.current_count}/{challenge.target_count}</span>
          <span>{progress}%</span>
        </div>
        <div style={{
          width: '100%', height: '8px', backgroundColor: '#16161f',
          borderRadius: '4px', overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            borderRadius: '4px',
            background: challenge.is_completed
              ? 'linear-gradient(90deg, #22c55e, #16a34a)'
              : 'linear-gradient(90deg, #f59e0b, #d97706)',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          {L.reward}: {challenge.xp_reward} XP
        </span>
        {challenge.is_completed && (
          <span style={{
            fontSize: '12px', fontWeight: 700, color: '#22c55e',
            backgroundColor: '#22c55e20', padding: '2px 10px', borderRadius: '10px',
          }}>
            {'\u2705'} {L.completed}
          </span>
        )}
      </div>
    </div>
  );
}