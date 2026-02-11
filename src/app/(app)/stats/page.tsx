'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getLevelInfo } from '@/lib/xp';
import { xpToNextLevel, PERKS, TITLES } from '@/lib/constants';
import { formatNumber, formatCurrency } from '@/lib/utils';
import type { Stats, PerkUnlock } from '@/types/database';

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [perks, setPerks] = useState<PerkUnlock[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: statsData } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setStats(statsData);

      const { data: perksData } = await supabase
        .from('perk_unlocks')
        .select('*')
        .eq('user_id', user.id);
      setPerks(perksData || []);

      setLoading(false);
    }
    load();
  }, []);

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

  const levelInfo = stats
    ? getLevelInfo(stats.total_xp_earned, stats.total_xp_lost)
    : { level: 1, currentXP: 0, xpToNext: 750, progressPercent: 0, title: 'Безымянный', titleIcon: '💀', totalXPEarned: 0 };

  const allPerks = Object.values(PERKS);

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#e2e8f0',
      padding: '16px', maxWidth: '600px', margin: '0 auto',
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
        📊 Статы охотника
      </h1>

      {/* Уровень */}
      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '16px',
        padding: '24px', marginBottom: '16px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px' }}>{levelInfo.titleIcon}</div>
        <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '8px' }}>
          {levelInfo.title}
        </div>
        <div style={{ fontSize: '56px', fontWeight: 800, color: '#a78bfa' }}>
          {levelInfo.level}
        </div>
        <div style={{ margin: '16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
            <span>XP</span>
            <span>{formatNumber(levelInfo.currentXP)} / {formatNumber(levelInfo.xpToNext)}</span>
          </div>
          <div style={{ width: '100%', height: '14px', backgroundColor: '#16161f', borderRadius: '7px', overflow: 'hidden', border: '1px solid #1e1e2e' }}>
            <div style={{
              width: `${levelInfo.progressPercent}%`, height: '100%', borderRadius: '7px',
              background: 'linear-gradient(90deg, #7c3aed, #3b82f6)',
            }} />
          </div>
        </div>
      </div>

      {/* Характеристики */}
      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px',
        padding: '16px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>⚡ Характеристики</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Всего XP', value: formatNumber(stats?.total_xp_earned || 0), color: '#a78bfa' },
            { label: 'Потеряно XP', value: formatNumber(stats?.total_xp_lost || 0), color: '#ef4444' },
            { label: 'Действия', value: formatNumber(stats?.total_actions || 0), color: '#3b82f6' },
            { label: 'Продажи', value: String(stats?.total_sales || 0), color: '#22c55e' },
            { label: 'Клиенты', value: String(stats?.total_clients || 0), color: '#f59e0b' },
            { label: 'Доход', value: formatCurrency(Number(stats?.total_income || 0)), color: '#22c55e' },
          ].map((stat, i) => (
            <div key={i} style={{ backgroundColor: '#16161f', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{stat.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Перки */}
      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px',
        padding: '16px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>🎮 Перки</div>
        {allPerks.map((perk) => {
          const unlocked = levelInfo.level >= perk.unlock_level;
          return (
            <div key={perk.key} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px', backgroundColor: '#16161f', borderRadius: '8px',
              marginBottom: '8px', opacity: unlocked ? 1 : 0.4,
            }}>
              <span style={{ fontSize: '24px' }}>{perk.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{perk.title}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{perk.description}</div>
              </div>
              <div style={{
                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                backgroundColor: unlocked ? '#22c55e20' : '#16161f',
                color: unlocked ? '#22c55e' : '#475569',
              }}>
                {unlocked ? '✓ LV.' + perk.unlock_level : '🔒 LV.' + perk.unlock_level}
              </div>
            </div>
          );
        })}
      </div>

      {/* Титулы */}
      <div style={{
        backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px',
        padding: '16px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>🏅 Титулы</div>
        {TITLES.map((t, i) => {
          const unlocked = levelInfo.level >= t.minLevel;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px', opacity: unlocked ? 1 : 0.3,
            }}>
              <span style={{ fontSize: '20px' }}>{t.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: unlocked ? 600 : 400 }}>{t.title}</span>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#475569' }}>LV.{t.minLevel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}