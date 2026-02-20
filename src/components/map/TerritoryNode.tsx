'use client';

import { useState } from 'react';
import {
  Lock,
  Eye,
  Swords,
  Crown,
  ChevronRight,
  Star,
  X,
} from 'lucide-react';
import type { Territory, TerritoryStatus } from '@/lib/map-data';
import { calculateTerritoryXPForLevel } from '@/lib/map-data';
import type { TerritoryProgress } from '@/hooks/use-map';

interface TerritoryNodeProps {
  territory: Territory;
  status: TerritoryStatus;
  progress?: TerritoryProgress;
  isActive: boolean;
  onActivate: (id: string) => void;
  isActivating: boolean;
}

const STATUS_CONFIG: Record<
  TerritoryStatus,
  {
    label: string;
    icon: typeof Lock;
    ringColor: string;
    textColor: string;
    glowShadow: string;
  }
> = {
  locked: {
    label: 'Заблокировано',
    icon: Lock,
    ringColor: '#3f3f46',
    textColor: '#52525b',
    glowShadow: 'none',
  },
  foggy: {
    label: 'В тумане',
    icon: Eye,
    ringColor: '#71717a',
    textColor: '#a1a1aa',
    glowShadow: 'none',
  },
  available: {
    label: 'Доступно',
    icon: ChevronRight,
    ringColor: '#22c55e',
    textColor: '#4ade80',
    glowShadow: '0 0 20px rgba(34,197,94,0.3)',
  },
  in_progress: {
    label: 'В процессе',
    icon: Swords,
    ringColor: '#f59e0b',
    textColor: '#fbbf24',
    glowShadow: '0 0 20px rgba(245,158,11,0.3)',
  },
  captured: {
    label: 'Захвачено',
    icon: Crown,
    ringColor: '#facc15',
    textColor: '#facc15',
    glowShadow: '0 0 25px rgba(250,204,21,0.4)',
  },
};

export function TerritoryNode({
  territory,
  status,
  progress,
  isActive,
  onActivate,
  isActivating,
}: TerritoryNodeProps) {
  const [showDetails, setShowDetails] = useState(false);
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  const currentXP = progress?.current_xp ?? 0;
  const currentLevel = progress?.level ?? 0;
  const requiredXP =
    status === 'in_progress'
      ? calculateTerritoryXPForLevel(territory.requiredXP, currentLevel)
      : territory.requiredXP;
  const xpPercent = requiredXP > 0 ? Math.min((currentXP / requiredXP) * 100, 100) : 0;

  const isLocked = status === 'locked';
  const isFoggy = status === 'foggy';
  const isInteractable = status === 'available' || status === 'in_progress';
  const isCaptured = status === 'captured';

  // SVG ring progress (for in_progress)
  const circumference = 2 * Math.PI * 34;
  const strokeOffset = circumference * (1 - xpPercent / 100);

  return (
    <>
      {/* Node button */}
      <button
        type="button"
        onClick={() => {
          if (!isLocked) setShowDetails(true);
        }}
        disabled={isLocked}
        style={{
          position: 'absolute',
          left: `${territory.position.x}%`,
          top: `${territory.position.y}%`,
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: isLocked ? 'not-allowed' : 'pointer',
          opacity: isLocked ? 0.35 : isFoggy ? 0.55 : 1,
          transition: 'opacity 0.3s, transform 0.15s',
          WebkitTapHighlightColor: 'transparent',
          zIndex: 10,
        }}
        onPointerDown={(e) => {
          if (isInteractable || isCaptured) {
            (e.currentTarget as HTMLButtonElement).style.transform =
              'translate(-50%, -50%) scale(0.92)';
          }
        }}
        onPointerUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform =
            'translate(-50%, -50%) scale(1)';
        }}
        onPointerLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform =
            'translate(-50%, -50%) scale(1)';
        }}
      >
        {/* Circle */}
        <div
          style={{
            position: 'relative',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#09090b',
            border: `2px solid ${config.ringColor}50`,
            boxShadow: config.glowShadow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'box-shadow 0.3s',
          }}
        >
          {/* Active pulse ring */}
          {isActive && (
            <div
              style={{
                position: 'absolute',
                inset: '-3px',
                borderRadius: '50%',
                border: '2px solid #22d3ee',
                animation: 'territory-pulse 2s ease-in-out infinite',
              }}
            />
          )}

          {/* SVG progress ring for in_progress */}
          {status === 'in_progress' && (
            <svg
              style={{
                position: 'absolute',
                inset: '-2px',
                width: 'calc(100% + 4px)',
                height: 'calc(100% + 4px)',
                transform: 'rotate(-90deg)',
              }}
              viewBox="0 0 72 72"
            >
              <circle
                cx="36"
                cy="36"
                r="34"
                fill="none"
                stroke={`${config.ringColor}25`}
                strokeWidth="3"
              />
              <circle
                cx="36"
                cy="36"
                r="34"
                fill="none"
                stroke={config.ringColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
          )}

          {/* Fog overlay */}
          {isFoggy && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background:
                  'linear-gradient(135deg, rgba(113,113,122,0.4), rgba(63,63,70,0.4))',
                backdropFilter: 'blur(2px)',
              }}
            />
          )}

          {/* Icon */}
          <span
            style={{
              fontSize: '26px',
              filter: isLocked || isFoggy ? 'grayscale(1)' : 'none',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {isFoggy ? '❓' : territory.icon}
          </span>

          {/* Status badge */}
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#09090b',
              border: `1px solid ${config.ringColor}60`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3,
            }}
          >
            <StatusIcon
              style={{ width: '10px', height: '10px', color: config.textColor }}
            />
          </div>

          {/* Level badge */}
          {currentLevel > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: '-6px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '10px',
                padding: '1px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                zIndex: 3,
              }}
            >
              <Star
                style={{
                  width: '8px',
                  height: '8px',
                  color: '#facc15',
                  fill: '#facc15',
                }}
              />
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#facc15',
                }}
              >
                {currentLevel}
              </span>
            </div>
          )}
        </div>

        {/* Name */}
        <span
          style={{
            fontSize: '10px',
            fontWeight: 500,
            color: config.textColor,
            maxWidth: '80px',
            textAlign: 'center',
            lineHeight: '1.2',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {isFoggy ? '???' : territory.name}
        </span>
      </button>

      {/* Details Modal */}
      {showDetails && (
        <TerritoryDetails
          territory={territory}
          status={status}
          progress={progress}
          isActive={isActive}
          onActivate={onActivate}
          onClose={() => setShowDetails(false)}
          isActivating={isActivating}
          currentLevel={currentLevel}
          currentXP={currentXP}
          requiredXP={requiredXP}
          xpPercent={xpPercent}
        />
      )}
    </>
  );
}

/* ─── Details Modal ─── */

interface TerritoryDetailsProps {
  territory: Territory;
  status: TerritoryStatus;
  progress?: TerritoryProgress;
  isActive: boolean;
  onActivate: (id: string) => void;
  onClose: () => void;
  isActivating: boolean;
  currentLevel: number;
  currentXP: number;
  requiredXP: number;
  xpPercent: number;
}

function TerritoryDetails({
  territory,
  status,
  isActive,
  onActivate,
  onClose,
  isActivating,
  currentLevel,
  currentXP,
  requiredXP,
  xpPercent,
}: TerritoryDetailsProps) {
  const config = STATUS_CONFIG[status];
  const isCaptured = status === 'captured';
  const canActivate = status === 'available' || (status === 'in_progress' && !isActive);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          overflow: 'hidden',
          animation: 'territory-modal-in 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            position: 'relative',
            padding: '16px',
            borderBottom: '1px solid #27272a50',
            background: `linear-gradient(135deg, ${territory.color}15, ${territory.color}08)`,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#27272a',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#a1a1aa',
            }}
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '36px' }}>{territory.icon}</span>
            <div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#fff',
                  margin: 0,
                }}
              >
                {territory.name}
              </h2>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: config.textColor,
                }}
              >
                {config.label}
                {currentLevel > 0 ? ` · Lv.${currentLevel}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0 }}>
            {territory.description}
          </p>

          <p
            style={{
              fontSize: '11px',
              color: '#71717a',
              fontStyle: 'italic',
              borderLeft: '2px solid #3f3f46',
              paddingLeft: '10px',
              margin: 0,
            }}
          >
            {territory.lore}
          </p>

          {/* XP Progress */}
          {status === 'in_progress' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  marginBottom: '4px',
                }}
              >
                <span style={{ color: '#a1a1aa' }}>Прогресс</span>
                <span style={{ color: '#fbbf24', fontFamily: 'monospace' }}>
                  {currentXP}/{requiredXP} XP
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  backgroundColor: '#27272a',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${xpPercent}%`,
                    background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                    borderRadius: '3px',
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: '10px',
                  color: '#52525b',
                  marginTop: '4px',
                }}
              >
                Следующий уровень: {currentLevel + 1}/{territory.maxLevel}
              </p>
            </div>
          )}

          {/* Captured badge */}
          {isCaptured && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: '#facc1515',
                borderRadius: '8px',
                border: '1px solid #facc1525',
              }}
            >
              <Crown style={{ width: '14px', height: '14px', color: '#facc15' }} />
              <span style={{ fontSize: '12px', color: '#facc15', fontWeight: 500 }}>
                Территория захвачена! Lv.{currentLevel}/{territory.maxLevel}
              </span>
            </div>
          )}

          {/* Requirements */}
          {territory.requirements.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#d4d4d8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                }}
              >
                Требования
              </h3>
              {territory.requirements.map((req, i) => {
                const met =
                  status === 'available' ||
                  status === 'in_progress' ||
                  status === 'captured';
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: met ? '#4ade80' : '#71717a',
                      marginBottom: '3px',
                    }}
                  >
                    <span>{met ? '✅' : '❌'}</span>
                    <span>{req.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rewards */}
          <div>
            <h3
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#d4d4d8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}
            >
              Награды
            </h3>
            {territory.rewards.map((reward, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: isCaptured ? '#facc15' : '#a1a1aa',
                  marginBottom: '3px',
                }}
              >
                <span>
                  {reward.type === 'xp_bonus'
                    ? '⚡'
                    : reward.type === 'gold_bonus'
                      ? '🪙'
                      : reward.type === 'passive_gold'
                        ? '💰'
                        : reward.type === 'skill_points'
                          ? '🧬'
                          : '👑'}
                </span>
                <span>{reward.label}</span>
              </div>
            ))}
          </div>

          {/* Skill branch */}
          {territory.skillBranch && (
            <p style={{ fontSize: '10px', color: '#52525b', margin: 0 }}>
              Связанная ветка:{' '}
              <span style={{ color: '#d4d4d8', fontWeight: 500 }}>
                {territory.skillBranch}
              </span>
            </p>
          )}

          {/* Activate button */}
          {canActivate && (
            <button
              type="button"
              onClick={() => onActivate(territory.id)}
              disabled={isActivating}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                cursor: isActivating ? 'not-allowed' : 'pointer',
                opacity: isActivating ? 0.5 : 1,
                backgroundColor:
                  status === 'available' ? '#16a34a' : '#d97706',
                color: '#fff',
                transition: 'background-color 0.2s',
              }}
              onPointerDown={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  'scale(0.97)';
              }}
              onPointerUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  'scale(1)';
              }}
              onPointerLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  'scale(1)';
              }}
            >
              {isActivating
                ? 'Активация...'
                : status === 'available'
                  ? '⚔️ Начать захват'
                  : '🎯 Сделать активной'}
            </button>
          )}

          {/* Already active indicator */}
          {isActive && status === 'in_progress' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px',
                backgroundColor: '#22d3ee15',
                borderRadius: '10px',
                border: '1px solid #22d3ee25',
              }}
            >
              <Swords
                style={{ width: '14px', height: '14px', color: '#22d3ee' }}
              />
              <span
                style={{
                  fontSize: '12px',
                  color: '#22d3ee',
                  fontWeight: 500,
                }}
              >
                Активная территория
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}