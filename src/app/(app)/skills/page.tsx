'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatNumber } from '@/lib/utils';
import { SKILL_BRANCHES, calculateEffects } from '@/lib/skill-tree';
import type { SkillBranch, SkillEffectType } from '@/lib/skill-tree';
import { useSkills } from '@/hooks/use-skills';
import SkillBranchColumn from '@/components/skills/SkillBranchColumn';
import { toast } from 'sonner';

const EFFECT_LABELS: Record<SkillEffectType, string> = {
  xp_bonus_percent: '% бонус XP',
  gold_bonus_percent: '% бонус золота',
  xp_bonus_flat: ' XP бонус',
  gold_bonus_flat: ' 🪙 бонус',
  streak_shield_days: ' дн. защиты серии',
  penalty_reduction_percent: '% снижение штрафа',
  daily_gold_passive: ' 🪙/день пассивно',
  xp_multiplier_actions: '% XP множитель',
  crit_chance_percent: '% шанс крита',
  boss_damage_bonus: '% урон боссам',
  mission_slot: ' доп. слот миссий',
  shop_discount_percent: '% скидка в магазине',
};

const branchOrder: SkillBranch[] = [
  'communication',
  'intellect',
  'discipline',
  'precision',
  'willpower',
  'defense',
];

export default function SkillsPage() {
  const [userId, setUserId] = useState<string | undefined>();
  const [level, setLevel] = useState(1);
  const [gold, setGold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEffects, setShowEffects] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const router = useRouter();

  const {
    allocated,
    totalPoints,
    usedPoints,
    availablePoints,
    effects,
    loading: skillsLoading,
    allocatePoint,
    resetSkills,
  } = useSkills(userId, level);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      setUserId(user.id);

      const { data: stats } = await supabase
        .from('stats')
        .select('level, gold')
        .eq('user_id', user.id)
        .single();

      if (stats) {
        setLevel(stats.level);
        setGold(stats.gold || 0);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleAllocate(skillId: string) {
    const success = await allocatePoint(skillId);
    if (success) {
      // Small haptic-like visual feedback
    }
  }

  async function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      toast('Нажми ещё раз для подтверждения сброса (500 🪙)', { icon: '⚠️' });
      setTimeout(() => setConfirmReset(false), 5000);
      return;
    }
    const success = await resetSkills();
    if (success) {
      setGold((prev) => prev - 500);
      setConfirmReset(false);
    }
  }

  if (loading || skillsLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          color: '#a78bfa',
          fontSize: '24px',
        }}
      >
        ⚔️ Загрузка навыков...
      </div>
    );
  }

  const activeEffects = Object.entries(effects).filter(([, v]) => v > 0);

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
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#a78bfa' }}>
              ⚔️ Древо навыков
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Прокачивай навыки, становись сильнее
            </div>
          </div>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: '#f59e0b20',
              color: '#f59e0b',
              border: '1px solid #f59e0b30',
            }}
          >
            🪙 {formatNumber(gold)}
          </div>
        </div>
      </div>

      {/* Skill Points Bar */}
      <div
        style={{
          backgroundColor: '#12121a',
          border: '1px solid #1e1e2e',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Очки навыков</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  color: availablePoints > 0 ? '#22c55e' : '#64748b',
                  textShadow: availablePoints > 0 ? '0 0 20px #22c55e40' : 'none',
                }}
              >
                {availablePoints}
              </span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                / {totalPoints} (использовано {usedPoints})
              </span>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>LV. {level}</div>
        </div>

        {availablePoints > 0 && (
          <div
            style={{
              marginTop: '8px',
              padding: '6px 10px',
              backgroundColor: '#22c55e10',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#22c55e',
              textAlign: 'center',
              animation: 'skillPointsPulse 2s ease-in-out infinite',
            }}
          >
            ✨ Есть нераспределённые очки! Выбери навык для прокачки
          </div>
        )}
      </div>

      {/* Active Effects Toggle */}
      {activeEffects.length > 0 && (
        <button
          onClick={() => setShowEffects(!showEffects)}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: '#12121a',
            border: '1px solid #1e1e2e',
            borderRadius: '12px',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '13px',
            textAlign: 'left',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>📊 Активные бонусы ({activeEffects.length})</span>
          <span style={{ fontSize: '11px' }}>{showEffects ? '▲' : '▼'}</span>
        </button>
      )}

      {showEffects && activeEffects.length > 0 && (
        <div
          style={{
            backgroundColor: '#12121a',
            border: '1px solid #1e1e2e',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {activeEffects.map(([key, value]) => (
              <div
                key={key}
                style={{
                  fontSize: '11px',
                  color: '#a78bfa',
                  padding: '6px 8px',
                  backgroundColor: '#a78bfa08',
                  borderRadius: '6px',
                }}
              >
                +{value}
                {EFFECT_LABELS[key as SkillEffectType]}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill Branches */}
      {branchOrder.map((branch) => (
        <SkillBranchColumn
          key={branch}
          branch={branch}
          allocated={allocated}
          availablePoints={availablePoints}
          onAllocate={handleAllocate}
        />
      ))}

      {/* Reset Button */}
      {usedPoints > 0 && (
        <button
          onClick={handleReset}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: confirmReset ? '#ef444420' : '#12121a',
            border: `1px solid ${confirmReset ? '#ef4444' : '#1e1e2e'}`,
            borderRadius: '12px',
            color: confirmReset ? '#ef4444' : '#64748b',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '12px',
            transition: 'all 0.2s ease',
          }}
        >
          {confirmReset ? '⚠️ Подтвердить сброс (500 🪙)' : '🔄 Сбросить навыки (500 🪙)'}
        </button>
      )}

      <div style={{ height: '32px' }} />

      <style>{`
        @keyframes skillPointsPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}