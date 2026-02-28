import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramMessage } from '@/lib/telegram';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const PRICE_STARS = 750;

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ═══════════════════════════════════════
// Telegram API helpers
// ═══════════════════════════════════════

async function sendMessage(chatId: number, text: string, keyboard?: object) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...(keyboard ? { reply_markup: keyboard } : {}),
    }),
  });
}

async function editMessage(chatId: number, messageId: number, text: string, keyboard?: object) {
  await fetch(`${API}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      ...(keyboard ? { reply_markup: keyboard } : {}),
    }),
  });
}

async function answerCallback(callbackId: string, text?: string) {
  await fetch(`${API}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackId,
      text,
    }),
  });
}

async function answerPreCheckoutQuery(queryId: string, ok: boolean, errorMessage?: string) {
  await fetch(`${API}/answerPreCheckoutQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pre_checkout_query_id: queryId,
      ok,
      ...(errorMessage ? { error_message: errorMessage } : {}),
    }),
  });
}

async function sendStarsInvoice(chatId: number, userId: string) {
  await fetch(`${API}/sendInvoice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      title: 'Solo Income System PRO',
      description: 'PRO подписка на 30 дней',
      payload: userId,
      currency: 'XTR',
      prices: [{ label: 'PRO 30 дней', amount: PRICE_STARS }],
    }),
  });
}

// ═══════════════════════════════════════
// Keyboards
// ═══════════════════════════════════════

function mainMenu(isPro: boolean) {
  return {
    inline_keyboard: [
      [
        { text: '📊 Статус', callback_data: 'status' },
        { text: '📈 Статистика', callback_data: 'stats_menu' },
      ],
      [
        { text: '⚔️ Квесты', callback_data: 'quests' },
        { text: '👹 Боссы', callback_data: 'bosses' },
      ],
      [
        { text: '🎯 Цели', callback_data: 'goals' },
        { text: '🔔 Уведомления', callback_data: 'notify_menu' },
      ],
      [
        isPro
          ? { text: '👑 PRO активен', callback_data: 'pro_info' }
          : { text: '⭐ Купить PRO', callback_data: 'buy_pro' },
      ],
    ],
  };
}

function backToMain() {
  return {
    inline_keyboard: [[{ text: '« Назад', callback_data: 'main' }]],
  };
}

function statsMenu() {
  return {
    inline_keyboard: [
      [
        { text: '📅 За неделю', callback_data: 'stats_week' },
        { text: '📆 За месяц', callback_data: 'stats_month' },
      ],
      [{ text: '« Назад', callback_data: 'main' }],
    ],
  };
}

function notifyMenu(hours: number[], enabled: boolean) {
  const toggleText = enabled ? '🔕 Выключить' : '🔔 Включить';
  return {
    inline_keyboard: [
      [{ text: toggleText, callback_data: enabled ? 'notify_off' : 'notify_on' }],
      [
        { text: '🌅 Утро (10)', callback_data: 'notify_toggle_10' },
        { text: '☀️ День (14)', callback_data: 'notify_toggle_14' },
      ],
      [
        { text: '🌆 Вечер (18)', callback_data: 'notify_toggle_18' },
        { text: '🌙 Ночь (21)', callback_data: 'notify_toggle_21' },
      ],
      [{ text: '« Назад', callback_data: 'main' }],
    ],
  };
}

function goalsMenu() {
  return {
    inline_keyboard: [
      [
        { text: '📋 10 действий', callback_data: 'goal_daily_10' },
        { text: '📋 20 действий', callback_data: 'goal_daily_20' },
      ],
      [
        { text: '📋 30 действий', callback_data: 'goal_daily_30' },
        { text: '📋 50 действий', callback_data: 'goal_daily_50' },
      ],
      [{ text: '« Назад', callback_data: 'main' }],
    ],
  };
}

// ═══════════════════════════════════════
// Data helpers
// ═══════════════════════════════════════

async function getUserId(chatId: number): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('telegram_links')
    .select('user_id')
    .eq('chat_id', chatId)
    .maybeSingle();
  return data?.user_id || null;
}

function getTodayForTz(tz: string): string {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: tz });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function getDateDaysAgo(days: number, tz: string): string {
  try {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
    d.setDate(d.getDate() - days);
    return d.toLocaleDateString('en-CA');
  } catch {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toLocaleDateString('en-CA');
  }
}

// ═══════════════════════════════════════
// Handlers
// ═══════════════════════════════════════

async function handleStatus(chatId: number, userId: string, messageId?: number) {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, streak_current, daily_actions_target, is_pro, pro_until, timezone')
    .eq('id', userId)
    .single();

  const { data: stats } = await supabase
    .from('stats')
    .select('level, current_xp, gold')
    .eq('user_id', userId)
    .single();

  const tz = profile?.timezone || 'Europe/Berlin';
  const today = getTodayForTz(tz);

  const { data: completions } = await supabase
    .from('completions')
    .select('count_done')
    .eq('user_id', userId)
    .eq('completion_date', today);

  const todayActions = completions?.reduce((s: number, c: { count_done: number }) => s + c.count_done, 0) ?? 0;
  const target = profile?.daily_actions_target || 30;
  const percent = Math.round((todayActions / target) * 100);

  const proLine = profile?.is_pro
    ? `\n👑 PRO до: ${profile.pro_until ? new Date(profile.pro_until).toLocaleDateString('ru-RU') : '∞'}`
    : '';

  const progressBar = getProgressBar(percent);

  const text =
    `⚔️ <b>${profile?.display_name || 'Охотник'}</b>\n\n`
    + `📊 Уровень: ${stats?.level || 1} | ⚡ XP: ${stats?.current_xp || 0}\n`
    + `🪙 Золото: ${stats?.gold || 0}\n`
    + `🔥 Серия: ${profile?.streak_current || 0} дней${proLine}\n\n`
    + `📋 Сегодня: ${todayActions}/${target}\n`
    + `${progressBar} ${percent}%\n`
    + (percent >= 100 ? '\n✅ План выполнен! 🎉' : `\n⏳ Осталось ${target - todayActions} действий`)
    + `\n\n🕐 ${new Date().toLocaleTimeString('ru-RU', { timeZone: tz, hour: '2-digit', minute: '2-digit' })}`;

  if (messageId) {
    await editMessage(chatId, messageId, text, backToMain());
  } else {
    await sendMessage(chatId, text, mainMenu(!!profile?.is_pro));
  }
}

function getProgressBar(percent: number): string {
  const filled = Math.min(Math.round(percent / 10), 10);
  const empty = 10 - filled;
  return '▓'.repeat(filled) + '░'.repeat(empty);
}

async function handleStatsRange(chatId: number, messageId: number, userId: string, days: number) {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .single();

  const tz = profile?.timezone || 'Europe/Berlin';
  const fromDate = getDateDaysAgo(days, tz);
  const label = days === 7 ? 'за неделю' : 'за месяц';

  const { data: completions } = await supabase
    .from('completions')
    .select('count_done')
    .eq('user_id', userId)
    .gte('completion_date', fromDate);

  const totalActions = completions?.reduce((s: number, c: { count_done: number }) => s + c.count_done, 0) ?? 0;

  const { data: incomes } = await supabase
    .from('income_events')
    .select('amount')
    .eq('user_id', userId)
    .gte('event_date', fromDate);

  const totalIncome = incomes?.reduce((s: number, i: { amount: number }) => s + Number(i.amount), 0) ?? 0;

  const { data: xpEvents } = await supabase
    .from('xp_events')
    .select('xp_amount')
    .eq('user_id', userId)
    .gte('event_date', fromDate);

  const totalXP = xpEvents?.reduce((s: number, e: { xp_amount: number }) => s + e.xp_amount, 0) ?? 0;

  const { data: summaries } = await supabase
    .from('daily_summary')
    .select('completed')
    .eq('user_id', userId)
    .gte('summary_date', fromDate);

  const completedDays = summaries?.filter((s: { completed: boolean }) => s.completed).length ?? 0;

  const text =
    `📈 <b>Статистика ${label}</b>\n\n`
    + `📋 Действий: ${totalActions}\n`
    + `✅ Дней с выполненным планом: ${completedDays}/${days}\n`
    + `⚡ XP заработано: ${totalXP > 0 ? '+' : ''}${totalXP}\n`
    + `💰 Доход: ${totalIncome.toLocaleString()} ₽`;

  await editMessage(chatId, messageId, text, backToMain());
}

async function handleQuests(chatId: number, messageId: number, userId: string) {
  const supabase = createAdminClient();

  const { data: quests } = await supabase
    .from('quests')
    .select('title, quest_type, target_count, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(10);

  if (!quests || quests.length === 0) {
    await editMessage(chatId, messageId, '📭 Нет активных квестов.\n\nСоздай квесты в приложении!', backToMain());
    return;
  }

  const lines = quests.map((q: { title: string; quest_type: string; target_count: number }, i: number) => {
    const icon = q.quest_type === 'daily' ? '📅' : q.quest_type === 'weekly' ? '📆' : '⭐';
    return `${i + 1}. ${icon} <b>${q.title}</b> (${q.target_count} действий)`;
  });

  const text = `⚔️ <b>Активные квесты</b> (${quests.length})\n\n${lines.join('\n')}`;
  await editMessage(chatId, messageId, text, backToMain());
}

async function handleBosses(chatId: number, messageId: number, userId: string) {
  const supabase = createAdminClient();

  const { data: bosses } = await supabase
    .from('bosses')
    .select('title, boss_type, deadline, is_defeated, xp_reward')
    .eq('user_id', userId)
    .eq('is_defeated', false)
    .limit(10);

  if (!bosses || bosses.length === 0) {
    await editMessage(chatId, messageId, '🏆 Все боссы побеждены!\n\nСоздай нового босса в приложении.', backToMain());
    return;
  }

  const lines = bosses.map((b: { title: string; boss_type: string; deadline: string | null; xp_reward: number }, i: number) => {
    const deadlineStr = b.deadline ? ` (до ${new Date(b.deadline).toLocaleDateString('ru-RU')})` : '';
    const urgent = b.deadline && new Date(b.deadline) <= new Date(Date.now() + 86400000 * 2) ? '🔴' : '👹';
    return `${i + 1}. ${urgent} <b>${b.title}</b>${deadlineStr}\n   💎 Награда: ${b.xp_reward} XP`;
  });

  const text = `👹 <b>Активные боссы</b> (${bosses.length})\n\n${lines.join('\n\n')}`;
  await editMessage(chatId, messageId, text, backToMain());
}

async function handleGoals(chatId: number, messageId: number, userId: string) {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('daily_actions_target, monthly_income_target')
    .eq('id', userId)
    .single();

  const text =
    `🎯 <b>Текущие цели</b>\n\n`
    + `📋 Дневной план: <b>${profile?.daily_actions_target || 30}</b> действий\n`
    + `💰 Цель дохода: <b>${(profile?.monthly_income_target || 150000).toLocaleString()}</b> ₽/мес\n\n`
    + `Выберите новый дневной план:`;

  await editMessage(chatId, messageId, text, goalsMenu());
}

async function handleSetDailyGoal(chatId: number, messageId: number, userId: string, target: number) {
  const supabase = createAdminClient();

  await supabase.from('profiles').update({
    daily_actions_target: target,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);

  const text = `✅ Дневной план обновлён: <b>${target}</b> действий`;
  await editMessage(chatId, messageId, text, backToMain());
}

async function handleNotifyMenu(chatId: number, messageId: number, userId: string) {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('notifications_enabled, notification_hours')
    .eq('id', userId)
    .single();

  const hours = profile?.notification_hours ?? [10, 18, 21];
  const enabled = profile?.notifications_enabled ?? true;

  const hourLabels = hours.sort((a: number, b: number) => a - b).map((h: number) => `${String(h).padStart(2, '0')}:00`).join(', ');

  const text =
    `🔔 <b>Уведомления</b>\n\n`
    + `Статус: ${enabled ? '✅ Включены' : '❌ Выключены'}\n`
    + `Часы: ${hourLabels || 'не выбраны'}\n\n`
    + `Нажмите на час чтобы добавить/убрать:`;

  await editMessage(chatId, messageId, text, notifyMenu(hours, enabled));
}

async function handleNotifyToggleHour(chatId: number, messageId: number, userId: string, hour: number) {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('notification_hours')
    .eq('id', userId)
    .single();

  let hours: number[] = profile?.notification_hours ?? [10, 18, 21];

  if (hours.includes(hour)) {
    hours = hours.filter((h: number) => h !== hour);
  } else {
    hours = [...hours, hour].sort((a, b) => a - b);
  }

  await supabase.from('profiles').update({
    notification_hours: hours,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);

  // Refresh menu
  await handleNotifyMenu(chatId, messageId, userId);
}

async function handleNotifyToggle(chatId: number, messageId: number, userId: string, enable: boolean) {
  const supabase = createAdminClient();

  await supabase.from('profiles').update({
    notifications_enabled: enable,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);

  await handleNotifyMenu(chatId, messageId, userId);
}

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    from?: { id: number; username?: string; first_name?: string };
    text?: string;
    successful_payment?: {
      currency: string;
      total_amount: number;
      invoice_payload: string;
      telegram_payment_charge_id: string;
      provider_payment_charge_id: string;
    };
  };
  callback_query?: {
    id: string;
    from: { id: number };
    message?: { message_id: number; chat: { id: number } };
    data?: string;
  };
  pre_checkout_query?: {
    id: string;
    from: { id: number };
    currency: string;
    total_amount: number;
    invoice_payload: string;
  };
}

// ═══════════════════════════════════════
// Main handler
// ═══════════════════════════════════════

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-telegram-bot-api-secret-token');
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await request.json();

    // ─── Pre-checkout (Stars) ───
    if (update.pre_checkout_query) {
      const query = update.pre_checkout_query;
      const userId = query.invoice_payload;
      if (!userId) {
        await answerPreCheckoutQuery(query.id, false, 'Аккаунт не найден');
        return NextResponse.json({ ok: true });
      }
      const supabase = createAdminClient();
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
      if (!profile) {
        await answerPreCheckoutQuery(query.id, false, 'Привяжи аккаунт: /start КОД');
        return NextResponse.json({ ok: true });
      }
      await answerPreCheckoutQuery(query.id, true);
      return NextResponse.json({ ok: true });
    }

    // ─── Successful payment (Stars) ───
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const chatId = update.message.chat.id;
      const userId = payment.invoice_payload;
      const supabase = createAdminClient();

      const { data: existing } = await supabase
        .from('payments').select('id')
        .eq('provider', 'stars').eq('invoice_id', payment.telegram_payment_charge_id)
        .maybeSingle();
      if (existing) return NextResponse.json({ ok: true });

      const days = 30;
      const proUntil = new Date();
      proUntil.setDate(proUntil.getDate() + days);

      const { error: updateErr } = await supabase.from('profiles').update({
        is_pro: true,
        pro_until: proUntil.toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', userId);

      await supabase.from('payments').insert({
        user_id: userId,
        telegram_user_id: update.message.from?.id,
        provider: 'stars',
        invoice_id: payment.telegram_payment_charge_id,
        amount: payment.total_amount,
        currency: 'XTR',
        days_granted: days,
        status: updateErr ? 'activation_failed' : 'completed',
        payload: payment as unknown as Record<string, unknown>,
      });

      if (!updateErr) {
        await sendMessage(chatId,
          '🎉 <b>PRO активирован!</b>\n\n'
          + `⏱ Срок: ${days} дней\n`
          + `📅 До: ${proUntil.toLocaleDateString('ru-RU')}\n\n`
          + '🚀 Все PRO-функции доступны!',
          mainMenu(true),
        );
      }
      return NextResponse.json({ ok: true });
    }

    // ─── Callback queries (inline buttons) ───
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat.id;
      const messageId = cb.message?.message_id;
      const data = cb.data || '';

      if (!chatId || !messageId) {
        await answerCallback(cb.id);
        return NextResponse.json({ ok: true });
      }

      const userId = await getUserId(chatId);
      if (!userId) {
        await answerCallback(cb.id, 'Аккаунт не привязан! /start КОД');
        return NextResponse.json({ ok: true });
      }

      await answerCallback(cb.id);

      if (data === 'main') {
        const supabase = createAdminClient();
        const { data: prof } = await supabase.from('profiles').select('is_pro').eq('id', userId).single();
        await editMessage(chatId, messageId,
          '⚔️ <b>Solo Income System</b>\n\nВыбери действие 👇',
          mainMenu(!!prof?.is_pro),
        );
      } else if (data === 'status') {
        await handleStatus(chatId, userId, messageId);
        await handleStatus(chatId, userId, messageId);
      } else if (data === 'stats_menu') {
        await editMessage(chatId, messageId, '📈 <b>Статистика</b>\n\nВыберите период:', statsMenu());
      } else if (data === 'stats_week') {
        await handleStatsRange(chatId, messageId, userId, 7);
      } else if (data === 'stats_month') {
        await handleStatsRange(chatId, messageId, userId, 30);
      } else if (data === 'quests') {
        await handleQuests(chatId, messageId, userId);
      } else if (data === 'bosses') {
        await handleBosses(chatId, messageId, userId);
      } else if (data === 'goals') {
        await handleGoals(chatId, messageId, userId);
      } else if (data.startsWith('goal_daily_')) {
        const target = parseInt(data.replace('goal_daily_', ''));
        await handleSetDailyGoal(chatId, messageId, userId, target);
      } else if (data === 'notify_menu') {
        await handleNotifyMenu(chatId, messageId, userId);
      } else if (data.startsWith('notify_toggle_')) {
        const hour = parseInt(data.replace('notify_toggle_', ''));
        await handleNotifyToggleHour(chatId, messageId, userId, hour);
      } else if (data === 'notify_on') {
        await handleNotifyToggle(chatId, messageId, userId, true);
      } else if (data === 'notify_off') {
        await handleNotifyToggle(chatId, messageId, userId, false);
      } else if (data === 'buy_pro') {
        const supabase = createAdminClient();
        const { data: profile } = await supabase.from('profiles').select('is_pro, pro_until').eq('id', userId).single();
        if (profile?.is_pro && profile.pro_until && new Date(profile.pro_until) > new Date()) {
          await editMessage(chatId, messageId,
            `👑 <b>У тебя уже PRO!</b>\n\nДо: ${new Date(profile.pro_until).toLocaleDateString('ru-RU')}`,
            backToMain(),
          );
        } else {
          await sendStarsInvoice(chatId, userId);
        }
      } else if (data === 'pro_info') {
        const supabase = createAdminClient();
        const { data: profile } = await supabase.from('profiles').select('pro_until').eq('id', userId).single();
        await editMessage(chatId, messageId,
          `👑 <b>PRO подписка</b>\n\n`
          + `📅 До: ${profile?.pro_until ? new Date(profile.pro_until).toLocaleDateString('ru-RU') : '∞'}\n\n`
          + '✅ Безлимитные навыки, квесты, боссы\n'
          + '✅ Полная аналитика 365 дней\n'
          + '✅ AI советник без лимитов\n'
          + '✅ XP и Gold x1.5',
          backToMain(),
        );
      }

      return NextResponse.json({ ok: true });
    }

    // ─── Text commands ───
    const message = update.message;
    if (!message?.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text.trim();
    const username = message.from?.username || message.from?.first_name || '';

    // /start TOKEN
    if (text.startsWith('/start ')) {
      const token = text.replace('/start ', '').trim().toUpperCase();
      if (!token || token.length < 4) {
        await sendMessage(chatId, '❌ Неверный код. Получи код в настройках приложения.');
        return NextResponse.json({ ok: true });
      }

      const supabase = createAdminClient();
      const { data: tokenRow } = await supabase
        .from('telegram_link_tokens')
        .select('*')
        .eq('token', token).eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (!tokenRow) {
        await sendMessage(chatId, '❌ Код не найден или истёк.');
        return NextResponse.json({ ok: true });
      }

      await supabase.from('telegram_link_tokens').update({ used: true }).eq('token', token);
      await supabase.from('telegram_links').delete().eq('user_id', tokenRow.user_id);
      await supabase.from('telegram_links').insert({
        user_id: tokenRow.user_id,
        chat_id: chatId,
        username,
        is_active: true,
      });

      await sendMessage(chatId,
        '✅ <b>Solo Income System подключён!</b>\n\n'
        + '🔔 Уведомления: 10:00, 18:00, 21:00\n'
        + '(можно настроить кнопкой ниже)\n\n'
        + 'Нажми кнопку для управления 👇',
      );

      // Show main menu
      await handleStatus(chatId, tokenRow.user_id);
      return NextResponse.json({ ok: true });
    }

    // /start
    if (text === '/start') {
      const userId = await getUserId(chatId);
      if (userId) {
        await handleStatus(chatId, userId);
      } else {
        await sendMessage(chatId,
          '⚔️ <b>Solo Income System</b>\n\n'
          + 'Чтобы подключить:\n'
          + '1. Открой solo-income-system.vercel.app\n'
          + '2. Настройки → Telegram → Получить код\n'
          + '3. Отправь: /start КОД',
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Text commands → show main menu
    const userId = await getUserId(chatId);
    if (!userId) {
      await sendMessage(chatId, '❌ Аккаунт не привязан. Используй /start КОД');
      return NextResponse.json({ ok: true });
    }

    if (text === '/menu') {
      const supabase = createAdminClient();
      const { data: prof } = await supabase.from('profiles').select('is_pro').eq('id', userId).single();
      await sendMessage(chatId, '⚔️ <b>Solo Income System</b>\n\nВыбери действие 👇', mainMenu(!!prof?.is_pro));
    } else if (text === '/status') {
      await handleStatus(chatId, userId);
    } else if (text === '/pro') {
      const supabase = createAdminClient();
      const { data: profile } = await supabase.from('profiles').select('is_pro, pro_until').eq('id', userId).single();
      if (profile?.is_pro && profile.pro_until && new Date(profile.pro_until) > new Date()) {
        await sendMessage(chatId, `👑 PRO до: ${new Date(profile.pro_until).toLocaleDateString('ru-RU')}`, mainMenu(true));
      } else {
        await sendStarsInvoice(chatId, userId);
      }
    } else if (text === '/help') {
      await sendMessage(chatId,
        '📖 <b>Команды:</b>\n\n'
        + '/menu — главное меню с кнопками\n'
        + '/status — текущий прогресс\n'
        + '/pro — купить PRO ⭐\n'
        + '/help — эта справка\n\n'
        + '💡 Используй кнопки для удобного управления!',
        mainMenu(false),
      );
    } else if (text === '/on') {
      const supabase = createAdminClient();
      await supabase.from('telegram_links').update({ is_active: true }).eq('chat_id', chatId);
      await sendMessage(chatId, '🔔 Уведомления включены!', mainMenu(false));
    } else if (text === '/off') {
      const supabase = createAdminClient();
      await supabase.from('telegram_links').update({ is_active: false }).eq('chat_id', chatId);
      await sendMessage(chatId, '🔕 Уведомления выключены.', mainMenu(false));
    } else {
      await handleStatus(chatId, userId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ ok: true });
  }
}