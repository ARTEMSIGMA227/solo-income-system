'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getLevelInfo } from '@/lib/xp';
import { formatNumber, formatCurrency } from '@/lib/utils';

const L = {
  title: '\u0422\u0430\u0431\u043b\u0438\u0446\u0430 \u043b\u0438\u0434\u0435\u0440\u043e\u0432',
  loading: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...',
  empty: '\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u0438\u0433\u0440\u043e\u043a\u043e\u0432',
  xp: 'XP',
  level: '\u0423\u0440.',
  streak: '\u0421\u0435\u0440\u0438\u044f',
  actions: '\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f',
  income: '\u0414\u043e\u0445\u043e\u0434',
  you: '\u0422\u044b',
  tabXp: '\u041f\u043e XP',
  tabStreak: '\u041f\u043e \u0441\u0435\u0440\u0438\u0438',
  tabActions: '\u041f\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f\u043c',
  tabIncome: '\u041f\u043e \u0434\u043e\u0445\u043e\u0434\u0443',
  bestStreak: '\u041b\u0443\u0447\u0448\u0430\u044f',
  sales: '\u041f\u0440\u043e\u0434\u0430\u0436\u0438',
};

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

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data } = await supabase
        .from('leaderboard')
        .select('*');

      if (data) setRows(data as LeaderRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const sorted = [...rows].sort((a, b) => {
    switch (sortBy) {
      case 'xp': return (b.total_xp_earned ?? 0) - (a.total_xp_earned ?? 0);
      case 'streak': return (b.streak_current ?? 0) - (a.streak_current ?? 0);
      case 'actions': return (b.total_actions ?? 0) - (a.total_actions ?? 0);
      case 'income': return (Number(b.total_income) || 0) - (Number(a.total_income) || 0);
    }
  });

  function getMedal(index: number): string {
    if (index === 0) return '\ud83e\udd47';
    if (index === 1) return '\ud83e\udd48';
    if (index === 2) return '\ud83e\udd49';
    return '#' + String(index + 1);
  }

  function getMainValue(row: LeaderRow): string {
    switch (sortBy) {
      case 'xp': return formatNumber(row.total_xp_earned ?? 0);
      case 'streak': return String(row.streak_current ?? 0);
      case 'actions': return formatNumber(row.total_actions ?? 0);
      case 'income': return formatCurrency(Number(row.total_income) || 0);
    }
  }

  function getMainLabel(): string {
    switch (sortBy) {
      case 'xp': return L.xp;
      case 'streak': return L.streak;
      case 'actions': return L.actions;
      case 'income': return L.income;
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: '#0a0a0f', color: '#a78bfa',
      }}>
        {'\u23f3'} {L.loading}
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
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#e2e8f0',
      padding: '16px', maxWidth: '600px', margin: '0 auto',
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
        {'\ud83c\udfc6'} {L.title}
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => setSortBy('xp')} style={tabStyle(sortBy === 'xp')}>
          {'\u26a1'} {L.tabXp}
        </button>
        <button onClick={() => setSortBy('streak')} style={tabStyle(sortBy === 'streak')}>
          {'\ud83d\udd25'} {L.tabStreak}
        </button>
        <button onClick={() => setSortBy('actions')} style={tabStyle(sortBy === 'actions')}>
          {'\ud83c\udfaf'} {L.tabActions}
        </button>
        <button onClick={() => setSortBy('income')} style={tabStyle(sortBy === 'income')}>
          {'\ud83d\udcb0'} {L.tabIncome}
        </button>
      </div>

      {sorted.length === 0 && (
        <div style={{
          backgroundColor: '#12121a', border: '1px solid #1e1e2e',
          borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#94a3b8',
        }}>
          {L.empty}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Position */}
              <div style={{
                fontSize: i < 3 ? '24px' : '16px',
                fontWeight: 700,
                minWidth: '40px',
                textAlign: 'center',
                color: i >= 3 ? '#475569' : undefined,
              }}>
                {getMedal(i)}
              </div>

              {/* Player info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.display_name || 'Hunter'}
                  </span>
                  {isMe && (
                    <span style={{
                      fontSize: '9px', backgroundColor: '#7c3aed', color: '#fff',
                      padding: '2px 6px', borderRadius: '4px', fontWeight: 700,
                    }}>
                      {L.you}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  {info.titleIcon} {info.title} | {L.level}{info.level}
                </div>
              </div>

              {/* Main stat */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#a78bfa' }}>
                  {getMainValue(row)}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {getMainLabel()}
                </div>
              </div>
            </div>

            {/* Sub stats row */}
            <div style={{
              display: 'flex', gap: '10px', marginTop: '10px',
              paddingTop: '10px', borderTop: '1px solid #1e1e2e',
              flexWrap: 'wrap',
            }}>
              <div style={{ fontSize: '11px', color: '#475569' }}>
                {'\u26a1'} {formatNumber(earned)} XP
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>
                {'\ud83d\udd25'} {row.streak_current ?? 0} ({L.bestStreak}: {row.streak_best ?? 0})
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>
                {'\ud83c\udfaf'} {formatNumber(row.total_actions ?? 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>
                {'\ud83d\udcb0'} {formatCurrency(Number(row.total_income) || 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>
                {'\ud83d\udcbc'} {row.total_sales ?? 0} {L.sales}
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ height: '80px' }} />
    </div>
  );
}