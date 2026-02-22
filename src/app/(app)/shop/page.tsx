'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber } from '@/lib/utils';
import { getLevelInfo } from '@/lib/xp';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';
import type { ShopItem, InventoryItem, Stats } from '@/types/database';
import { loadSkillEffectsFromDB, applyShopDiscount } from '@/lib/skill-effects';
import type { SkillEffectType } from '@/lib/skill-tree';

export default function ShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'shop' | 'inventory'>('shop');
  const [filter, setFilter] = useState<'all' | 'potion' | 'artifact' | 'scroll'>('all');
  const [skillEffects, setSkillEffects] = useState<Partial<Record<SkillEffectType, number>>>({});
  const { t, locale } = useT();

  // Resolve item name/description via i18n dictionary, fallback to DB value
  function getItemName(item: ShopItem): string {
    return t.shop.itemNames[item.item_key] ?? item.name;
  }

  function getItemDesc(item: ShopItem): string {
    return t.shop.itemDescriptions[item.item_key] ?? item.description;
  }

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const effects = await loadSkillEffectsFromDB(user.id);
      setSkillEffects(effects);

      const { data: shopData } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_available', true)
        .order('category')
        .order('price');
      setItems(shopData || []);

      const { data: invData } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id);
      setInventory(invData || []);

      const { data: statsData } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setStats(statsData);

      setLoading(false);
    }
    load();
  }, []);

  function getDiscountedPrice(basePrice: number): number {
    return applyShopDiscount(basePrice, skillEffects);
  }

  const discountPercent = skillEffects.shop_discount_percent || 0;

  async function buyItem(item: ShopItem) {
    if (!userId || !stats) return;
    const gold = stats.gold || 0;
    const finalPrice = getDiscountedPrice(item.price);
    const itemName = getItemName(item);

    if (gold < finalPrice) {
      toast.error(t.shop.needGold(finalPrice, gold));
      return;
    }

    const levelInfo = getLevelInfo(stats.total_xp_earned, stats.total_xp_lost);
    if (levelInfo.level < item.min_level) {
      toast.error(t.shop.needLevel(item.min_level));
      return;
    }

    const supabase = createClient();
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });

    const newGold = gold - finalPrice;
    const newSpent = (stats.total_gold_spent || 0) + finalPrice;
    await supabase
      .from('stats')
      .update({
        gold: newGold,
        total_gold_spent: newSpent,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    const desc =
      finalPrice < item.price
        ? `Purchase: ${item.item_key} (${discountPercent}% off: ${item.price}→${finalPrice})`
        : `Purchase: ${item.item_key}`;
    await supabase.from('gold_events').insert({
      user_id: userId,
      amount: -finalPrice,
      event_type: 'shop_purchase',
      description: desc,
      event_date: today,
    });

    const existing = inventory.find((i) => i.item_key === item.item_key);
    if (existing) {
      await supabase
        .from('inventory')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id);
      setInventory((prev) =>
        prev.map((i) =>
          i.item_key === item.item_key ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      const { data: newInv } = await supabase
        .from('inventory')
        .insert({ user_id: userId, item_key: item.item_key, quantity: 1 })
        .select()
        .single();
      if (newInv) setInventory((prev) => [...prev, newInv]);
    }

    setStats({ ...stats, gold: newGold, total_gold_spent: newSpent });

    const savedText =
      finalPrice < item.price ? ` (${t.shop.saved(item.price - finalPrice)})` : '';
    toast.success(`${t.shop.bought(item.icon, itemName)}${savedText}`);
  }

  async function useItem(invItem: InventoryItem) {
    if (!userId || !stats) return;
    const item = items.find((i) => i.item_key === invItem.item_key);
    if (!item) return;

    const itemName = getItemName(item);
    const supabase = createClient();
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });

    if (item.effect_type === 'instant_xp') {
      const xp = item.effect_value;
      const newTotalEarned = stats.total_xp_earned + xp;
      const levelInfo = getLevelInfo(newTotalEarned, stats.total_xp_lost);
      await supabase
        .from('stats')
        .update({
          level: levelInfo.level,
          current_xp: levelInfo.currentXP,
          total_xp_earned: newTotalEarned,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      await supabase.from('xp_events').insert({
        user_id: userId,
        event_type: 'perk_bonus',
        xp_amount: xp,
        description: `Scroll: ${item.item_key}`,
        event_date: today,
      });
      setStats({
        ...stats,
        total_xp_earned: newTotalEarned,
        level: levelInfo.level,
        current_xp: levelInfo.currentXP,
      });
      toast.success(`+${xp} XP! ${item.icon}`);
    } else if (item.effect_type === 'instant_gold') {
      const goldAmount = item.effect_value;
      const newGold = (stats.gold || 0) + goldAmount;
      await supabase
        .from('stats')
        .update({
          gold: newGold,
          total_gold_earned: (stats.total_gold_earned || 0) + goldAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      await supabase.from('gold_events').insert({
        user_id: userId,
        amount: goldAmount,
        event_type: 'manual',
        description: `Scroll: ${item.item_key}`,
        event_date: today,
      });
      setStats({
        ...stats,
        gold: newGold,
        total_gold_earned: (stats.total_gold_earned || 0) + goldAmount,
      });
      toast.success(`+${goldAmount} 🪙! ${item.icon}`);
    } else if (item.effect_type === 'random_gold') {
      const goldAmount = Math.floor(Math.random() * 451) + 50;
      const newGold = (stats.gold || 0) + goldAmount;
      await supabase
        .from('stats')
        .update({
          gold: newGold,
          total_gold_earned: (stats.total_gold_earned || 0) + goldAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      await supabase.from('gold_events').insert({
        user_id: userId,
        amount: goldAmount,
        event_type: 'manual',
        description: `Lucky scroll: ${goldAmount} Gold`,
        event_date: today,
      });
      setStats({ ...stats, gold: newGold });
      toast.success(t.shop.luckyScroll(goldAmount));
    } else if (item.effect_type === 'reset_misses') {
      await supabase.from('profiles').update({ consecutive_misses: 0 }).eq('id', userId);
      toast.success(t.shop.missesReset);
    } else if (item.duration_hours) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + item.duration_hours);
      await supabase
        .from('inventory')
        .update({
          is_active: true,
          activated_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', invItem.id);
      setInventory((prev) =>
        prev.map((i) =>
          i.id === invItem.id
            ? {
                ...i,
                is_active: true,
                activated_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
              }
            : i,
        ),
      );
      toast.success(`${item.icon} ${itemName} ${t.shop.activatedFor(item.duration_hours)}`);
      return;
    } else if (item.category === 'artifact') {
      const newActive = !invItem.is_active;
      await supabase.from('inventory').update({ is_active: newActive }).eq('id', invItem.id);
      setInventory((prev) =>
        prev.map((i) => (i.id === invItem.id ? { ...i, is_active: newActive } : i)),
      );
      toast.success(
        newActive
          ? `${item.icon} ${t.shop.equipped}`
          : `${item.icon} ${t.shop.unequipped}`,
      );
      return;
    }

    if (invItem.quantity <= 1) {
      await supabase.from('inventory').delete().eq('id', invItem.id);
      setInventory((prev) => prev.filter((i) => i.id !== invItem.id));
    } else {
      await supabase
        .from('inventory')
        .update({ quantity: invItem.quantity - 1 })
        .eq('id', invItem.id);
      setInventory((prev) =>
        prev.map((i) =>
          i.id === invItem.id ? { ...i, quantity: i.quantity - 1 } : i,
        ),
      );
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          color: '#a78bfa',
        }}
      >
        {t.shop.loading}
      </div>
    );
  }

  const levelInfo = stats
    ? getLevelInfo(stats.total_xp_earned, stats.total_xp_lost)
    : { level: 1 };
  const gold = stats?.gold || 0;
  const filteredItems = filter === 'all' ? items : items.filter((i) => i.category === filter);

  function getCategoryColor(cat: string) {
    switch (cat) {
      case 'potion':
        return '#22c55e';
      case 'artifact':
        return '#3b82f6';
      case 'scroll':
        return '#f59e0b';
      default:
        return '#94a3b8';
    }
  }

  const filterOptions: Array<{
    value: 'all' | 'potion' | 'artifact' | 'scroll';
    label: string;
  }> = [
    { value: 'all', label: t.shop.categories.all },
    { value: 'potion', label: t.shop.categories.potion },
    { value: 'artifact', label: t.shop.categories.artifact },
    { value: 'scroll', label: t.shop.categories.scroll },
  ];

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>🏪 {t.shop.title}</h1>
          {discountPercent > 0 && (
            <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '2px' }}>
              {t.shop.discount(discountPercent)}
            </div>
          )}
        </div>
        <div
          style={{
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 700,
            backgroundColor: '#f59e0b20',
            color: '#f59e0b',
            border: '1px solid #f59e0b30',
          }}
        >
          🪙 {formatNumber(gold)}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          marginBottom: '16px',
          backgroundColor: '#16161f',
          borderRadius: '8px',
          padding: '4px',
        }}
      >
        <button
          onClick={() => setTab('shop')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            backgroundColor: tab === 'shop' ? '#7c3aed' : 'transparent',
            color: tab === 'shop' ? '#fff' : '#94a3b8',
          }}
        >
          {t.shop.shopTab}
        </button>
        <button
          onClick={() => setTab('inventory')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            backgroundColor: tab === 'inventory' ? '#7c3aed' : 'transparent',
            color: tab === 'inventory' ? '#fff' : '#94a3b8',
          }}
        >
          {t.shop.inventoryTab} ({inventory.reduce((s, i) => s + i.quantity, 0)})
        </button>
      </div>

      {tab === 'shop' ? (
        <>
          <div
            style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}
          >
            {filterOptions.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  backgroundColor: filter === f.value ? '#7c3aed20' : '#16161f',
                  border: `1px solid ${filter === f.value ? '#7c3aed' : '#1e1e2e'}`,
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredItems.map((item) => {
            const finalPrice = getDiscountedPrice(item.price);
            const hasDiscount = finalPrice < item.price;
            const canAfford = gold >= finalPrice;
            const levelOk = levelInfo.level >= item.min_level;
            const owned = inventory.find((i) => i.item_key === item.item_key);
            const itemName = getItemName(item);
            const itemDesc = getItemDesc(item);

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#12121a',
                  border: `1px solid ${getCategoryColor(item.category)}20`,
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '32px', flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '2px',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{itemName}</span>
                      {owned && (
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#7c3aed20',
                            color: '#a78bfa',
                          }}
                        >
                          x{owned.quantity}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                      {itemDesc}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: getCategoryColor(item.category) + '20',
                          color: getCategoryColor(item.category),
                        }}
                      >
                        {t.shop.categoryLabels[
                          item.category as keyof typeof t.shop.categoryLabels
                        ] || item.category}
                      </span>
                      {item.min_level > 1 && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: levelOk ? '#475569' : '#ef4444',
                          }}
                        >
                          LV.{item.min_level}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => buyItem(item)}
                    disabled={!canAfford || !levelOk}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: canAfford && levelOk ? '#f59e0b' : '#16161f',
                      color: canAfford && levelOk ? '#000' : '#475569',
                      cursor: canAfford && levelOk ? 'pointer' : 'not-allowed',
                      fontSize: '13px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    {hasDiscount && (
                      <span
                        style={{
                          fontSize: '10px',
                          textDecoration: 'line-through',
                          opacity: 0.6,
                        }}
                      >
                        🪙 {item.price}
                      </span>
                    )}
                    <span>🪙 {finalPrice}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <>
          {inventory.length === 0 ? (
            <div
              style={{
                backgroundColor: '#12121a',
                border: '1px solid #1e1e2e',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                color: '#475569',
              }}
            >
              {t.shop.emptyInventory}
            </div>
          ) : (
            inventory.map((invItem) => {
              const item = items.find((i) => i.item_key === invItem.item_key);
              if (!item) return null;
              const isExpired =
                invItem.expires_at && new Date(invItem.expires_at) < new Date();
              const itemName = getItemName(item);
              const itemDesc = getItemDesc(item);

              return (
                <div
                  key={invItem.id}
                  style={{
                    backgroundColor:
                      invItem.is_active && !isExpired ? '#12201a' : '#12121a',
                    border: `1px solid ${invItem.is_active && !isExpired ? '#22c55e30' : '#1e1e2e'}`,
                    borderRadius: '12px',
                    padding: '14px',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ fontSize: '28px' }}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>
                        {itemName}
                        {invItem.quantity > 1 && (
                          <span style={{ color: '#94a3b8' }}> x{invItem.quantity}</span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {itemDesc}
                      </div>
                      {invItem.is_active && !isExpired && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#22c55e',
                            marginTop: '4px',
                          }}
                        >
                          {t.shop.active}{' '}
                          {invItem.expires_at
                            ? `${t.shop.activeUntil} ${new Date(invItem.expires_at).toLocaleTimeString(locale === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`
                            : ''}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => useItem(invItem)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor:
                          item.category === 'artifact'
                            ? invItem.is_active
                              ? '#ef444420'
                              : '#22c55e'
                            : '#7c3aed',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {item.category === 'artifact'
                        ? invItem.is_active
                          ? t.shop.unequip
                          : t.shop.equip
                        : t.shop.use}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </>
      )}

      <div style={{ height: '32px' }} />
    </div>
  );
}