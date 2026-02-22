'use client';

import { useT } from '@/lib/i18n';
import type { SkillNode } from '@/lib/skill-tree';
import { SKILL_BRANCHES, canAllocate, getSkillName, getSkillDescription, getEffectDescription } from '@/lib/skill-tree';

interface SkillNodeCardProps {
  node: SkillNode;
  currentLevel: number;
  allocated: Record<string, number>;
  availablePoints: number;
  onAllocate: (skillId: string) => void;
}

export default function SkillNodeCard({
  node,
  currentLevel,
  allocated,
  availablePoints,
  onAllocate,
}: SkillNodeCardProps) {
  const { t } = useT();
  const branch = SKILL_BRANCHES[node.branch];
  const isMaxed = currentLevel >= node.maxLevel;
  const isUnlocked = currentLevel > 0;
  const check = canAllocate(node.id, allocated, availablePoints, t);

  const skillName = getSkillName(node.id, t);
  const skillDesc = getSkillDescription(node.id, t);

  let borderColor = '#1e1e2e';
  let bgColor = '#12121a';
  let opacity = 0.5;

  if (isMaxed) {
    borderColor = branch.color;
    bgColor = `${branch.color}15`;
    opacity = 1;
  } else if (isUnlocked) {
    borderColor = `${branch.color}80`;
    bgColor = `${branch.color}08`;
    opacity = 1;
  } else if (check.can) {
    borderColor = '#2e2e3e';
    bgColor = '#14141e';
    opacity = 0.85;
  }

  return (
    <button
      onClick={() => {
        if (check.can) onAllocate(node.id);
      }}
      disabled={!check.can}
      style={{
        width: '100%',
        padding: '12px',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        color: '#e2e8f0',
        cursor: check.can ? 'pointer' : 'default',
        textAlign: 'left',
        opacity,
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isMaxed && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 0%, ${branch.color}20, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>{node.icon}</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: isUnlocked ? branch.color : '#94a3b8' }}>
              {skillName}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '3px' }}>
            {Array.from({ length: node.maxLevel }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: i < currentLevel ? branch.color : '#2e2e3e',
                  border: `1px solid ${i < currentLevel ? branch.color : '#3e3e4e'}`,
                  transition: 'background-color 0.3s ease',
                  boxShadow: i < currentLevel ? `0 0 6px ${branch.color}60` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', lineHeight: 1.4 }}>
          {skillDesc}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {node.effects.map((effect, i) => {
            const currentVal = currentLevel > 0 ? effect.value + effect.perLevel * (currentLevel - 1) : 0;
            const nextVal = currentLevel < node.maxLevel ? effect.value + effect.perLevel * currentLevel : currentVal;
            const displayVal = currentLevel > 0 ? currentVal : nextVal;

            const currentDesc = getEffectDescription(effect.descriptionKey, displayVal, t);

            if (currentLevel > 0 && currentLevel < node.maxLevel) {
              const nextDesc = getEffectDescription(effect.descriptionKey, nextVal, t);
              return (
                <div key={i} style={{ fontSize: '10px', color: isUnlocked ? branch.color : '#4a4a5a' }}>
                  {currentDesc} → {nextVal}
                </div>
              );
            }

            return (
              <div key={i} style={{ fontSize: '10px', color: isUnlocked ? branch.color : '#4a4a5a' }}>
                {currentDesc}
              </div>
            );
          })}
        </div>

        {!check.can && !isMaxed && check.reason && (
          <div style={{ fontSize: '9px', color: '#ef444480', marginTop: '4px' }}>
            {t.skillNodeCard.locked} {check.reason}
          </div>
        )}

        {check.can && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              animation: 'skillPulse 1.5s ease-in-out infinite',
              boxShadow: '0 0 8px #22c55e60',
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes skillPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </button>
  );
}