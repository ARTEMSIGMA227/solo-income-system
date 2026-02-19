import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramMessage } from '@/lib/telegram';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { id: number; username?: string; first_name?: string };
    text?: string;
  };
}

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('x-telegram-bot-api-secret-token');
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await request.json();
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

      // Find token
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

      // Mark token as used
      await supabase.from('telegram_link_tokens').update({ used: true }).eq('token', token);

      // Remove old link if exists
      await supabase.from('telegram_links').delete().eq('user_id', tokenRow.user_id);

      // Create new link
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
        + '/off — отключить уведомления\n'
        + '/on — включить уведомления',
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
        .select('display_name, streak_current, daily_actions_target')
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

      await sendTelegramMessage(
        chatId,
        `⚔️ <b>${profile?.display_name || 'Охотник'}</b>\n\n`
        + `📊 Уровень: ${stats?.level || 1}\n`
        + `⚡ XP: ${stats?.current_xp || 0}\n`
        + `🪙 Золото: ${stats?.gold || 0}\n`
        + `🔥 Серия: ${profile?.streak_current || 0} дней\n\n`
        + `📋 Сегодня: ${todayActions}/${target} (${percent}%)\n`
        + (percent >= 100 ? '✅ План выполнен!' : `⏳ Осталось ${target - todayActions} действий`),
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
      'Доступные команды:\n/status — прогресс\n/on — вкл уведомления\n/off — выкл\n/start КОД — привязать аккаунт',
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ ok: true });
  }
}
