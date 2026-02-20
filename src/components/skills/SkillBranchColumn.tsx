'use client';

import type { SkillNode, SkillBranch } from '@/lib/skill-tree';
import { SKILL_BRANCHES, getSkillsByBranch } from '@/lib/skill-tree';
import SkillNodeCard from './SkillNodeCard';

interface SkillBranchColumnProps {
  branch: SkillBranch;
  allocated: Record<string, number>;
  availablePoints: number;
  onAllocate: (skillId: string) => void;
}

export default function SkillBranchColumn({
  branch,
  allocated,
  availablePoints,
  onAllocate,
}: SkillBranchColumnProps) {
  const branchInfo = SKILL_BRANCHES[branch];
  const nodes = getSkillsByBranch(branch).sort((a, b) => b.position.row - a.position.row);

  const totalInBranch = nodes.reduce((sum, n) => sum + (allocated[n.id] || 0), 0);
  const maxInBranch = nodes.reduce((sum, n) => sum + n.maxLevel, 0);

  return (
    <div
      style={{
        backgroundColor: '#0d0d14',
        border: `1px solid ${branchInfo.color}20`,
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '12px',
      }}
    >
      {/* Branch Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingBottom: '10px',
          borderBottom: `1px solid ${branchInfo.color}15`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '22px' }}>{branchInfo.icon}</span>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: branchInfo.color }}>
              {branchInfo.name}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>{branchInfo.description}</div>
          </div>
        </div>
        <div
          style={{
            fontSize: '12px',
            color: totalInBranch === maxInBranch ? '#22c55e' : branchInfo.color,
            backgroundColor: totalInBranch === maxInBranch ? '#22c55e15' : `${branchInfo.color}15`,
            padding: '4px 10px',
            borderRadius: '8px',
            fontWeight: 600,
          }}
        >
          {totalInBranch}/{maxInBranch}
        </div>
      </div>

      {/* Skill Nodes with connection lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {nodes.map((node, i) => (
          <div key={node.id}>
            <SkillNodeCard
              node={node}
              currentLevel={allocated[node.id] || 0}
              allocated={allocated}
              availablePoints={availablePoints}
              onAllocate={onAllocate}
            />
            {/* Connection line */}
            {i < nodes.length - 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '2px 0',
                }}
              >
                <div
                  style={{
                    width: '2px',
                    height: '12px',
                    backgroundColor:
                      (allocated[nodes[i + 1].id] || 0) > 0 ? branchInfo.color : '#2e2e3e',
                    transition: 'background-color 0.3s ease',
                    boxShadow:
                      (allocated[nodes[i + 1].id] || 0) > 0
                        ? `0 0 6px ${branchInfo.color}40`
                        : 'none',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}