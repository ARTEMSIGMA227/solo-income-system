'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  SKILL_NODES,
  canAllocate,
  calculateEffects,
  getSkillPointsForLevel,
  getUsedPoints,
} from '@/lib/skill-tree';
import type { SkillEffectType } from '@/lib/skill-tree';
import { toast } from 'sonner';

interface UseSkillsResult {
  allocated: Record<string, number>;
  totalPoints: number;
  usedPoints: number;
  availablePoints: number;
  effects: Record<SkillEffectType, number>;
  loading: boolean;
  allocatePoint: (skillId: string) => Promise<boolean>;
  resetSkills: () => Promise<boolean>;
}

export function useSkills(userId: string | undefined, level: number): UseSkillsResult {
  const [allocated, setAllocated] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('skill_allocations')
        .select('skill_id, level')
        .eq('user_id', userId);

      const map: Record<string, number> = {};
      if (data) {
        for (const row of data) {
          map[row.skill_id] = row.level;
        }
      }
      setAllocated(map);
      setLoading(false);
    }

    load();
  }, [userId]);

  const totalPoints = getSkillPointsForLevel(level);
  const usedPoints = getUsedPoints(allocated);
  const availablePoints = totalPoints - usedPoints;
  const effects = calculateEffects(allocated);

  const allocatePoint = useCallback(
    async (skillId: string): Promise<boolean> => {
      if (!userId) return false;

      const check = canAllocate(skillId, allocated, availablePoints);
      if (!check.can) {
        toast.error(check.reason);
        return false;
      }

      const node = SKILL_NODES.find((n) => n.id === skillId);
      if (!node) return false;

      const newLevel = (allocated[skillId] || 0) + 1;
      const supabase = createClient();

      const { error } = await supabase.from('skill_allocations').upsert(
        { user_id: userId, skill_id: skillId, level: newLevel, allocated_at: new Date().toISOString() },
        { onConflict: 'user_id,skill_id' }
      );

      if (error) {
        toast.error('Ошибка сохранения');
        return false;
      }

      setAllocated((prev) => ({ ...prev, [skillId]: newLevel }));
      toast.success(`${node.icon} ${node.name} → Lv.${newLevel}`);
      return true;
    },
    [userId, allocated, availablePoints]
  );

  const resetSkills = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    if (usedPoints === 0) {
      toast.error('Нечего сбрасывать');
      return false;
    }

    const RESET_COST = 500;
    const supabase = createClient();

    const { data: statsData } = await supabase
      .from('stats')
      .select('gold')
      .eq('user_id', userId)
      .single();

    if (!statsData || (statsData.gold || 0) < RESET_COST) {
      toast.error(`Нужно ${RESET_COST} 🪙 для сброса`);
      return false;
    }

    const { error: delError } = await supabase
      .from('skill_allocations')
      .delete()
      .eq('user_id', userId);

    if (delError) {
      toast.error('Ошибка сброса');
      return false;
    }

    await supabase
      .from('stats')
      .update({
        gold: statsData.gold - RESET_COST,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    await supabase.from('skill_resets').insert({
      user_id: userId,
      gold_cost: RESET_COST,
    });

    await supabase.from('gold_events').insert({
      user_id: userId,
      amount: -RESET_COST,
      event_type: 'skill_reset',
      description: 'Сброс навыков',
      event_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' }),
    });

    setAllocated({});
    toast.success(`Навыки сброшены! -${RESET_COST} 🪙`);
    return true;
  }, [userId, usedPoints]);

  return {
    allocated,
    totalPoints,
    usedPoints,
    availablePoints,
    effects,
    loading,
    allocatePoint,
    resetSkills,
  };
}