'use client';

import { useState } from 'react';
import {
  Lock, Eye, Swords, Crown, ChevronRight, Star, X,
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import type { Territory, TerritoryStatus } from '@/lib/map-data';
import { BIOME_CONFIG, calculateTerritoryXPForLevel } from '@/lib/map-data';
import type { TerritoryProgress } from '@/hooks/use-map';

interface TerritoryNodeProps {
  territory: Territory;
  status: TerritoryStatus;
  progress?: TerritoryProgress;
  isActive: boolean;
  onActivate: (id: string) => void;
  isActivating: boolean;
}

const STATUS_ICONS: Record<TerritoryStatus, typeof Lock> = {
  locked: Lock,
  foggy: Eye,
  available: ChevronRight,
  in_progress: Swords,
  captured: Crown,
};

const STATUS_STYLES: Record<
  TerritoryStatus,
  {
    ringColor: string;
    textColor: string;
    glowShadow: string;
    bgColor: string;
    borderStyle: string;
    sealColor: string;
  }
> = {
  locked: {
    ringColor: '#8a7c68',
    textColor: '#7a6c58',
    glowShadow: 'none',
    bgColor: '#a89878',
    borderStyle: '1.5px dashed #8a7c6850',
    sealColor: '#6b5c48',
  },
  foggy: {
    ringColor: '#9a8c78',
    textColor: '#8a7c68',
    glowShadow: '0 0 10px rgba(150,130,100,0.15)',
    bgColor: '#b0a088',
    borderStyle: '1.5px solid #9a8c7850',
    sealColor: '#7a6c58',
  },
  available: {
    ringColor: '#5a8a30',
    textColor: '#4a7c22',
    glowShadow: '0 0 15px rgba(90,138,48,0.3), 0 0 30px rgba(90,138,48,0.1)',
    bgColor: '#c4b894',
    borderStyle: '2px solid #5a8a3080',
    sealColor: '#4a7c22',
  },
  in_progress: {
    ringColor: '#b07808',
    textColor: '#a06a00',
    glowShadow: '0 0 18px rgba(176,120,8,0.35), 0 0 35px rgba(176,120,8,0.1)',
    bgColor: '#d0c098',
    borderStyle: '2px solid #b0780880',
    sealColor: '#a06a00',
  },
  captured: {
    ringColor: '#8b6914',
    textColor: '#7a5a08',
    glowShadow: '0 0 22px rgba(139,105,20,0.4), 0 0 45px rgba(139,105,20,0.15)',
    bgColor: '#d8c898',
    borderStyle: '2px solid #8b691490',
    sealColor: '#7a5a08',
  },
};

export function TerritoryNode({
  territory, status, progress, isActive, onActivate, isActivating,
}: TerritoryNodeProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { t } = useT();
  const config = STATUS_STYLES[status];
  const StatusIcon = STATUS_ICONS[status];

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

  const circumference = 2 * Math.PI * 28;
  const strokeOffset = circumference * (1 - xpPercent / 100);

  const territoryName =
    t.map.territories_names[territory.id as keyof typeof t.map.territories_names] ||
    territory.nameKey;

  return (
    <>
      <button
        type="button"
        onClick={() => { if (!isLocked) setShowDetails(true); }}
        disabled={isLocked}
        style={{
          position: 'absolute',
          left: `${territory.position.x}%`,
          top: `${territory.position.y}%`,
          transform: 'translate(-50%, -50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
          background: 'none', border: 'none', padding: 0,
          cursor: isLocked ? 'not-allowed' : 'pointer',
          opacity: isLocked ? 0.35 : isFoggy ? 0.55 : 1,
          transition: 'opacity 0.3s, transform 0.15s',
          WebkitTapHighlightColor: 'transparent', zIndex: 10,
        }}
        onPointerDown={(e) => {
          if (isInteractable || isCaptured)
            (e.currentTarget as HTMLButtonElement).style.transform = 'translate(-50%, -50%) scale(0.9)';
        }}
        onPointerUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translate(-50%, -50%) scale(1)'; }}
        onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translate(-50%, -50%) scale(1)'; }}
      >
        {(isInteractable || isCaptured) && (
          <div style={{ position: 'absolute', width: '56px', height: '14px', borderRadius: '50%', background: 'rgba(60, 40, 20, 0.15)', bottom: '10px', filter: 'blur(3px)', zIndex: 0 }} />
        )}

        {(isInteractable || isCaptured) && (
          <div style={{
            position: 'absolute', width: '76px', height: '76px', borderRadius: '50%',
            background: `radial-gradient(circle, ${config.sealColor}18, transparent 70%)`,
            animation: isCaptured ? 'node-glow-captured 3s ease-in-out infinite' : isActive ? 'node-glow-active 2s ease-in-out infinite' : undefined,
            zIndex: 0,
          }} />
        )}

        <div style={{
          position: 'relative', width: '54px', height: '54px', borderRadius: '50%',
          background: `radial-gradient(circle at 38% 35%, ${config.bgColor}, ${config.bgColor}cc)`,
          border: config.borderStyle,
          boxShadow: `${config.glowShadow}${config.glowShadow !== 'none' ? ',' : ''} inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -2px 3px rgba(0,0,0,0.1), 0 2px 6px rgba(40,30,15,0.3)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'box-shadow 0.4s, border-color 0.4s', zIndex: 2,
        }}>
          {isLocked && (<div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle at 40% 35%, rgba(160,130,90,0.3), rgba(100,80,50,0.4))` }} />)}
          <div style={{ position: 'absolute', inset: '3px', borderRadius: '50%', border: `1px solid ${config.ringColor}25` }} />
          {isActive && (<div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', border: '2px solid rgba(140, 100, 30, 0.6)', animation: 'territory-pulse 2s ease-in-out infinite' }} />)}

          {status === 'in_progress' && (
            <svg style={{ position: 'absolute', inset: '-4px', width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', transform: 'rotate(-90deg)' }} viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="28" fill="none" stroke={`${config.ringColor}12`} strokeWidth="2.5" />
              <circle cx="30" cy="30" r="28" fill="none" stroke={config.sealColor} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeOffset} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            </svg>
          )}

          {isFoggy && (<div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,160,130,0.6), rgba(150,130,100,0.4))', backdropFilter: 'blur(1px)', animation: 'fog-swirl 6s ease-in-out infinite' }} />)}

          {isCaptured && (
            <>
              <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#b08a20', top: '-1px', left: '50%', transform: 'translateX(-50%)', animation: 'sparkle-float 2.5s ease-in-out infinite', opacity: 0.7 }} />
              <div style={{ position: 'absolute', width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#c0a030', top: '6px', right: '2px', animation: 'sparkle-float 3s ease-in-out infinite 0.6s', opacity: 0.5 }} />
            </>
          )}

          <span style={{ fontSize: '22px', filter: isLocked ? 'grayscale(0.8) brightness(0.5)' : isFoggy ? 'grayscale(0.7) brightness(0.6)' : 'none', position: 'relative', zIndex: 2, textShadow: isCaptured ? '0 0 6px rgba(139,105,20,0.4)' : 'none' }}>
            {isFoggy ? '❓' : territory.icon}
          </span>

          <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: config.bgColor, border: `1.5px solid ${config.sealColor}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, boxShadow: '0 1px 3px rgba(40,30,15,0.2)' }}>
            <StatusIcon style={{ width: '8px', height: '8px', color: config.sealColor }} />
          </div>

          {currentLevel > 0 && (
            <div style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(200, 180, 140, 0.95)', border: '1px solid rgba(139, 105, 20, 0.4)', borderRadius: '7px', padding: '0px 4px', display: 'flex', alignItems: 'center', gap: '1px', zIndex: 3, boxShadow: '0 1px 2px rgba(40,30,15,0.2)' }}>
              <Star style={{ width: '7px', height: '7px', color: '#8b6914', fill: '#8b6914' }} />
              <span style={{ fontSize: '8px', fontWeight: 700, color: '#6b5010', fontFamily: 'serif' }}>{currentLevel}</span>
            </div>
          )}
        </div>

        <div style={{ position: 'relative', backgroundColor: 'rgba(200, 180, 140, 0.8)', borderRadius: '3px', padding: '1px 6px', border: '0.5px solid rgba(120, 90, 50, 0.2)', maxWidth: '80px', boxShadow: '0 1px 2px rgba(40,30,15,0.15)' }}>
          <span style={{ fontSize: '8px', fontWeight: 600, color: config.sealColor, textAlign: 'center', lineHeight: '1.2', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontFamily: 'serif', letterSpacing: '0.02em' }}>
            {isFoggy ? '???' : territoryName}
          </span>
        </div>
      </button>

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

      <style>{`
        @keyframes territory-pulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.06); } }
        @keyframes node-glow-captured { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.08); } }
        @keyframes node-glow-active { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        @keyframes fog-swirl { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.7; } }
        @keyframes sparkle-float { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; } 50% { transform: translateY(-4px) scale(1.3); opacity: 0.8; } }
        @keyframes territory-modal-in { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
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
  territory, status, isActive, onActivate, onClose,
  isActivating, currentLevel, currentXP, requiredXP, xpPercent,
}: TerritoryDetailsProps) {
  const { t } = useT();
  const config = STATUS_STYLES[status];
  const biomeInfo = BIOME_CONFIG[territory.biome];
  const isCaptured = status === 'captured';
  const canActivate = status === 'available' || (status === 'in_progress' && !isActive);

  const name = t.map.territories_names[territory.id as keyof typeof t.map.territories_names] || territory.nameKey;
  const description = t.map.territories_descriptions[territory.id as keyof typeof t.map.territories_descriptions] || territory.descriptionKey;
  const lore = t.map.territories_lore[territory.id as keyof typeof t.map.territories_lore] || territory.loreKey;
  const statusLabel = t.territoryNode.statuses[status];
  const biomeName = t.map.biomes[territory.biome as keyof typeof t.map.biomes] || territory.biome;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(40, 30, 15, 0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: '380px', background: 'linear-gradient(170deg, #d8c8a0 0%, #c8b888 40%, #b8a878 100%)', border: '2px solid rgba(120, 90, 50, 0.4)', borderRadius: '8px', overflow: 'hidden', animation: 'territory-modal-in 0.25s ease', boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ position: 'relative', padding: '16px', borderBottom: '1px solid rgba(120, 90, 50, 0.2)', background: `linear-gradient(135deg, rgba(120,90,50,0.08), transparent)` }}>
          <button type="button" onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px', width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'rgba(120, 90, 50, 0.1)', border: '1px solid rgba(120, 90, 50, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(80, 55, 30, 0.6)' }}>
            <X style={{ width: '13px', height: '13px' }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `radial-gradient(circle at 38% 35%, ${config.bgColor}, ${config.bgColor}bb)`, border: `1.5px solid ${config.sealColor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `inset 0 1px 2px rgba(255,255,255,0.15), 0 2px 6px rgba(40,30,15,0.2)` }}>
              <span style={{ fontSize: '26px' }}>{territory.icon}</span>
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'rgba(60, 40, 20, 0.9)', margin: 0, fontFamily: 'serif' }}>{name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: config.sealColor }}>
                  {statusLabel}{currentLevel > 0 ? ` · Lv.${currentLevel}` : ''}
                </span>
                <span style={{ fontSize: '9px', color: biomeInfo.accent, backgroundColor: `${biomeInfo.accent}15`, padding: '1px 4px', borderRadius: '3px', fontFamily: 'serif' }}>
                  {biomeName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '12px', color: 'rgba(60, 40, 20, 0.7)', margin: 0, lineHeight: 1.5 }}>{description}</p>

          <div style={{ padding: '7px 10px', backgroundColor: 'rgba(80, 55, 30, 0.06)', borderRadius: '3px', borderLeft: '2px solid rgba(120, 90, 50, 0.25)' }}>
            <p style={{ fontSize: '10px', color: 'rgba(80, 55, 30, 0.55)', fontStyle: 'italic', margin: 0, fontFamily: 'serif', lineHeight: 1.5 }}>
              « {lore} »
            </p>
          </div>

          {status === 'in_progress' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
                <span style={{ color: 'rgba(80,55,30,0.6)' }}>{t.territoryNode.captureProgress}</span>
                <span style={{ color: '#8b6914', fontFamily: 'monospace', fontWeight: 600 }}>{currentXP}/{requiredXP} XP</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'rgba(80, 55, 30, 0.1)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(120, 90, 50, 0.15)' }}>
                <div style={{ height: '100%', width: `${xpPercent}%`, background: 'linear-gradient(90deg, #8b6914, #b08a20, #c8a030)', borderRadius: '2px', transition: 'width 0.6s ease', boxShadow: '0 0 4px rgba(139,105,20,0.3)' }} />
              </div>
              <p style={{ fontSize: '9px', color: 'rgba(80,55,30,0.4)', marginTop: '3px' }}>
                {t.territoryNode.nextLevel}: {currentLevel + 1}/{territory.maxLevel}
              </p>
            </div>
          )}

          {isCaptured && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'rgba(139,105,20,0.08)', borderRadius: '4px', border: '1px solid rgba(139,105,20,0.2)' }}>
              <Crown style={{ width: '14px', height: '14px', color: '#8b6914' }} />
              <span style={{ fontSize: '11px', color: '#6b5010', fontWeight: 600, fontFamily: 'serif' }}>
                {t.territoryNode.territoryCaptured} Lv.{currentLevel}/{territory.maxLevel}
              </span>
            </div>
          )}

          {territory.requirements.length > 0 && (
            <div>
              <h3 style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(80,55,30,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontFamily: 'serif' }}>
                {t.territoryNode.requirements}
              </h3>
              {territory.requirements.map((req, i) => {
                const met = status === 'available' || status === 'in_progress' || status === 'captured';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: met ? '#4a7c22' : 'rgba(80,55,30,0.4)', marginBottom: '2px' }}>
                    <span>{met ? '✅' : '❌'}</span>
                    <span>{req.labelKey}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <h3 style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(80,55,30,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontFamily: 'serif' }}>
              {t.territoryNode.rewards}
            </h3>
            {territory.rewards.map((reward, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: isCaptured ? '#6b5010' : 'rgba(60,40,20,0.6)', marginBottom: '2px' }}>
                <span>{reward.type === 'xp_bonus' ? '⚡' : reward.type === 'gold_bonus' ? '🪙' : reward.type === 'passive_gold' ? '💰' : reward.type === 'skill_points' ? '🧬' : '👑'}</span>
                <span>{reward.labelKey}</span>
              </div>
            ))}
          </div>

          {territory.skillBranch && (
            <p style={{ fontSize: '9px', color: 'rgba(80,55,30,0.45)', margin: 0, fontFamily: 'serif' }}>
              {t.territoryNode.linkedBranch}:{' '}
              <span style={{ color: 'rgba(60,40,20,0.7)', fontWeight: 600 }}>
                {t.skills.branches[territory.skillBranch as keyof typeof t.skills.branches] || territory.skillBranch}
              </span>
            </p>
          )}

          {canActivate && (
            <button
              type="button"
              onClick={() => onActivate(territory.id)}
              disabled={isActivating}
              style={{
                width: '100%', padding: '10px', borderRadius: '6px',
                border: status === 'available' ? '1.5px solid rgba(74,124,34,0.5)' : '1.5px solid rgba(176,120,8,0.5)',
                fontWeight: 700, fontSize: '13px',
                cursor: isActivating ? 'not-allowed' : 'pointer',
                opacity: isActivating ? 0.5 : 1,
                backgroundColor: status === 'available' ? 'rgba(74,124,34,0.12)' : 'rgba(176,120,8,0.12)',
                color: status === 'available' ? '#3a6c18' : '#8b6914',
                transition: 'background-color 0.2s, transform 0.1s',
                fontFamily: 'serif', letterSpacing: '0.03em',
              }}
              onPointerDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
              onPointerUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
              onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              {isActivating ? t.territoryNode.activating : status === 'available' ? t.territoryNode.startCapture : t.territoryNode.makeActive}
            </button>
          )}

          {isActive && status === 'in_progress' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', backgroundColor: 'rgba(139,105,20,0.06)', borderRadius: '6px', border: '1px solid rgba(139,105,20,0.15)' }}>
              <Swords style={{ width: '13px', height: '13px', color: 'rgba(100,75,20,0.7)' }} />
              <span style={{ fontSize: '11px', color: 'rgba(100,75,20,0.7)', fontWeight: 600, fontFamily: 'serif' }}>
                {t.territoryNode.activeTerritory}
              </span>
            </div>
          )}
        </div>

        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(120,90,50,0.2), transparent)', margin: '0 16px 8px' }} />
      </div>
    </div>
  );
}