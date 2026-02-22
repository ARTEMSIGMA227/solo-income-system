'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getDailyChallenge } from '@/lib/challenges';
import { useT } from '@/lib/i18n';

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
  const [tableExists, setTableExists] = useState(true);
  const { t, locale } = useT();
  const prevLocaleRef = useRef(locale);
  const userIdRef = useRef<string | null>(null);

  const resolveTemplate = useCallback(
    (userId: string, today: string) => {
      return getDailyChallenge(userId, today, t);
    },
    [t],
  );

  useEffect(() => {
    if (!tableExists) return;

    const supabase = createClient();

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        userIdRef.current = user.id;

        const today = new Date().toLocaleDateString('en-CA');

        // Try to fetch existing challenge
        const { data: existing, error: selectError } = await supabase
          .from('daily_challenges')
          .select('*')
          .eq('user_id', user.id)
          .eq('challenge_date', today)
          .maybeSingle();

        // If table doesn't exist (406/400), hide component
        if (selectError) {
          const code = selectError.code;
          const msg = selectError.message || '';
          if (
            code === '42P01' ||
            msg.includes('does not exist') ||
            msg.includes('406') ||
            msg.includes('relation')
          ) {
            setTableExists(false);
            setLoading(false);
            return;
          }
        }

        if (existing) {
          // Re-resolve title/description from template for current locale
          const template = resolveTemplate(user.id, today);
          setChallenge({
            ...(existing as Challenge),
            title: template.title,
            description: template.description,
          });
          setLoading(false);
          return;
        }

        // Create new challenge using upsert to avoid 409 Conflict
        const template = resolveTemplate(user.id, today);
        const { data: created, error: upsertError } = await supabase
          .from('daily_challenges')
          .upsert(
            {
              user_id: user.id,
              challenge_date: today,
              title: template.title,
              description: template.description,
              xp_reward: template.xpReward,
              target_count: template.targetCount,
              current_count: 0,
              is_completed: false,
            },
            { onConflict: 'user_id,challenge_date' },
          )
          .select()
          .single();

        if (upsertError) {
          // Table might not exist
          const msg = upsertError.message || '';
          if (msg.includes('does not exist') || msg.includes('relation')) {
            setTableExists(false);
          }
          setLoading(false);
          return;
        }

        if (created) {
          setChallenge(created as Challenge);
        }
      } catch {
        // Silently fail — table may not exist
        setTableExists(false);
      }
      setLoading(false);
    }

    load();
  }, [t, locale, tableExists, resolveTemplate]);

  // When locale changes, re-resolve the displayed title/description
  useEffect(() => {
    if (prevLocaleRef.current !== locale && challenge && userIdRef.current) {
      const today = new Date().toLocaleDateString('en-CA');
      const template = resolveTemplate(userIdRef.current, today);
      setChallenge((prev) =>
        prev
          ? { ...prev, title: template.title, description: template.description }
          : prev,
      );
      prevLocaleRef.current = locale;
    }
  }, [locale, challenge, resolveTemplate]);

  if (loading || !challenge || !tableExists) return null;

  const progress = Math.min(
    Math.round((challenge.current_count / challenge.target_count) * 100),
    100,
  );

  return (
    <div
      style={{
        backgroundColor: challenge.is_completed ? '#0f1f0f' : '#12121a',
        border: challenge.is_completed
          ? '1px solid #22c55e40'
          : '1px solid #7c3aed40',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 600 }}>
          {t.dailyChallenge.title}
        </div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#f59e0b',
            backgroundColor: '#f59e0b20',
            padding: '2px 8px',
            borderRadius: '10px',
          }}
        >
          {t.dailyChallenge.bonus}
        </div>
      </div>

      <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
        {challenge.title}
      </div>
      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
        {challenge.description}
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#94a3b8',
            marginBottom: '4px',
          }}
        >
          <span>
            {t.dailyChallenge.progress}: {challenge.current_count}/
            {challenge.target_count}
          </span>
          <span>{progress}%</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#16161f',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: '4px',
              background: challenge.is_completed
                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                : 'linear-gradient(90deg, #f59e0b, #d97706)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          {t.dailyChallenge.reward}: {challenge.xp_reward} XP
        </span>
        {challenge.is_completed && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#22c55e',
              backgroundColor: '#22c55e20',
              padding: '2px 10px',
              borderRadius: '10px',
            }}
          >
            ✅ {t.dailyChallenge.completed}
          </span>
        )}
      </div>
    </div>
  );
}