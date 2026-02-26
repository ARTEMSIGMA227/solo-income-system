'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';
import { toast } from 'sonner';
import {
  Gift, Package, Backpack, ScrollText, Loader2, Star, Sparkles,
} from 'lucide-react';

interface Lootbox {
  id: string;
  box_type: 'common' | 'rare' | 'epic' | 'legendary';
  source: string;
  source_detail: string | null;
  created_at: string;
}

interface InventoryItem {
  id: string;
  reward_item_id: string;
  is_equipped: boolean;
  acquired_at: string;
  reward_items: {
    id: string;
    name: string;
    name_ru: string | null;
    description: string;
    description_ru: string | null;
    category: string;
    rarity: string;
    icon: string;
    value: Record<string, unknown>;
  };
}

interface RevealedReward {
  name: string;
  name_ru: string | null;
  description: string;
  description_ru: string | null;
  category: string;
  rarity: string;
  icon: string;
  value: Record<string, unknown>;
}

const BOX_COLORS = {
  common: { bg: 'from-gray-600 to-gray-700', border: 'border-gray-500', glow: 'shadow-gray-500/30', text: 'text-gray-300' },
  rare: { bg: 'from-blue-600 to-blue-800', border: 'border-blue-500', glow: 'shadow-blue-500/30', text: 'text-blue-300' },
  epic: { bg: 'from-purple-600 to-purple-800', border: 'border-purple-500', glow: 'shadow-purple-500/40', text: 'text-purple-300' },
  legendary: { bg: 'from-yellow-500 to-amber-700', border: 'border-yellow-400', glow: 'shadow-yellow-500/50', text: 'text-yellow-300' },
};

const RARITY_LABELS = {
  common: { en: 'Common', ru: 'Обычный' },
  rare: { en: 'Rare', ru: 'Редкий' },
  epic: { en: 'Epic', ru: 'Эпический' },
  legendary: { en: 'Legendary', ru: 'Легендарный' },
};

const SOURCE_LABELS: Record<string, { en: string; ru: string }> = {
  level_up: { en: 'Level Up', ru: 'Повышение уровня' },
  quest: { en: 'Quest', ru: 'Квест' },
  streak: { en: 'Streak', ru: 'Стрик' },
  boss: { en: 'Boss', ru: 'Босс' },
  shop: { en: 'Shop', ru: 'Магазин' },
};

const CATEGORY_LABELS: Record<string, { en: string; ru: string }> = {
  gold: { en: 'Gold', ru: 'Золото' },
  xp_boost: { en: 'XP Boost', ru: 'XP Буст' },
  title: { en: 'Title', ru: 'Титул' },
  frame: { en: 'Frame', ru: 'Рамка' },
  emoji: { en: 'Emoji', ru: 'Эмодзи' },
  perk: { en: 'Perk', ru: 'Перк' },
};

export default function RewardsPage() {
  const { locale } = useT();
  const ru = locale === 'ru';
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [unopened, setUnopened] = useState<Lootbox[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [tab, setTab] = useState<'boxes' | 'inventory' | 'history'>('boxes');

  // Opening animation state
  const [openingBox, setOpeningBox] = useState<Lootbox | null>(null);
  const [animPhase, setAnimPhase] = useState<'shake' | 'flash' | 'reveal' | null>(null);
  const [revealedReward, setRevealedReward] = useState<RevealedReward | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [{ data: boxes }, { data: inv }] = await Promise.all([
      supabase.from('lootboxes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_opened', false)
        .order('created_at', { ascending: false }),
      supabase.from('user_inventory')
        .select('*, reward_items(*)')
        .eq('user_id', user.id)
        .order('acquired_at', { ascending: false }),
    ]);

    setUnopened(boxes || []);
    setInventory((inv || []) as unknown as InventoryItem[]);
    setLoading(false);
  }

  async function openLootbox(box: Lootbox) {
    setOpeningBox(box);
    setAnimPhase('shake');

    // Shake for 1.2s
    await sleep(1200);
    setAnimPhase('flash');

    // Call RPC
    const { data, error } = await supabase.rpc('open_lootbox', { p_lootbox_id: box.id });

    // Flash for 0.6s
    await sleep(600);

    if (error || data?.error) {
      toast.error(data?.error || 'Error opening lootbox');
      setOpeningBox(null);
      setAnimPhase(null);
      return;
    }

    setRevealedReward(data as RevealedReward);
    setAnimPhase('reveal');
  }

  function closeReveal() {
    setOpeningBox(null);
    setAnimPhase(null);
    setRevealedReward(null);
    loadData();
  }

  async function toggleEquip(item: InventoryItem) {
    const equippable = ['title', 'frame'].includes(item.reward_items.category);
    if (!equippable) return;

    // Unequip all of same category first
    if (!item.is_equipped) {
      const sameCategory = inventory.filter(
        i => i.reward_items.category === item.reward_items.category && i.is_equipped
      );
      for (const i of sameCategory) {
        await supabase.from('user_inventory').update({ is_equipped: false }).eq('id', i.id);
      }
    }

    await supabase.from('user_inventory')
      .update({ is_equipped: !item.is_equipped })
      .eq('id', item.id);

    toast.success(item.is_equipped
      ? (ru ? 'Снято' : 'Unequipped')
      : (ru ? 'Экипировано' : 'Equipped'));
    loadData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const openedHistory = inventory.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Gift className="w-7 h-7 text-yellow-400" />
        <h1 className="text-2xl font-bold">{ru ? 'Награды' : 'Rewards'}</h1>
        {unopened.length > 0 && (
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold">
            {unopened.length} 📦
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
        {([
          { key: 'boxes' as const, icon: Package, label: ru ? 'Лутбоксы' : 'Lootboxes', count: unopened.length },
          { key: 'inventory' as const, icon: Backpack, label: ru ? 'Инвентарь' : 'Inventory', count: inventory.length },
          { key: 'history' as const, icon: ScrollText, label: ru ? 'История' : 'History', count: 0 },
        ]).map(({ key, icon: Icon, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {count > 0 && <span className="text-xs opacity-60">({count})</span>}
          </button>
        ))}
      </div>

      {/* TAB: Lootboxes */}
      {tab === 'boxes' && (
        <div>
          {unopened.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">{ru ? 'Нет лутбоксов. Выполняйте квесты и получайте награды!' : 'No lootboxes. Complete quests to earn rewards!'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {unopened.map(box => {
                const colors = BOX_COLORS[box.box_type];
                const rLabel = RARITY_LABELS[box.box_type];
                const sLabel = SOURCE_LABELS[box.source] || { en: box.source, ru: box.source };
                return (
                  <button
                    key={box.id}
                    onClick={() => openLootbox(box)}
                    className={`group bg-gradient-to-b ${colors.bg} border-2 ${colors.border} rounded-xl p-4 text-center hover:scale-105 transition-all shadow-lg ${colors.glow} hover:shadow-xl`}
                  >
                    <div className="text-4xl mb-2 group-hover:animate-bounce">📦</div>
                    <p className={`text-sm font-bold ${colors.text}`}>{ru ? rLabel.ru : rLabel.en}</p>
                    <p className="text-xs text-gray-400 mt-1">{ru ? sLabel.ru : sLabel.en}</p>
                    <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold ${colors.text} bg-black/30`}>
                      {ru ? 'ОТКРЫТЬ' : 'OPEN'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: Inventory */}
      {tab === 'inventory' && (
        <div>
          {inventory.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
              <Backpack className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">{ru ? 'Инвентарь пуст' : 'Inventory empty'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Group by category */}
              {['title', 'frame', 'perk', 'xp_boost', 'emoji', 'gold'].map(cat => {
                const items = inventory.filter(i => i.reward_items.category === cat);
                if (items.length === 0) return null;
                const catLabel = CATEGORY_LABELS[cat] || { en: cat, ru: cat };
                return (
                  <div key={cat}>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 mt-4">
                      {ru ? catLabel.ru : catLabel.en} ({items.length})
                    </h3>
                    <div className="space-y-1.5">
                      {items.map(item => {
                        const r = item.reward_items;
                        const rColors = BOX_COLORS[r.rarity as keyof typeof BOX_COLORS] || BOX_COLORS.common;
                        const equippable = ['title', 'frame'].includes(r.category);
                        return (
                          <div key={item.id}
                            className={`flex items-center gap-3 bg-gray-800/60 border ${item.is_equipped ? rColors.border : 'border-gray-700'} rounded-lg px-4 py-3 transition-all ${
                              item.is_equipped ? `shadow-md ${rColors.glow}` : ''
                            }`}
                          >
                            <span className="text-2xl">{r.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">
                                  {ru ? (r.name_ru || r.name) : r.name}
                                </span>
                                <span className={`text-xs font-bold ${rColors.text}`}>
                                  {ru ? RARITY_LABELS[r.rarity as keyof typeof RARITY_LABELS]?.ru : RARITY_LABELS[r.rarity as keyof typeof RARITY_LABELS]?.en}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {ru ? (r.description_ru || r.description) : r.description}
                              </p>
                            </div>
                            {equippable && (
                              <button
                                onClick={() => toggleEquip(item)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                  item.is_equipped
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                }`}
                              >
                                {item.is_equipped ? (ru ? 'СНЯТЬ' : 'OFF') : (ru ? 'НАДЕТЬ' : 'ON')}
                              </button>
                            )}
                            {r.category === 'gold' && (
                              <span className="text-xs text-green-400">✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: History */}
      {tab === 'history' && (
        <div>
          {openedHistory.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
              <ScrollText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">{ru ? 'История пуста' : 'No history'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {openedHistory.map(item => {
                const r = item.reward_items;
                const rColors = BOX_COLORS[r.rarity as keyof typeof BOX_COLORS] || BOX_COLORS.common;
                return (
                  <div key={item.id} className="flex items-center gap-3 bg-gray-800/40 rounded-lg px-4 py-3">
                    <span className="text-xl">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white">{ru ? (r.name_ru || r.name) : r.name}</span>
                      <span className={`ml-2 text-xs ${rColors.text}`}>
                        {ru ? RARITY_LABELS[r.rarity as keyof typeof RARITY_LABELS]?.ru : RARITY_LABELS[r.rarity as keyof typeof RARITY_LABELS]?.en}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(item.acquired_at).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* OPENING ANIMATION MODAL */}
      {openingBox && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          {/* Shake phase */}
          {animPhase === 'shake' && (
            <div className="text-center animate-shake">
              <div className="text-8xl mb-4">📦</div>
              <p className={`text-lg font-bold ${BOX_COLORS[openingBox.box_type].text}`}>
                {ru ? RARITY_LABELS[openingBox.box_type].ru : RARITY_LABELS[openingBox.box_type].en}
              </p>
            </div>
          )}

          {/* Flash phase */}
          {animPhase === 'flash' && (
            <div className="animate-flash">
              <div className="w-32 h-32 rounded-full bg-white/80 blur-3xl" />
            </div>
          )}

          {/* Reveal phase */}
          {animPhase === 'reveal' && revealedReward && (
            <div className="text-center animate-reveal">
              {/* Particles */}
              <div className="relative">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full animate-particle"
                    style={{
                      background: revealedReward.rarity === 'legendary' ? '#fbbf24'
                        : revealedReward.rarity === 'epic' ? '#a855f7'
                        : revealedReward.rarity === 'rare' ? '#3b82f6' : '#9ca3af',
                      left: '50%',
                      top: '50%',
                      '--angle': `${i * 30}deg`,
                      '--distance': `${80 + Math.random() * 40}px`,
                    } as React.CSSProperties}
                  />
                ))}

                {/* Glow */}
                <div className={`absolute inset-0 -m-8 rounded-full blur-3xl opacity-50 ${
                  revealedReward.rarity === 'legendary' ? 'bg-yellow-500'
                  : revealedReward.rarity === 'epic' ? 'bg-purple-500'
                  : revealedReward.rarity === 'rare' ? 'bg-blue-500' : 'bg-gray-500'
                }`} />

                {/* Reward card */}
                <div className={`relative bg-gray-900 border-2 ${
                  BOX_COLORS[revealedReward.rarity as keyof typeof BOX_COLORS]?.border || 'border-gray-600'
                } rounded-2xl p-8 min-w-[280px] shadow-2xl ${
                  BOX_COLORS[revealedReward.rarity as keyof typeof BOX_COLORS]?.glow || ''
                }`}>
                  <div className="text-6xl mb-4">{revealedReward.icon}</div>
                  <p className={`text-xs font-bold mb-1 ${
                    BOX_COLORS[revealedReward.rarity as keyof typeof BOX_COLORS]?.text || 'text-gray-400'
                  }`}>
                    {ru
                      ? RARITY_LABELS[revealedReward.rarity as keyof typeof RARITY_LABELS]?.ru
                      : RARITY_LABELS[revealedReward.rarity as keyof typeof RARITY_LABELS]?.en
                    }
                  </p>
                  <h2 className="text-xl font-bold text-white mb-2">
                    {ru ? (revealedReward.name_ru || revealedReward.name) : revealedReward.name}
                  </h2>
                  <p className="text-sm text-gray-400 mb-1">
                    {ru ? (revealedReward.description_ru || revealedReward.description) : revealedReward.description}
                  </p>
                  <p className="text-xs text-gray-500 mb-6">
                    {ru
                      ? CATEGORY_LABELS[revealedReward.category]?.ru
                      : CATEGORY_LABELS[revealedReward.category]?.en
                    }
                  </p>
                  <button
                    onClick={closeReveal}
                    className={`px-8 py-3 rounded-xl text-sm font-bold text-white transition-colors ${
                      revealedReward.rarity === 'legendary' ? 'bg-yellow-600 hover:bg-yellow-500'
                      : revealedReward.rarity === 'epic' ? 'bg-purple-600 hover:bg-purple-500'
                      : revealedReward.rarity === 'rare' ? 'bg-blue-600 hover:bg-blue-500'
                      : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  >
                    {ru ? 'Забрать!' : 'Claim!'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-8px, -4px) rotate(-3deg); }
          20% { transform: translate(8px, 2px) rotate(3deg); }
          30% { transform: translate(-6px, -6px) rotate(-2deg); }
          40% { transform: translate(6px, 4px) rotate(2deg); }
          50% { transform: translate(-4px, -2px) rotate(-1deg); }
          60% { transform: translate(4px, 2px) rotate(1deg); }
          70% { transform: translate(-8px, -4px) rotate(-3deg); }
          80% { transform: translate(8px, 6px) rotate(3deg); }
          90% { transform: translate(-4px, -2px) rotate(-2deg); }
        }
        .animate-shake { animation: shake 0.4s infinite; }
        
        @keyframes flash {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(3); opacity: 1; }
          100% { transform: scale(6); opacity: 0; }
        }
        .animate-flash { animation: flash 0.6s ease-out forwards; }
        
        @keyframes reveal {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.1) rotate(2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-reveal { animation: reveal 0.5s ease-out forwards; }
        
        @keyframes particle {
          0% { transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--distance)); opacity: 0; }
        }
        .animate-particle { animation: particle 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
