import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const PRICE_STARS = 750;
const APP_URL = 'https://solo-income-system.vercel.app';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ═══════════════════════════════════════
// i18n
// ═══════════════════════════════════════

type Lang = 'ru' | 'en';

const T = {
  ru: {
    status_title: (name: string) => `⚔️ <b>${name}</b>`,
    level: 'Уровень',
    xp: 'XP',
    gold: 'Золото',
    streak: 'Серия',
    days: 'дней',
    pro_until: 'PRO до',
    today: 'Сегодня',
    plan_done: '✅ План выполнен! 🎉',
    remaining: (n: number) => `⏳ Осталось ${n} действий`,
    time: '🕐',
    menu_title: '⚔️ <b>Solo Income System</b>\n\nВыбери действие 👇',
    btn_status: '📊 Статус',
    btn_stats: '📈 Статистика',
    btn_quests: '⚔️ Квесты',
    btn_bosses: '👹 Боссы',
    btn_goals: '🎯 Цели',
    btn_notify: '🔔 Уведомления',
    btn_pro_active: '👑 PRO активен',
    btn_buy_pro: '⭐ Купить PRO',
    btn_back: '« Назад в меню',
    btn_app: '🌐 Открыть приложение',
    btn_week: '📅 За неделю',
    btn_month: '📆 За месяц',
    stats_title: '📈 <b>Статистика</b>\n\nВыберите период:',
    stats_range: (label: string) => `📈 <b>Статистика ${label}</b>`,
    stats_week: 'за неделю',
    stats_month: 'за месяц',
    stats_actions: 'Действий',
    stats_completed_days: 'Дней с планом',
    stats_xp: 'XP заработано',
    stats_income: 'Доход',
    no_quests: '📭 Нет активных квестов.\n\nСоздай квесты в приложении!',
    quests_title: (n: number) => `⚔️ <b>Активные квесты</b> (${n})`,
    quest_actions: 'действий',
    all_bosses_done: '🏆 Все боссы побеждены!\n\nСоздай нового босса в приложении.',
    bosses_title: (n: number) => `👹 <b>Активные боссы</b> (${n})`,
    boss_reward: 'Награда',
    boss_until: 'до',
    goals_title: '🎯 <b>Текущие цели</b>',
    goals_daily: 'Дневной план',
    goals_income: 'Цель дохода',
    goals_pick: 'Выберите новый дневной план:',
    goals_actions: 'действий',
    goal_updated: (n: number) => `✅ Дневной план: <b>${n}</b> действий`,
    notify_title: '🔔 <b>Уведомления</b>',
    notify_status: 'Статус',
    notify_on: '✅ Включены',
    notify_off_label: '❌ Выключены',
    notify_hours_label: 'Часы',
    notify_none: 'не выбраны',
    notify_pick: 'Нажмите на час чтобы добавить/убрать:',
    btn_notify_off: '🔕 Выключить',
    btn_notify_on: '🔔 Включить',
    notify_enabled: '🔔 Уведомления включены!',
    notify_disabled: '🔕 Уведомления выключены.',
    pro_already: (date: string) => `👑 <b>У тебя уже PRO!</b>\n\nДо: ${date}`,
    pro_info_title: '👑 <b>PRO подписка</b>',
    pro_info_until: 'До',
    pro_features: '✅ Безлимитные навыки, квесты, боссы\n✅ Полная аналитика 365 дней\n✅ AI советник без лимитов\n✅ XP и Gold x1.5',
    pro_activated: '🎉 <b>PRO активирован!</b>',
    pro_duration: 'Срок',
    pro_until_date: 'До',
    pro_ready: '🚀 Все PRO-функции доступны!',
    pro_error: '❌ Ошибка активации. Напишите в поддержку.',
    link_success: '✅ <b>Solo Income System подключён!</b>\n\n🔔 Уведомления: 10:00, 18:00, 21:00\n(можно настроить кнопкой ниже)',
    link_bad_code: '❌ Неверный код. Получи код в настройках приложения.',
    link_not_found: '❌ Код не найден или истёк.',
    link_required: '❌ Аккаунт не привязан. Используй /start КОД',
    start_msg: '⚔️ <b>Solo Income System</b>\n\n1. Открой solo-income-system.vercel.app\n2. Настройки → Telegram → Получить код\n3. Отправь: /start КОД',
    help_msg: '📖 <b>Команды:</b>\n\n/menu — главное меню\n/status — прогресс\n/pro — купить PRO ⭐\n/help — справка\n\n💡 Используй кнопки!',
    morning: (name: string, streak: number, motiv: string) => streak > 0 ? `${name}, начни день! Серия: ${streak} 🔥\n${motiv}` : `${name}, начни новую серию!\n${motiv}`,
    morning_title: '🌅 Утренний квест',
    evening_done: (name: string, done: number, target: number, motiv: string) => `${name}, ты выполнил ${done}/${target} действий. Молодец! ${motiv}`,
    evening_done_title: '✅ План выполнен!',
    evening_status: (name: string, done: number, target: number, pct: number, left: number) => `${name}, ${done}/${target} (${pct}%). Осталось ${left} действий!`,
    evening_status_title: '⚡ Дневной статус',
    night: (name: string, left: number, streak: number) => `${name}, осталось ${left} действий! Не потеряй серию ${streak} 🔥`,
    night_title: '🌙 Последний шанс',
  },
  en: {
    status_title: (name: string) => `⚔️ <b>${name}</b>`,
    level: 'Level',
    xp: 'XP',
    gold: 'Gold',
    streak: 'Streak',
    days: 'days',
    pro_until: 'PRO until',
    today: 'Today',
    plan_done: '✅ Plan completed! 🎉',
    remaining: (n: number) => `⏳ ${n} actions left`,
    time: '🕐',
    menu_title: '⚔️ <b>Solo Income System</b>\n\nChoose action 👇',
    btn_status: '📊 Status',
    btn_stats: '📈 Statistics',
    btn_quests: '⚔️ Quests',
    btn_bosses: '👹 Bosses',
    btn_goals: '🎯 Goals',
    btn_notify: '🔔 Notifications',
    btn_pro_active: '👑 PRO active',
    btn_buy_pro: '⭐ Buy PRO',
    btn_back: '« Back to menu',
    btn_app: '🌐 Open app',
    btn_week: '📅 Week',
    btn_month: '📆 Month',
    stats_title: '📈 <b>Statistics</b>\n\nChoose period:',
    stats_range: (label: string) => `📈 <b>Statistics ${label}</b>`,
    stats_week: 'this week',
    stats_month: 'this month',
    stats_actions: 'Actions',
    stats_completed_days: 'Days with plan done',
    stats_xp: 'XP earned',
    stats_income: 'Income',
    no_quests: '📭 No active quests.\n\nCreate quests in the app!',
    quests_title: (n: number) => `⚔️ <b>Active quests</b> (${n})`,
    quest_actions: 'actions',
    all_bosses_done: '🏆 All bosses defeated!\n\nCreate a new boss in the app.',
    bosses_title: (n: number) => `👹 <b>Active bosses</b> (${n})`,
    boss_reward: 'Reward',
    boss_until: 'until',
    goals_title: '🎯 <b>Current goals</b>',
    goals_daily: 'Daily plan',
    goals_income: 'Income goal',
    goals_pick: 'Choose new daily plan:',
    goals_actions: 'actions',
    goal_updated: (n: number) => `✅ Daily plan: <b>${n}</b> actions`,
    notify_title: '🔔 <b>Notifications</b>',
    notify_status: 'Status',
    notify_on: '✅ Enabled',
    notify_off_label: '❌ Disabled',
    notify_hours_label: 'Hours',
    notify_none: 'none',
    notify_pick: 'Tap hour to toggle:',
    btn_notify_off: '🔕 Turn off',
    btn_notify_on: '🔔 Turn on',
    notify_enabled: '🔔 Notifications enabled!',
    notify_disabled: '🔕 Notifications disabled.',
    pro_already: (date: string) => `👑 <b>You already have PRO!</b>\n\nUntil: ${date}`,
    pro_info_title: '👑 <b>PRO subscription</b>',
    pro_info_until: 'Until',
    pro_features: '✅ Unlimited skills, quests, bosses\n✅ Full analytics 365 days\n✅ AI advisor unlimited\n✅ XP and Gold x1.5',
    pro_activated: '🎉 <b>PRO activated!</b>',
    pro_duration: 'Duration',
    pro_until_date: 'Until',
    pro_ready: '🚀 All PRO features unlocked!',
    pro_error: '❌ Activation error. Contact support.',
    link_success: '✅ <b>Solo Income System connected!</b>\n\n🔔 Notifications: 10:00, 18:00, 21:00\n(customizable below)',
    link_bad_code: '❌ Invalid code. Get it in app settings.',
    link_not_found: '❌ Code not found or expired.',
    link_required: '❌ Account not linked. Use /start CODE',
    start_msg: '⚔️ <b>Solo Income System</b>\n\n1. Open solo-income-system.vercel.app\n2. Settings → Telegram → Get code\n3. Send: /start CODE',
    help_msg: '📖 <b>Commands:</b>\n\n/menu — main menu\n/status — progress\n/pro — buy PRO ⭐\n/help — help\n\n💡 Use buttons!',
    morning: (name: string, streak: number, motiv: string) => streak > 0 ? `${name}, start your day! Streak: ${streak} 🔥\n${motiv}` : `${name}, start a new streak!\n${motiv}`,
    morning_title: '🌅 Morning quest',
    evening_done: (name: string, done: number, target: number, motiv: string) => `${name}, you did ${done}/${target} actions. Great! ${motiv}`,
    evening_done_title: '✅ Plan completed!',
    evening_status: (name: string, done: number, target: number, pct: number, left: number) => `${name}, ${done}/${target} (${pct}%). ${left} actions left!`,
    evening_status_title: '⚡ Daily status',
    night: (name: string, left: number, streak: number) => `${name}, ${left} actions left! Don't lose streak ${streak} 🔥`,
    night_title: '🌙 Last chance',
  },
};

const MOTIV_RU = [
  '💪 Каждое действие приближает к цели!',
  '🔥 Ты сильнее, чем думаешь!',
  '⚡ Маленькие шаги — большие результаты.',
  '🎯 Фокус на действиях!',
  '🚀 Дисциплина побеждает мотивацию.',
  '💎 Инвестируй в себя!',
  '🏆 Ты — победитель.',
  '⭐ Лучший день для прогресса.',
];

const MOTIV_EN = [
  '💪 Every action counts!',
  '🔥 You\'re stronger than you think!',
  '⚡ Small steps, big results.',
  '🎯 Focus on actions!',
  '🚀 Discipline beats motivation.',
  '💎 Invest in yourself!',
  '🏆 You\'re a winner.',
  '⭐ Best day for progress.',
];

function getMotiv(lang: Lang): string {
  const arr = lang === 'ru' ? MOTIV_RU : MOTIV_EN;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ═══════════════════════════════════════
// Telegram API helpers
// ═══════════════════════════════════════

async function sendMessage(chatId: number, text: string, keyboard?: object) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId, text, parse_mode: 'HTML',
      ...(keyboard ? { reply_markup: keyboard } : {}),
    }),
  });
}

async function editMessage(chatId: number, messageId: number, text: string, keyboard?: object) {
  await fetch(`${API}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML',
      ...(keyboard ? { reply_markup: keyboard } : {}),
    }),
  });
}

async function answerCallback(callbackId: string, text?: string) {
  await fetch(`${API}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackId, text }),
  });
}

async function answerPreCheckoutQuery(queryId: string, ok: boolean, errorMessage?: string) {
  await fetch(`${API}/answerPreCheckoutQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pre_checkout_query_id: queryId, ok, ...(errorMessage ? { error_message: errorMessage } : {}) }),
  });
}

async function sendStarsInvoice(chatId: number, userId: string) {
  await fetch(`${API}/sendInvoice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId, title: 'Solo Income System PRO',
      description: 'PRO — 30 days', payload: userId,
      currency: 'XTR', prices: [{ label: 'PRO 30 days', amount: PRICE_STARS }],
    }),
  });
}

// ═══════════════════════════════════════
// Keyboards
// ═══════════════════════════════════════

function mainMenu(isPro: boolean, t: typeof T.ru) {
  return {
    inline_keyboard: [
      [{ text: t.btn_status, callback_data: 'status' }, { text: t.btn_stats, callback_data: 'stats_menu' }],
      [{ text: t.btn_quests, callback_data: 'quests' }, { text: t.btn_bosses, callback_data: 'bosses' }],
      [{ text: t.btn_goals, callback_data: 'goals' }, { text: t.btn_notify, callback_data: 'notify_menu' }],
      [isPro ? { text: t.btn_pro_active, callback_data: 'pro_info' } : { text: t.btn_buy_pro, callback_data: 'buy_pro' }],
      [{ text: t.btn_app, url: APP_URL }],
    ],
  };
}

function backBtn(t: typeof T.ru) {
  return { inline_keyboard: [[{ text: t.btn_back, callback_data: 'main' }]] };
}

function statsMenu(t: typeof T.ru) {
  return {
    inline_keyboard: [
      [{ text: t.btn_week, callback_data: 'stats_week' }, { text: t.btn_month, callback_data: 'stats_month' }],
      [{ text: t.btn_back, callback_data: 'main' }],
    ],
  };
}

function notifyMenuKb(hours: number[], enabled: boolean, t: typeof T.ru) {
  return {
    inline_keyboard: [
      [{ text: enabled ? t.btn_notify_off : t.btn_notify_on, callback_data: enabled ? 'notify_off' : 'notify_on' }],
      [{ text: `🌅 10 ${hours.includes(10) ? '✓' : ''}`, callback_data: 'notify_toggle_10' }, { text: `☀️ 14 ${hours.includes(14) ? '✓' : ''}`, callback_data: 'notify_toggle_14' }],
      [{ text: `🌆 18 ${hours.includes(18) ? '✓' : ''}`, callback_data: 'notify_toggle_18' }, { text: `🌙 21 ${hours.includes(21) ? '✓' : ''}`, callback_data: 'notify_toggle_21' }],
      [{ text: t.btn_back, callback_data: 'main' }],
    ],
  };
}

function goalsMenuKb(t: typeof T.ru) {
  return {
    inline_keyboard: [
      [{ text: `📋 10 ${t.goals_actions}`, callback_data: 'goal_daily_10' }, { text: `📋 20 ${t.goals_actions}`, callback_data: 'goal_daily_20' }],
      [{ text: `📋 30 ${t.goals_actions}`, callback_data: 'goal_daily_30' }, { text: `📋 50 ${t.goals_actions}`, callback_data: 'goal_daily_50' }],
      [{ text: t.btn_back, callback_data: 'main' }],
    ],
  };
}

// ═══════════════════════════════════════
// Data helpers
// ═══════════════════════════════════════

async function getUserData(chatId: number): Promise<{ userId: string; lang: Lang } | null> {
  const supabase = createAdminClient();
  const { data: link } = await supabase.from('telegram_links').select('user_id').eq('chat_id', chatId).maybeSingle();
  if (!link) return null;
  const { data: profile } = await supabase.from('profiles').select('locale').eq('id', link.user_id).single();
  const lang: Lang = profile?.locale === 'ru' ? 'ru' : 'en';
  return { userId: link.user_id, lang };
}

function getTodayForTz(tz: string): string {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: tz }); }
  catch { return new Date().toISOString().slice(0, 10); }
}

function getDateDaysAgo(days: number, tz: string): string {
  try {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
    d.setDate(d.getDate() - days);
    return d.toLocaleDateString('en-CA');
  } catch {
    const d = new Date(); d.setDate(d.getDate() - days);
    return d.toLocaleDateString('en-CA');
  }
}

function progressBar(percent: number): string {
  const f = Math.min(Math.round(percent / 10), 10);
  return '▓'.repeat(f) + '░'.repeat(10 - f);
}

// ═══════════════════════════════════════
// Handlers
// ═══════════════════════════════════════

async function handleStatus(chatId: number, userId: string, lang: Lang, messageId?: number) {
  const t = T[lang];
  const supabase = createAdminClient();

  const { data: profile } = await supabase.from('profiles')
    .select('display_name, streak_current, daily_actions_target, is_pro, pro_until, timezone')
    .eq('id', userId).single();
  const { data: stats } = await supabase.from('stats')
    .select('level, current_xp, gold').eq('user_id', userId).single();

  const tz = profile?.timezone || 'Europe/Berlin';
  const today = getTodayForTz(tz);
  const { data: completions } = await supabase.from('completions')
    .select('count_done').eq('user_id', userId).eq('completion_date', today);

  const done = completions?.reduce((s: number, c: { count_done: number }) => s + c.count_done, 0) ?? 0;
  const target = profile?.daily_actions_target || 30;
  const pct = Math.round((done / target) * 100);
  const proLine = profile?.is_pro ? `\n👑 ${t.pro_until}: ${profile.pro_until ? new Date(profile.pro_until).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US') : '∞'}` : '';
  const time = new Date().toLocaleTimeString(lang === 'ru' ? 'ru-RU' : 'en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit' });

  const text = t.status_title(profile?.display_name || (lang === 'ru' ? 'Охотник' : 'Hunter'))
    + `\n\n📊 ${t.level}: ${stats?.level || 1} | ⚡ ${t.xp}: ${stats?.current_xp || 0}`
    + `\n🪙 ${t.gold}: ${stats?.gold || 0}`
    + `\n🔥 ${t.streak}: ${profile?.streak_current || 0} ${t.days}${proLine}`
    + `\n\n📋 ${t.today}: ${done}/${target}`
    + `\n${progressBar(pct)} ${pct}%`
    + (pct >= 100 ? `\n\n${t.plan_done}` : `\n\n${t.remaining(target - done)}`)
    + `\n\n${t.time} ${time}`;

  if (messageId) {
    await editMessage(chatId, messageId, text, backBtn(t));
  } else {
    await sendMessage(chatId, text, backBtn(t));
  }
}

async function handleStatsRange(chatId: number, messageId: number, userId: string, lang: Lang, days: number) {
  const t = T[lang];
  const supabase = createAdminClient();
  const { data: profile } = await supabase.from('profiles').select('timezone').eq('id', userId).single();
  const tz = profile?.timezone || 'Europe/Berlin';
  const from = getDateDaysAgo(days, tz);
  const label = days === 7 ? t.stats_week : t.stats_month;

  const { data: comp } = await supabase.from('completions').select('count_done').eq('user_id', userId).gte('completion_date', from);
  const totalAct = comp?.reduce((s: number, c: { count_done: number }) => s + c.count_done, 0) ?? 0;

  const { data: inc } = await supabase.from('income_events').select('amount').eq('user_id', userId).gte('event_date', from);
  const totalInc = inc?.reduce((s: number, i: { amount: number }) => s + Number(i.amount), 0) ?? 0;

  const { data: xpEv } = await supabase.from('xp_events').select('xp_amount').eq('user_id', userId).gte('event_date', from);
  const totalXP = xpEv?.reduce((s: number, e: { xp_amount: number }) => s + e.xp_amount, 0) ?? 0;

  const { data: sums } = await supabase.from('daily_summary').select('completed').eq('user_id', userId).gte('summary_date', from);
  const doneD = sums?.filter((s: { completed: boolean }) => s.completed).length ?? 0;

  const text = t.stats_range(label)
    + `\n\n📋 ${t.stats_actions}: ${totalAct}`
    + `\n✅ ${t.stats_completed_days}: ${doneD}/${days}`
    + `\n⚡ ${t.stats_xp}: ${totalXP > 0 ? '+' : ''}${totalXP}`
    + `\n💰 ${t.stats_income}: ${totalInc.toLocaleString()} ₽`;

  await editMessage(chatId, messageId, text, backBtn(t));
}

async function handleQuests(chatId: number, messageId: number, userId: string, lang: Lang) {
  const t = T[lang];
  const supabase = createAdminClient();
  const { data: quests } = await supabase.from('quests').select('title, quest_type, target_count')
    .eq('user_id', userId).eq('is_active', true).limit(10);

  if (!quests || quests.length === 0) {
    await editMessage(chatId, messageId, t.no_quests, backBtn(t));
    return;
  }

  const lines = quests.map((q: { title: string; quest_type: string; target_count: number }, i: number) => {
    const icon = q.quest_type === 'daily' ? '📅' : q.quest_type === 'weekly' ? '📆' : '⭐';
    return `${i + 1}. ${icon} <b>${q.title}</b> (${q.target_count} ${t.quest_actions})`;
  });

  await editMessage(chatId, messageId, t.quests_title(quests.length) + '\n\n' + lines.join('\n'), backBtn(t));
}

async function handleBosses(chatId: number, messageId: number, userId: string, lang: Lang) {
  const t = T[lang];
  const supabase = createAdminClient();
  const { data: bosses } = await supabase.from('bosses').select('title, boss_type, deadline, xp_reward')
    .eq('user_id', userId).eq('is_defeated', false).limit(10);

  if (!bosses || bosses.length === 0) {
    await editMessage(chatId, messageId, t.all_bosses_done, backBtn(t));
    return;
  }

  const lines = bosses.map((b: { title: string; deadline: string | null; xp_reward: number }, i: number) => {
    const dl = b.deadline ? ` (${t.boss_until} ${new Date(b.deadline).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')})` : '';
    const urgent = b.deadline && new Date(b.deadline) <= new Date(Date.now() + 86400000 * 2) ? '🔴' : '👹';
    return `${i + 1}. ${urgent} <b>${b.title}</b>${dl}\n   💎 ${t.boss_reward}: ${b.xp_reward} XP`;
  });

  await editMessage(chatId, messageId, t.bosses_title(bosses.length) + '\n\n' + lines.join('\n\n'), backBtn(t));
}

async function handleGoals(chatId: number, messageId: number, userId: string, lang: Lang) {
  const t = T[lang];
  const supabase = createAdminClient();
  const { data: profile } = await supabase.from('profiles')
    .select('daily_actions_target, monthly_income_target').eq('id', userId).single();

  const text = t.goals_title
    + `\n\n📋 ${t.goals_daily}: <b>${profile?.daily_actions_target || 30}</b> ${t.goals_actions}`
    + `\n💰 ${t.goals_income}: <b>${(profile?.monthly_income_target || 150000).toLocaleString()}</b> ₽/${lang === 'ru' ? 'мес' : 'mo'}`
    + `\n\n${t.goals_pick}`;

  await editMessage(chatId, messageId, text, goalsMenuKb(t));
}

async function handleSetGoal(chatId: number, messageId: number, userId: string, lang: Lang, target: number) {
  const t = T[lang];
  const supabase = createAdminClient();
  await supabase.from('profiles').update({ daily_actions_target: target, updated_at: new Date().toISOString() }).eq('id', userId);
  await editMessage(chatId, messageId, t.goal_updated(target), backBtn(t));
}

async function handleNotifyMenu(chatId: number, messageId: number, userId: string, lang: Lang) {
  const t = T[lang];
  const supabase = createAdminClient();
  const { data: profile } = await supabase.from('profiles')
    .select('notifications_enabled, notification_hours').eq('id', userId).single();

  const hours: number[] = profile?.notification_hours ?? [10, 18, 21];
  const enabled = profile?.notifications_enabled ?? true;
  const hl = hours.sort((a: number, b: number) => a - b).map((h: number) => `${String(h).padStart(2, '0')}:00`).join(', ');

  const text = t.notify_title
    + `\n\n${t.notify_status}: ${enabled ? t.notify_on : t.notify_off_label}`
    + `\n${t.notify_hours_label}: ${hl || t.notify_none}`
    + `\n\n${t.notify_pick}`;

  await editMessage(chatId, messageId, text, notifyMenuKb(hours, enabled, t));
}

async function handleNotifyToggleHour(chatId: number, messageId: number, userId: string, lang: Lang, hour: number) {
  const supabase = createAdminClient();
  const { data: profile } = await supabase.from('profiles').select('notification_hours').eq('id', userId).single();
  let hours: number[] = profile?.notification_hours ?? [10, 18, 21];
  hours = hours.includes(hour) ? hours.filter((h: number) => h !== hour) : [...hours, hour].sort((a, b) => a - b);
  await supabase.from('profiles').update({ notification_hours: hours, updated_at: new Date().toISOString() }).eq('id', userId);
  await handleNotifyMenu(chatId, messageId, userId, lang);
}

async function handleNotifyToggle(chatId: number, messageId: number, userId: string, lang: Lang, enable: boolean) {
  const supabase = createAdminClient();
  await supabase.from('profiles').update({ notifications_enabled: enable, updated_at: new Date().toISOString() }).eq('id', userId);
  await handleNotifyMenu(chatId, messageId, userId, lang);
}

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    from?: { id: number; username?: string; first_name?: string; language_code?: string };
    text?: string;
    successful_payment?: {
      currency: string; total_amount: number; invoice_payload: string;
      telegram_payment_charge_id: string; provider_payment_charge_id: string;
    };
  };
  callback_query?: {
    id: string;
    from: { id: number; language_code?: string };
    message?: { message_id: number; chat: { id: number } };
    data?: string;
  };
  pre_checkout_query?: {
    id: string; from: { id: number }; currency: string;
    total_amount: number; invoice_payload: string;
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
      const q = update.pre_checkout_query;
      if (!q.invoice_payload) { await answerPreCheckoutQuery(q.id, false, 'Error'); return NextResponse.json({ ok: true }); }
      const supabase = createAdminClient();
      const { data: p } = await supabase.from('profiles').select('id').eq('id', q.invoice_payload).maybeSingle();
      await answerPreCheckoutQuery(q.id, !!p, p ? undefined : 'Link account first: /start CODE');
      return NextResponse.json({ ok: true });
    }

    // ─── Successful payment (Stars) ───
    if (update.message?.successful_payment) {
      const pay = update.message.successful_payment;
      const chatId = update.message.chat.id;
      const userId = pay.invoice_payload;
      const supabase = createAdminClient();

      const { data: dup } = await supabase.from('payments').select('id')
        .eq('provider', 'stars').eq('invoice_id', pay.telegram_payment_charge_id).maybeSingle();
      if (dup) return NextResponse.json({ ok: true });

      const days = 30;
      const proUntil = new Date(); proUntil.setDate(proUntil.getDate() + days);
      const { error } = await supabase.from('profiles').update({
        is_pro: true, pro_until: proUntil.toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', userId);

      await supabase.from('payments').insert({
        user_id: userId, telegram_user_id: update.message.from?.id, provider: 'stars',
        invoice_id: pay.telegram_payment_charge_id, amount: pay.total_amount, currency: 'XTR',
        days_granted: days, status: error ? 'activation_failed' : 'completed',
        payload: pay as unknown as Record<string, unknown>,
      });

      const ud = await getUserData(chatId);
      const t = T[ud?.lang || 'en'];
      if (!error) {
        await sendMessage(chatId,
          `${t.pro_activated}\n\n⏱ ${t.pro_duration}: ${days} ${t.days}\n📅 ${t.pro_until_date}: ${proUntil.toLocaleDateString(ud?.lang === 'ru' ? 'ru-RU' : 'en-US')}\n\n${t.pro_ready}`,
          mainMenu(true, t),
        );
      }
      return NextResponse.json({ ok: true });
    }

    // ─── Callback queries ───
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat.id;
      const mid = cb.message?.message_id;
      const data = cb.data || '';

      if (!chatId || !mid) { await answerCallback(cb.id); return NextResponse.json({ ok: true }); }

      const ud = await getUserData(chatId);
      if (!ud) { await answerCallback(cb.id, 'Link account: /start CODE'); return NextResponse.json({ ok: true }); }

      await answerCallback(cb.id);
      const { userId, lang } = ud;
      const t = T[lang];

      if (data === 'main') {
        const supabase = createAdminClient();
        const { data: prof } = await supabase.from('profiles').select('is_pro').eq('id', userId).single();
        await editMessage(chatId, mid, t.menu_title, mainMenu(!!prof?.is_pro, t));
      } else if (data === 'status') {
        await handleStatus(chatId, userId, lang, mid);
      } else if (data === 'stats_menu') {
        await editMessage(chatId, mid, t.stats_title, statsMenu(t));
      } else if (data === 'stats_week') {
        await handleStatsRange(chatId, mid, userId, lang, 7);
      } else if (data === 'stats_month') {
        await handleStatsRange(chatId, mid, userId, lang, 30);
      } else if (data === 'quests') {
        await handleQuests(chatId, mid, userId, lang);
      } else if (data === 'bosses') {
        await handleBosses(chatId, mid, userId, lang);
      } else if (data === 'goals') {
        await handleGoals(chatId, mid, userId, lang);
      } else if (data.startsWith('goal_daily_')) {
        await handleSetGoal(chatId, mid, userId, lang, parseInt(data.replace('goal_daily_', '')));
      } else if (data === 'notify_menu') {
        await handleNotifyMenu(chatId, mid, userId, lang);
      } else if (data.startsWith('notify_toggle_')) {
        await handleNotifyToggleHour(chatId, mid, userId, lang, parseInt(data.replace('notify_toggle_', '')));
      } else if (data === 'notify_on') {
        await handleNotifyToggle(chatId, mid, userId, lang, true);
      } else if (data === 'notify_off') {
        await handleNotifyToggle(chatId, mid, userId, lang, false);
      } else if (data === 'buy_pro') {
        const supabase = createAdminClient();
        const { data: prof } = await supabase.from('profiles').select('is_pro, pro_until').eq('id', userId).single();
        if (prof?.is_pro && prof.pro_until && new Date(prof.pro_until) > new Date()) {
          await editMessage(chatId, mid, t.pro_already(new Date(prof.pro_until).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')), backBtn(t));
        } else {
          await sendStarsInvoice(chatId, userId);
        }
      } else if (data === 'pro_info') {
        const supabase = createAdminClient();
        const { data: prof } = await supabase.from('profiles').select('pro_until').eq('id', userId).single();
        await editMessage(chatId, mid,
          `${t.pro_info_title}\n\n📅 ${t.pro_info_until}: ${prof?.pro_until ? new Date(prof.pro_until).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US') : '∞'}\n\n${t.pro_features}`,
          backBtn(t),
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
    const tgLang: Lang = message.from?.language_code === 'ru' ? 'ru' : 'en';

    // /start TOKEN
    if (text.startsWith('/start ')) {
      const token = text.replace('/start ', '').trim().toUpperCase();
      if (!token || token.length < 4) {
        await sendMessage(chatId, T[tgLang].link_bad_code);
        return NextResponse.json({ ok: true });
      }
      const supabase = createAdminClient();
      const { data: tokenRow } = await supabase.from('telegram_link_tokens').select('*')
        .eq('token', token).eq('used', false).gt('expires_at', new Date().toISOString()).maybeSingle();
      if (!tokenRow) { await sendMessage(chatId, T[tgLang].link_not_found); return NextResponse.json({ ok: true }); }

      await supabase.from('telegram_link_tokens').update({ used: true }).eq('token', token);
      await supabase.from('telegram_links').delete().eq('user_id', tokenRow.user_id);
      await supabase.from('telegram_links').insert({ user_id: tokenRow.user_id, chat_id: chatId, username, is_active: true });

      // Get user's locale
      const { data: prof } = await supabase.from('profiles').select('locale, is_pro').eq('id', tokenRow.user_id).single();
      const lang: Lang = prof?.locale === 'ru' ? 'ru' : 'en';
      const t = T[lang];

      await sendMessage(chatId, t.link_success);
      await handleStatus(chatId, tokenRow.user_id, lang);
      return NextResponse.json({ ok: true });
    }

    // /start
    if (text === '/start') {
      const ud = await getUserData(chatId);
      if (ud) { await handleStatus(chatId, ud.userId, ud.lang); }
      else { await sendMessage(chatId, T[tgLang].start_msg); }
      return NextResponse.json({ ok: true });
    }

    // Other commands
    const ud = await getUserData(chatId);
    if (!ud) { await sendMessage(chatId, T[tgLang].link_required); return NextResponse.json({ ok: true }); }
    const { userId, lang } = ud;
    const t = T[lang];

    if (text === '/menu') {
      const supabase = createAdminClient();
      const { data: prof } = await supabase.from('profiles').select('is_pro').eq('id', userId).single();
      await sendMessage(chatId, t.menu_title, mainMenu(!!prof?.is_pro, t));
    } else if (text === '/status') {
      await handleStatus(chatId, userId, lang);
    } else if (text === '/pro') {
      const supabase = createAdminClient();
      const { data: prof } = await supabase.from('profiles').select('is_pro, pro_until').eq('id', userId).single();
      if (prof?.is_pro && prof.pro_until && new Date(prof.pro_until) > new Date()) {
        await sendMessage(chatId, t.pro_already(new Date(prof.pro_until).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')), mainMenu(true, t));
      } else { await sendStarsInvoice(chatId, userId); }
    } else if (text === '/help') {
      await sendMessage(chatId, t.help_msg, mainMenu(false, t));
    } else if (text === '/on') {
      const supabase = createAdminClient();
      await supabase.from('telegram_links').update({ is_active: true }).eq('chat_id', chatId);
      await sendMessage(chatId, t.notify_enabled, mainMenu(false, t));
    } else if (text === '/off') {
      const supabase = createAdminClient();
      await supabase.from('telegram_links').update({ is_active: false }).eq('chat_id', chatId);
      await sendMessage(chatId, t.notify_disabled, mainMenu(false, t));
    } else {
      // Any other text → show menu
      const supabase = createAdminClient();
      const { data: prof } = await supabase.from('profiles').select('is_pro').eq('id', userId).single();
      await sendMessage(chatId, t.menu_title, mainMenu(!!prof?.is_pro, t));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ ok: true });
  }
}