'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getLevelInfo } from '@/lib/xp';
import { formatNumber } from '@/lib/utils';
import { useT } from '@/lib/i18n';

type SortKey = 'xp' | 'streak' | 'actions' | 'income';

interface LeaderRow {
  id: string;
  display_name: string | null;
  streak_current: number | null;
  streak_best: number | null;
  level: number | null;
  total_xp_earned: number | null;
  total_xp_lost: number | null;
  total_income: number | null;
  total_actions: number | null;
  total_sales: number | null;
  total_clients: number | null;
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('xp');
  const { t, formatCurrency: fmtCurrency } = useT();

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data } = await supabase.from('leaderboard').select('*');

      if (data) setRows(data as LeaderRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const sorted = [...rows].sort((a, b) => {
    switch (sortBy) {
      case 'xp':
        return (b.total_xp_earned ?? 0) - (a.total_xp_earned ?? 0);
      case 'streak':
        return (b.streak_current ?? 0) - (a.streak_current ?? 0);
      case 'actions':
        return (b.total_actions ?? 0) - (a.total_actions ?? 0);
      case 'income':
        return (Number(b.total_income) || 0) - (Number(a.total_income) || 0);
    }
  });

  function getMedal(index: number): string {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '#' + String(index + 1);
  }

  function getMainValue(row: LeaderRow): string {
    switch (sortBy) {
      case 'xp':
        return formatNumber(row.total_xp_earned ?? 0);
      case 'streak':
        return String(row.streak_current ?? 0);
      case 'actions':
        return formatNumber(row.total_actions ?? 0);
      case 'income':
        return fmtCurrency(Number(row.total_income) || 0);
    }
  }

  function getMainLabel(): string {
    switch (sortBy) {
      case 'xp':
        return t.leaderboard.xp;
      case 'streak':
        return t.leaderboard.streak;
      case 'actions':
        return t.leaderboard.actions;
      case 'income':
        return t.leaderboard.income;
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          color: '#a78bfa',
        }}
      >
        ⏳ {t.leaderboard.loading}
      </div>
    );
  }

  const tabStyle = (active: boolean) => ({
    padding: '8px 14px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: active ? '#7c3aed' : '#16161f',
    color: active ? '#fff' : '#94a3b8',
    fontSize: '12px',
    fontWeight: 600 as const,
    cursor: 'pointer' as const,
    transition: 'all 0.2s ease',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0f',
        color: '#e2e8f0',
        padding: '16px',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
        🏆 {t.leaderboard.title}
      </h1>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <button onClick={() => setSortBy('xp')} style={tabStyle(sortBy === 'xp')}>
          ⚡ {t.leaderboard.tabXp}
        </button>
        <button
          onClick={() => setSortBy('streak')}
          style={tabStyle(sortBy === 'streak')}
        >
          🔥 {t.leaderboard.tabStreak}
        </button>
        <button
          onClick={() => setSortBy('actions')}
          style={tabStyle(sortBy === 'actions')}
        >
          🎯 {t.leaderboard.tabActions}
        </button>
        <button
          onClick={() => setSortBy('income')}
          style={tabStyle(sortBy === 'income')}
        >
          💰 {t.leaderboard.tabIncome}
        </button>
      </div>

      {sorted.length === 0 && (
        <div
          style={{
            backgroundColor: '#12121a',
            border: '1px solid #1e1e2e',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            color: '#94a3b8',
          }}
        >
          {t.leaderboard.empty}
        </div>
      )}

      {sorted.map((row, i) => {
        const isMe = row.id === currentUserId;
        const earned = row.total_xp_earned ?? 0;
        const lost = row.total_xp_lost ?? 0;
        const info = getLevelInfo(earned, lost);

        return (
          <div
            key={row.id}
            style={{
              backgroundColor: isMe ? '#1a1525' : '#12121a',
              border: isMe ? '2px solid #7c3aed' : '1px solid #1e1e2e',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '10px',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              {/* Position */}
              <div
                style={{
                  fontSize: i < 3 ? '24px' : '16px',
                  fontWeight: 700,
                  minWidth: '40px',
                  textAlign: 'center',
                  color: i >= 3 ? '#475569' : undefined,
                }}
              >
                {getMedal(i)}
              </div>

              {/* Player info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.display_name || t.common.hunter}
                  </span>
                  {isMe && (
                    <span
                      style={{
                        fontSize: '9px',
                        backgroundColor: '#7c3aed',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                      }}
                    >
                      {t.leaderboard.you}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    marginTop: '2px',
                  }}
                >
                  {info.titleIcon} {info.title} | {t.leaderboard.level}
                  {info.level}
                </div>
              </div>

              {/* Main stat */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#a78bfa',
                  }}
                >
                  {getMainValue(row)}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {getMainLabel()}
                </div>
              </div>
            </div>

            {/* Sub stats row */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '1px solid #1e1e2e',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: '11px', color: '#475569' }}>
                ⚡ {formatNumber(earned)} XP
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>
                🔥 {row.streak_current ?? 0} ({t.leaderboard.bestStreak}:{' '}
                {row.streak_best ?? 0})
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>
                🎯 {formatNumber(row.total_actions ?? 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>
                💰 {fmtCurrency(Number(row.total_income) || 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>
                💼 {row.total_sales ?? 0} {t.leaderboard.sales}
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ height: '80px' }} />
    </div>
  );
}