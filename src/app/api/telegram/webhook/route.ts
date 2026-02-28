import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramMessage } from '@/lib/telegram';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const PRICE_STARS = 750;

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

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
  pre_checkout_query?: {
    id: string;
    from: { id: number; username?: string; first_name?: string };
    currency: string;
    total_amount: number;
    invoice_payload: string;
  };
}

async function answerPreCheckoutQuery(queryId: string, ok: boolean, errorMessage?: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
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
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      title: 'Solo Income System PRO',
      description: 'PRO подписка на 30 дней — безлимитные навыки, квесты, аналитика, AI и многое другое',
      payload: userId,
      currency: 'XTR',
      prices: [{ label: 'PRO 30 дней', amount: PRICE_STARS }],
    }),
  });
}

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('x-telegram-bot-api-secret-token');
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await request.json();

    // ═══════════════════════════════════════
    // Handle pre_checkout_query (Stars payment)
    // Must respond within 10 seconds!
    // ═══════════════════════════════════════
    if (update.pre_checkout_query) {
      const query = update.pre_checkout_query;
      const userId = query.invoice_payload;

      if (!userId) {
        await answerPreCheckoutQuery(query.id, false, 'Ошибка: аккаунт не найден');
        return NextResponse.json({ ok: true });
      }

      // Verify user exists
      const supabase = createAdminClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) {
        await answerPreCheckoutQuery(query.id, false, 'Аккаунт не привязан. Используй /start КОД');
        return NextResponse.json({ ok: true });
      }

      await answerPreCheckoutQuery(query.id, true);
      return NextResponse.json({ ok: true });
    }

    // ═══════════════════════════════════════
    // Handle successful_payment (Stars)
    // ═══════════════════════════════════════
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const chatId = update.message.chat.id;
      const userId = payment.invoice_payload;
      const supabase = createAdminClient();

      // Check duplicate
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('provider', 'stars')
        .eq('invoice_id', payment.telegram_payment_charge_id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ ok: true });
      }

      // Activate PRO
      const days = 30;
      const proUntil = new Date();
      proUntil.setDate(proUntil.getDate() + days);

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          is_pro: true,
          pro_until: proUntil.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      // Log payment
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
        await sendTelegramMessage(
          chatId,
          '🎉 <b>PRO активирован!</b>\n\n'
          + `⏱ Срок: ${days} дней\n`
          + `📅 До: ${proUntil.toLocaleDateString('ru-RU')}\n\n`
          + '🚀 Все PRO-функции доступны!',
        );
      } else {
        await sendTelegramMessage(chatId, '❌ Ошибка активации. Напишите в поддержку.');
      }

      return NextResponse.json({ ok: true });
    }

    // ═══════════════════════════════════════
    // Handle text commands
    // ═══════════════════════════════════════
    const message = update.message;
    if (!message?.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text.trim();
    const username = message.from?.username || message.from?.first_name || '';

    // /start TOKEN — link account
    if (text.startsWith('/start ')) {
      const token = text.replace('/start ', '').trim().toUpperCase();
      if (!token || token.length < 4) {
        await sendTelegramMessage(chatId, '❌ Неверный код. Получи код в настройках приложения.');
        return NextResponse.json({ ok: true });
      }

      const supabase = createAdminClient();

      const { data: tokenRow } = await supabase
        .from('telegram_link_tokens')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (!tokenRow) {
        await sendTelegramMessage(chatId, '❌ Код не найден или истёк. Получи новый в настройках приложения.');
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

      await sendTelegramMessage(
        chatId,
        '✅ <b>Solo Income System подключён!</b>\n\n'
        + '🔔 Ты будешь получать уведомления:\n'
        + '• 10:00 — утренняя мотивация\n'
        + '• 18:00 — статус дня\n'
        + '• 21:00 — последний шанс\n\n'
        + 'Команды:\n'
        + '/status — текущий прогресс\n'
        + '/pro — купить PRO ⭐\n'
        + '/off — отключить уведомления\n'
        + '/on — включить уведомления\n'
        + '/help — все команды',
      );

      return NextResponse.json({ ok: true });
    }

    // /start without token
    if (text === '/start') {
      await sendTelegramMessage(
        chatId,
        '⚔️ <b>Solo Income System</b>\n\n'
        + 'Чтобы подключить уведомления:\n'
        + '1. Открой solo-income-system.vercel.app\n'
        + '2. Настройки → Telegram → Получить код\n'
        + '3. Отправь код сюда через /start КОД',
      );
      return NextResponse.json({ ok: true });
    }

    // /status — show today's progress
    if (text === '/status') {
      const supabase = createAdminClient();
      const { data: link } = await supabase
        .from('telegram_links')
        .select('user_id')
        .eq('chat_id', chatId)
        .maybeSingle();

      if (!link) {
        await sendTelegramMessage(chatId, '❌ Аккаунт не привязан. Используй /start КОД');
        return NextResponse.json({ ok: true });
      }

      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
      const { data: stats } = await supabase
        .from('stats')
        .select('level, current_xp, total_xp_earned, gold, total_actions')
        .eq('user_id', link.user_id)
        .single();

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, streak_current, daily_actions_target, is_pro, pro_until')
        .eq('id', link.user_id)
        .single();

      const { data: completions } = await supabase
        .from('completions')
        .select('count_done')
        .eq('user_id', link.user_id)
        .eq('completion_date', today);

      const todayActions = completions?.reduce(
        (sum: number, c: { count_done: number }) => sum + c.count_done, 0,
      ) ?? 0;

      const target = profile?.daily_actions_target || 30;
      const percent = Math.round((todayActions / target) * 100);

      const proLine = profile?.is_pro
        ? `👑 PRO до: ${profile.pro_until ? new Date(profile.pro_until).toLocaleDateString('ru-RU') : '∞'}\n`
        : '';

      await sendTelegramMessage(
        chatId,
        `⚔️ <b>${profile?.display_name || 'Охотник'}</b>\n\n`
        + `📊 Уровень: ${stats?.level || 1}\n`
        + `⚡ XP: ${stats?.current_xp || 0}\n`
        + `🪙 Золото: ${stats?.gold || 0}\n`
        + `🔥 Серия: ${profile?.streak_current || 0} дней\n`
        + proLine
        + `\n📋 Сегодня: ${todayActions}/${target} (${percent}%)\n`
        + (percent >= 100 ? '✅ План выполнен!' : `⏳ Осталось ${target - todayActions} действий`),
      );
      return NextResponse.json({ ok: true });
    }

    // /pro — buy PRO via Stars
    if (text === '/pro') {
      const supabase = createAdminClient();
      const { data: link } = await supabase
        .from('telegram_links')
        .select('user_id')
        .eq('chat_id', chatId)
        .maybeSingle();

      if (!link) {
        await sendTelegramMessage(chatId, '❌ Сначала привяжи аккаунт: /start КОД');
        return NextResponse.json({ ok: true });
      }

      // Check if already PRO
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro, pro_until')
        .eq('id', link.user_id)
        .single();

      if (profile?.is_pro && profile.pro_until && new Date(profile.pro_until) > new Date()) {
        await sendTelegramMessage(
          chatId,
          `👑 <b>У тебя уже PRO!</b>\n\nДействует до: ${new Date(profile.pro_until).toLocaleDateString('ru-RU')}`,
        );
        return NextResponse.json({ ok: true });
      }

      await sendStarsInvoice(chatId, link.user_id);
      return NextResponse.json({ ok: true });
    }

    // /help — all commands
    if (text === '/help') {
      await sendTelegramMessage(
        chatId,
        '📖 <b>Команды:</b>\n\n'
        + '/status — текущий прогресс\n'
        + '/pro — купить PRO за ⭐ Stars\n'
        + '/on — включить уведомления\n'
        + '/off — отключить уведомления\n'
        + '/start КОД — привязать аккаунт\n\n'
        + '🌐 <a href="https://solo-income-system.vercel.app">Открыть приложение</a>',
      );
      return NextResponse.json({ ok: true });
    }

    // /off — disable notifications
    if (text === '/off') {
      const supabase = createAdminClient();
      await supabase.from('telegram_links').update({ is_active: false }).eq('chat_id', chatId);
      await sendTelegramMessage(chatId, '🔕 Уведомления отключены. /on чтобы включить.');
      return NextResponse.json({ ok: true });
    }

    // /on — enable notifications
    if (text === '/on') {
      const supabase = createAdminClient();
      await supabase.from('telegram_links').update({ is_active: true }).eq('chat_id', chatId);
      await sendTelegramMessage(chatId, '🔔 Уведомления включены!');
      return NextResponse.json({ ok: true });
    }

    // Unknown command
    await sendTelegramMessage(
      chatId,
      'Команды:\n/status — прогресс\n/pro — купить PRO ⭐\n/on — вкл уведомления\n/off — выкл\n/help — все команды\n/start КОД — привязать аккаунт',
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ ok: true });
  }
}