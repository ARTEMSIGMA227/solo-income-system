'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';
import {
  HUNTER_RANKS, HUNTER_PERKS,
  getRankByLevel, getNextRank, getRankProgress,
  getUnlockedPerks, getLockedPerks, getNextPerk,
} from '@/lib/ranks';
import {
  Shield, Zap, Trophy, Lock, CheckCircle2,
  Star, Loader2, Flame, Target, TrendingUp,
} from 'lucide-react';

export default function ProfilePage() {
  const { locale } = useT();
  const supabase = createClient();

  const [level, setLevel] = useState(1);
  const [totalXP, setTotalXP] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [streakCurrent, setStreakCurrent] = useState(0);
  const [streakBest, setStreakBest] = useState(0);
  const [totalActions, setTotalActions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: statsData }, { data: profileData }] = await Promise.all([
        supabase.from('stats').select('level, total_xp_earned, total_actions')
          .eq('user_id', user.id).single(),
        supabase.from('profiles').select('display_name, streak_current, streak_best')
          .eq('id', user.id).single(),
      ]);
      if (statsData) {
        setLevel(statsData.level || 1);
        setTotalXP(statsData.total_xp_earned || 0);
        setTotalActions(statsData.total_actions || 0);
      }
      if (profileData) {
        setDisplayName(profileData.display_name || '');
        setStreakCurrent(profileData.streak_current || 0);
        setStreakBest(profileData.streak_best || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const rank = getRankByLevel(level);
  const nextRank = getNextRank(level);
  const rankProgress = getRankProgress(level);
  const unlocked = getUnlockedPerks(level);
  const locked = getLockedPerks(level);
  const nextPerkData = getNextPerk(level);
  const lang = locale === 'ru' ? 'ru' : 'en';

  const rankNames: Record<string, Record<string, string>> = {
    en: { E: 'Nameless', D: 'Recruit', C: 'Hunter', B: 'Warrior', A: 'Knight', S: 'S-Rank Hunter', SS: 'National Hunter', SSS: 'Shadow Monarch' },
    ru: { E: 'Безымянный', D: 'Рекрут', C: 'Охотник', B: 'Воин', A: 'Рыцарь', S: 'S-Ранг Охотник', SS: 'Национальный Охотник', SSS: 'Тёмный Монарх' },
  };

  const perkNames: Record<string, Record<string, string>> = {
    en: {
      basic_analytics: 'Basic Analytics', ai_advisor_basic: 'AI Advisor (3/day)',
      extended_analytics: 'Extended Analytics (30 days)', daily_plan: 'Auto Day Plan',
      pdf_export: 'PDF Export', ai_advisor_unlimited: 'AI Advisor (Unlimited)',
      weekly_plan: 'Auto Weekly Plan', full_analytics: 'Full Analytics (365 days)',
      monthly_plan: 'Auto Monthly Plan', xp_multiplier: 'XP Multiplier x1.2',
      gold_multiplier: 'Gold Multiplier x1.2', shadow_monarch: 'Shadow Monarch - All Perks',
    },
    ru: {
      basic_analytics: 'Базовая аналитика', ai_advisor_basic: 'AI Советник (3/день)',
      extended_analytics: 'Расширенная аналитика (30 дней)', daily_plan: 'Автоплан на день',
      pdf_export: 'Экспорт PDF', ai_advisor_unlimited: 'AI Советник (безлимит)',
      weekly_plan: 'Автоплан на неделю', full_analytics: 'Полная аналитика (365 дней)',
      monthly_plan: 'Автоплан на месяц', xp_multiplier: 'Множитель XP x1.2',
      gold_multiplier: 'Множитель Gold x1.2', shadow_monarch: 'Тёмный Монарх - все перки',
    },
  };

  const perkDesc: Record<string, Record<string, string>> = {
    en: {
      basic_analytics: 'View 7 days of activity history',
      ai_advisor_basic: 'Ask AI advisor 3 times per day',
      extended_analytics: 'View 30 days of detailed analytics',
      daily_plan: 'AI generates your daily action plan',
      pdf_export: 'Export statistics as PDF reports',
      ai_advisor_unlimited: 'Unlimited AI advisor conversations',
      weekly_plan: 'AI generates your weekly strategy',
      full_analytics: 'Full year of analytics with all charts',
      monthly_plan: 'AI generates monthly income strategy',
      xp_multiplier: 'Earn 20% more XP from all sources',
      gold_multiplier: 'Earn 20% more Gold from all sources',
      shadow_monarch: 'Ultimate title + all perks unlocked',
    },
    ru: {
      basic_analytics: 'Просмотр 7 дней истории активности',
      ai_advisor_basic: 'AI советник - 3 запроса в день',
      extended_analytics: '30 дней детальной аналитики',
      daily_plan: 'AI генерирует план действий на день',
      pdf_export: 'Экспорт статистики в PDF отчёты',
      ai_advisor_unlimited: 'Безлимитное общение с AI советником',
      weekly_plan: 'AI генерирует стратегию на неделю',
      full_analytics: 'Полный год аналитики со всеми графиками',
      monthly_plan: 'AI генерирует стратегию дохода на месяц',
      xp_multiplier: 'Получай на 20% больше XP из всех источников',
      gold_multiplier: 'Получай на 20% больше Gold из всех источников',
      shadow_monarch: 'Высший титул + все перки разблокированы',
    },
  };

  const catNames: Record<string, Record<string, string>> = {
    en: { analytics: 'Analytics', ai: 'AI', planning: 'Planning', boost: 'Boost', special: 'Special' },
    ru: { analytics: 'Аналитика', ai: 'ИИ', planning: 'Планирование', boost: 'Бонусы', special: 'Особые' },
  };

  const catColors: Record<string, string> = {
    analytics: '#3B82F6', ai: '#A855F7', planning: '#10B981', boost: '#F59E0B', special: '#FFD700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Shield className="w-7 h-7 text-purple-400" />
          {lang === 'ru' ? 'Профиль Охотника' : 'Hunter Profile'}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {lang === 'ru' ? 'Ранг, перки и прогресс' : 'Rank, perks & progress'}
        </p>
      </div>

      {/* Rank Card */}
      <div
        className="relative overflow-hidden rounded-2xl border p-6"
        style={{
          borderColor: rank.borderColor,
          backgroundColor: rank.bgColor,
          boxShadow: rank.glow || undefined,
        }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div
            className="w-28 h-28 rounded-2xl flex flex-col items-center justify-center border-2"
            style={{
              borderColor: rank.color,
              backgroundColor: rank.color + '15',
              boxShadow: rank.glow || '0 0 20px ' + rank.color + '20',
            }}
          >
            <span className="text-4xl">{rank.emoji}</span>
            <span className="text-2xl font-black mt-1" style={{ color: rank.color }}>
              {rank.label}
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="text-sm text-gray-400 mb-1">{lang === 'ru' ? 'Ранг' : 'Rank'}</div>
            <h2 className="text-2xl font-bold" style={{ color: rank.color }}>
              {rankNames[lang][rank.id]}
            </h2>
            <p className="text-gray-300 mt-1">{displayName || (lang === 'ru' ? 'Охотник' : 'Hunter')}</p>
            <div className="flex flex-wrap gap-4 mt-3 justify-center sm:justify-start">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">{lang === 'ru' ? 'Уровень' : 'Level'} {level}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-300">{totalXP.toLocaleString()} XP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-gray-300">🔥 {streakCurrent}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">
                  {totalActions.toLocaleString()} {lang === 'ru' ? 'действий' : 'actions'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {nextRank && (
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">
                {lang === 'ru' ? 'До ранга' : 'Next rank'}:{' '}
                <span className="font-semibold" style={{ color: nextRank.color }}>
                  {nextRank.emoji} {nextRank.label} — {rankNames[lang][nextRank.id]}
                </span>
              </span>
              <span className="text-gray-400">Lv {nextRank.minLevel}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: rankProgress + '%',
                  backgroundColor: rank.color,
                  boxShadow: '0 0 8px ' + rank.color + '50',
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">{rankProgress}%</p>
          </div>
        )}
      </div>

      {/* All Ranks Grid */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          {lang === 'ru' ? 'Все ранги' : 'All Ranks'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {HUNTER_RANKS.map((r) => {
            const isCurrent = r.id === rank.id;
            const isUnlocked = level >= r.minLevel;
            return (
              <div
                key={r.id}
                className={'relative rounded-xl border p-3 text-center transition-all'}
                style={{
                  borderColor: isUnlocked ? r.borderColor : '#374151',
                  backgroundColor: isUnlocked ? r.bgColor : '#11111880',
                  opacity: isUnlocked ? 1 : 0.5,
                  boxShadow: isCurrent && r.glow ? r.glow : undefined,
                  outline: isCurrent ? `2px solid ${r.color}` : 'none',
                  outlineOffset: '2px',
                }}
              >
                {isCurrent && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    YOU
                  </div>
                )}
                <span className="text-2xl">{r.emoji}</span>
                <div className="font-bold text-lg mt-1" style={{ color: isUnlocked ? r.color : '#6B7280' }}>
                  {r.label}
                </div>
                <div className="text-[11px] text-gray-400">{rankNames[lang][r.id]}</div>
                <div className="text-[10px] text-gray-500 mt-1">
                  Lv {r.minLevel}{r.maxLevel < 999 ? '-' + r.maxLevel : '+'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Perk */}
      {nextPerkData && (
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{nextPerkData.emoji}</div>
            <div className="flex-1">
              <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider">
                {lang === 'ru' ? 'Следующий перк' : 'Next Perk'}
              </p>
              <p className="text-white font-bold">{perkNames[lang][nextPerkData.id]}</p>
              <p className="text-gray-400 text-sm">{perkDesc[lang][nextPerkData.id]}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">{lang === 'ru' ? 'Уровень' : 'Level'}</div>
              <div className="text-2xl font-bold text-purple-400">{nextPerkData.unlockLevel}</div>
              <div className="text-xs text-gray-500">
                {nextPerkData.unlockLevel - level} {lang === 'ru' ? 'ур.' : 'lvl'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unlocked Perks */}
      {unlocked.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            {lang === 'ru' ? 'Разблокированные перки' : 'Unlocked Perks'}
            <span className="text-sm font-normal text-gray-400">({unlocked.length}/{HUNTER_PERKS.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unlocked.map((perk) => (
              <div key={perk.id} className="flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <span className="text-2xl">{perk.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{perkNames[lang][perk.id]}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: catColors[perk.category] + '20', color: catColors[perk.category] }}
                    >
                      {catNames[lang][perk.category]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{perkDesc[lang][perk.id]}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Perks */}
      {locked.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-500" />
            {lang === 'ru' ? 'Заблокированные перки' : 'Locked Perks'}
            <span className="text-sm font-normal text-gray-400">({locked.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {locked.map((perk) => (
              <div key={perk.id} className="flex items-start gap-3 rounded-xl border border-gray-700 bg-gray-900/50 p-4 opacity-60">
                <span className="text-2xl grayscale">{perk.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-400">{perkNames[lang][perk.id]}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-800 text-gray-500">
                      Lv {perk.unlockLevel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{perkDesc[lang][perk.id]}</p>
                </div>
                <Lock className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          {lang === 'ru' ? 'Сводка' : 'Summary'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: lang === 'ru' ? 'Уровень' : 'Level', value: String(level), color: '#A855F7' },
            { label: 'XP', value: totalXP.toLocaleString(), color: '#8B5CF6' },
            { label: lang === 'ru' ? 'Стрик' : 'Streak', value: '🔥 ' + streakCurrent, color: '#F97316' },
            { label: lang === 'ru' ? 'Лучший' : 'Best', value: String(streakBest), color: '#FBBF24' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-900 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">{s.label}</div>
              <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}