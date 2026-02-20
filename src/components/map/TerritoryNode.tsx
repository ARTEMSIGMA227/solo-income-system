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
    bgColor: string;
    borderStyle: string;
  }
> = {
  locked: {
    label: 'Заблокировано',
    icon: Lock,
    ringColor: '#3a3530',
    textColor: '#5a5040',
    glowShadow: 'none',
    bgColor: '#15130e',
    borderStyle: '1px dashed #3a353080',
  },
  foggy: {
    label: 'В тумане',
    icon: Eye,
    ringColor: '#5a5545',
    textColor: '#8a8070',
    glowShadow: '0 0 15px rgba(100,90,70,0.15)',
    bgColor: '#1a1812',
    borderStyle: '1px solid #5a554540',
  },
  available: {
    label: 'Доступно',
    icon: ChevronRight,
    ringColor: '#5d8a3c',
    textColor: '#7db856',
    glowShadow: '0 0 20px rgba(93,138,60,0.3), 0 0 40px rgba(93,138,60,0.1)',
    bgColor: '#151a10',
    borderStyle: '2px solid #5d8a3c70',
  },
  in_progress: {
    label: 'В процессе',
    icon: Swords,
    ringColor: '#c4880d',
    textColor: '#e5a420',
    glowShadow: '0 0 20px rgba(196,136,13,0.35), 0 0 40px rgba(196,136,13,0.1)',
    bgColor: '#1a1508',
    borderStyle: '2px solid #c4880d70',
  },
  captured: {
    label: 'Захвачено',
    icon: Crown,
    ringColor: '#d4a830',
    textColor: '#f0c848',
    glowShadow: '0 0 25px rgba(212,168,48,0.4), 0 0 50px rgba(212,168,48,0.15)',
    bgColor: '#1a1808',
    borderStyle: '2px solid #d4a83090',
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

  const circumference = 2 * Math.PI * 30;
  const strokeOffset = circumference * (1 - xpPercent / 100);

  return (
    <>
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
          gap: '3px',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: isLocked ? 'not-allowed' : 'pointer',
          opacity: isLocked ? 0.3 : isFoggy ? 0.5 : 1,
          transition: 'opacity 0.3s, transform 0.15s',
          WebkitTapHighlightColor: 'transparent',
          zIndex: 10,
        }}
        onPointerDown={(e) => {
          if (isInteractable || isCaptured) {
            (e.currentTarget as HTMLButtonElement).style.transform =
              'translate(-50%, -50%) scale(0.9)';
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
        {/* Glow ring under node */}
        {(isInteractable || isCaptured) && (
          <div
            style={{
              position: 'absolute',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${config.ringColor}20, transparent 70%)`,
              animation: isCaptured
                ? 'node-glow-captured 3s ease-in-out infinite'
                : isActive
                  ? 'node-glow-active 2s ease-in-out infinite'
                  : undefined,
              zIndex: 0,
            }}
          />
        )}

        {/* Main circle — shield/medallion style */}
        <div
          style={{
            position: 'relative',
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${config.bgColor}, #0a0908)`,
            border: config.borderStyle,
            boxShadow: config.glowShadow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'box-shadow 0.4s, border-color 0.4s',
            zIndex: 2,
          }}
        >
          {/* Inner ring decoration */}
          <div
            style={{
              position: 'absolute',
              inset: '3px',
              borderRadius: '50%',
              border: `1px solid ${config.ringColor}30`,
            }}
          />

          {/* Active territory pulse */}
          {isActive && (
            <div
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                border: '2px solid rgba(220, 190, 120, 0.6)',
                animation: 'territory-pulse 2s ease-in-out infinite',
              }}
            />
          )}

          {/* SVG progress ring */}
          {status === 'in_progress' && (
            <svg
              style={{
                position: 'absolute',
                inset: '-3px',
                width: 'calc(100% + 6px)',
                height: 'calc(100% + 6px)',
                transform: 'rotate(-90deg)',
              }}
              viewBox="0 0 64 64"
            >
              <circle
                cx="32"
                cy="32"
                r="30"
                fill="none"
                stroke={`${config.ringColor}15`}
                strokeWidth="2.5"
              />
              <circle
                cx="32"
                cy="32"
                r="30"
                fill="none"
                stroke={config.ringColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
          )}

          {/* Fog effect */}
          {isFoggy && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, rgba(80,70,50,0.5), rgba(40,35,25,0.3))',
                backdropFilter: 'blur(2px)',
                animation: 'fog-swirl 6s ease-in-out infinite',
              }}
            />
          )}

          {/* Captured crown particles */}
          {isCaptured && (
            <>
              <div
                style={{
                  position: 'absolute',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: '#d4a830',
                  top: '-2px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  animation: 'sparkle-float 2.5s ease-in-out infinite',
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: '3px',
                  height: '3px',
                  borderRadius: '50%',
                  backgroundColor: '#e5c040',
                  top: '5px',
                  right: '2px',
                  animation: 'sparkle-float 3s ease-in-out infinite 0.5s',
                  opacity: 0.4,
                }}
              />
            </>
          )}

          {/* Icon */}
          <span
            style={{
              fontSize: '24px',
              filter: isLocked ? 'grayscale(1) brightness(0.4)' : isFoggy ? 'grayscale(0.8) brightness(0.5)' : 'none',
              position: 'relative',
              zIndex: 2,
              textShadow: isCaptured ? '0 0 8px rgba(212,168,48,0.5)' : 'none',
            }}
          >
            {isFoggy ? '❓' : territory.icon}
          </span>

          {/* Status badge */}
          <div
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#0d0c08',
              border: `1px solid ${config.ringColor}80`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3,
            }}
          >
            <StatusIcon
              style={{ width: '9px', height: '9px', color: config.textColor }}
            />
          </div>

          {/* Level badge */}
          {currentLevel > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: '-5px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#12100a',
                border: '1px solid #d4a83060',
                borderRadius: '8px',
                padding: '1px 5px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                zIndex: 3,
              }}
            >
              <Star
                style={{
                  width: '7px',
                  height: '7px',
                  color: '#d4a830',
                  fill: '#d4a830',
                }}
              />
              <span
                style={{
                  fontSize: '8px',
                  fontWeight: 700,
                  color: '#d4a830',
                  fontFamily: 'serif',
                }}
              >
                {currentLevel}
              </span>
            </div>
          )}
        </div>

        {/* Name label — parchment style */}
        <span
          style={{
            fontSize: '9px',
            fontWeight: 500,
            color: config.textColor,
            maxWidth: '76px',
            textAlign: 'center',
            lineHeight: '1.15',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            fontFamily: 'serif',
            letterSpacing: '0.02em',
            textShadow: isCaptured ? `0 0 6px ${config.ringColor}40` : '0 1px 2px rgba(0,0,0,0.8)',
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

      {/* Node animations */}
      <style>{`
        @keyframes territory-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes node-glow-captured {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }
        @keyframes node-glow-active {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes fog-swirl {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.7; }
        }
        @keyframes sparkle-float {
          0%, 100% { 
            transform: translateY(0) scale(1); 
            opacity: 0.3; 
          }
          50% { 
            transform: translateY(-4px) scale(1.3); 
            opacity: 0.8; 
          }
        }
        @keyframes territory-modal-in {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
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
        backgroundColor: 'rgba(5,5,3,0.75)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#15130e',
          border: '1px solid rgba(140, 120, 80, 0.25)',
          borderRadius: '12px',
          overflow: 'hidden',
          animation: 'territory-modal-in 0.25s ease',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(140,120,80,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — parchment banner */}
        <div
          style={{
            position: 'relative',
            padding: '16px',
            borderBottom: '1px solid rgba(140, 120, 80, 0.15)',
            background: `linear-gradient(135deg, ${territory.color}10, rgba(20,18,12,0.95))`,
          }}
        >
          {/* Decorative corner */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '20px',
              height: '20px',
              borderLeft: '2px solid rgba(140,120,80,0.2)',
              borderTop: '2px solid rgba(140,120,80,0.2)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '20px',
              height: '20px',
              borderRight: '2px solid rgba(140,120,80,0.2)',
              borderTop: '2px solid rgba(140,120,80,0.2)',
            }}
          />

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
              backgroundColor: 'rgba(20,18,12,0.8)',
              border: '1px solid rgba(140,120,80,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(180,160,120,0.6)',
            }}
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, ${territory.color}15, #0a0908)`,
                border: `1px solid ${territory.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 15px ${territory.color}20`,
              }}
            >
              <span style={{ fontSize: '28px' }}>{territory.icon}</span>
            </div>
            <div>
              <h2
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: 'rgba(220, 200, 160, 0.95)',
                  margin: 0,
                  fontFamily: 'serif',
                }}
              >
                {territory.name}
              </h2>
              <span
                style={{
                  fontSize: '11px',
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
            gap: '12px',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              color: 'rgba(180, 160, 120, 0.7)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {territory.description}
          </p>

          {/* Lore — scroll style */}
          <div
            style={{
              padding: '8px 10px',
              backgroundColor: 'rgba(30, 25, 15, 0.5)',
              borderRadius: '4px',
              borderLeft: '2px solid rgba(140, 120, 80, 0.3)',
            }}
          >
            <p
              style={{
                fontSize: '10px',
                color: 'rgba(140, 120, 80, 0.6)',
                fontStyle: 'italic',
                margin: 0,
                fontFamily: 'serif',
                lineHeight: 1.5,
              }}
            >
              « {territory.lore} »
            </p>
          </div>

          {/* XP Progress */}
          {status === 'in_progress' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  marginBottom: '4px',
                }}
              >
                <span style={{ color: 'rgba(180,160,120,0.6)' }}>Прогресс захвата</span>
                <span style={{ color: '#e5a420', fontFamily: 'monospace' }}>
                  {currentXP}/{requiredXP} XP
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  backgroundColor: 'rgba(40,35,25,0.8)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  border: '1px solid rgba(100,85,55,0.2)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${xpPercent}%`,
                    background: 'linear-gradient(90deg, #8a6010, #c4880d, #e5a420)',
                    borderRadius: '2px',
                    transition: 'width 0.6s ease',
                    boxShadow: '0 0 6px rgba(196,136,13,0.4)',
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: '9px',
                  color: 'rgba(120,100,70,0.5)',
                  marginTop: '3px',
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
                backgroundColor: 'rgba(212,168,48,0.08)',
                borderRadius: '6px',
                border: '1px solid rgba(212,168,48,0.2)',
              }}
            >
              <Crown style={{ width: '14px', height: '14px', color: '#d4a830' }} />
              <span
                style={{
                  fontSize: '11px',
                  color: '#d4a830',
                  fontWeight: 500,
                  fontFamily: 'serif',
                }}
              >
                Территория захвачена! Lv.{currentLevel}/{territory.maxLevel}
              </span>
            </div>
          )}

          {/* Requirements */}
          {territory.requirements.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  color: 'rgba(180,160,120,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '5px',
                }}
              >
                ⚙ Требования
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
                      fontSize: '11px',
                      color: met ? '#7db856' : 'rgba(120,100,70,0.5)',
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
                fontSize: '9px',
                fontWeight: 600,
                color: 'rgba(180,160,120,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '5px',
              }}
            >
              🏆 Награды
            </h3>
            {territory.rewards.map((reward, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: isCaptured ? '#d4a830' : 'rgba(180,160,120,0.6)',
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
            <p
              style={{
                fontSize: '9px',
                color: 'rgba(120,100,70,0.5)',
                margin: 0,
                fontFamily: 'serif',
              }}
            >
              Связанная ветка:{' '}
              <span style={{ color: 'rgba(180,160,120,0.7)', fontWeight: 500 }}>
                {territory.skillBranch}
              </span>
            </p>
          )}

          {/* Activate button — seal style */}
          {canActivate && (
            <button
              type="button"
              onClick={() => onActivate(territory.id)}
              disabled={isActivating}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: status === 'available'
                  ? '1px solid rgba(93,138,60,0.4)'
                  : '1px solid rgba(196,136,13,0.4)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: isActivating ? 'not-allowed' : 'pointer',
                opacity: isActivating ? 0.5 : 1,
                backgroundColor:
                  status === 'available'
                    ? 'rgba(93,138,60,0.15)'
                    : 'rgba(196,136,13,0.15)',
                color:
                  status === 'available' ? '#7db856' : '#e5a420',
                transition: 'background-color 0.2s',
                fontFamily: 'serif',
                letterSpacing: '0.03em',
              }}
              onPointerDown={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
              }}
              onPointerUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }}
              onPointerLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }}
            >
              {isActivating
                ? 'Активация...'
                : status === 'available'
                  ? '⚔️ Начать захват'
                  : '🎯 Сделать активной'}
            </button>
          )}

          {/* Already active */}
          {isActive && status === 'in_progress' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px',
                backgroundColor: 'rgba(220,190,120,0.06)',
                borderRadius: '8px',
                border: '1px solid rgba(220,190,120,0.15)',
              }}
            >
              <Swords
                style={{ width: '13px', height: '13px', color: 'rgba(220,190,120,0.7)' }}
              />
              <span
                style={{
                  fontSize: '11px',
                  color: 'rgba(220,190,120,0.7)',
                  fontWeight: 500,
                  fontFamily: 'serif',
                }}
              >
                Активная территория
              </span>
            </div>
          )}
        </div>

        {/* Bottom decorative corners */}
        <div style={{ position: 'relative', height: '4px' }}>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '20px',
              height: '20px',
              borderLeft: '2px solid rgba(140,120,80,0.15)',
              borderBottom: '2px solid rgba(140,120,80,0.15)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '20px',
              height: '20px',
              borderRight: '2px solid rgba(140,120,80,0.15)',
              borderBottom: '2px solid rgba(140,120,80,0.15)',
            }}
          />
        </div>
      </div>
    </div>
  );
}