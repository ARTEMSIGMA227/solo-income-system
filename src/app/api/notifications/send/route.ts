import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { sendTelegramMessage } from '@/lib/telegram';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function getNotificationContent(
  hour: number,
  todayActions: number,
  target: number,
  displayName: string,
): { title: string; body: string } | null {
  const percent = Math.round((todayActions / target) * 100);

  if (hour >= 10 && hour < 12 && todayActions === 0) {
    return {
      title: '⚔️ Утренняя охота',
      body: `${displayName}, новый день — новые XP! Начни с первого действия.`,
    };
  }

  if (hour >= 18 && hour < 20 && percent < 50) {
    return {
      title: '🔴 День ещё не закрыт!',
      body: `Только ${percent}% плана. Осталось ${target - todayActions} действий. Не теряй серию!`,
    };
  }

  if (hour >= 21 && hour < 22 && percent < 100) {
    return {
      title: '💀 ПОСЛЕДНИЙ ШАНС',
      body: `${todayActions}/${target} действий. Ещё можно успеть. Не допусти штраф!`,
    };
  }

  return null;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@solo-income.app';

  if (vapidPublic && vapidPrivate) {
    webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);
  }

  const supabase = createAdminClient();
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
  const hour = parseInt(
    new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin', hour: 'numeric', hour12: false }),
    10,
  );

  // Get all users with notifications enabled
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, daily_actions_target, notifications_enabled')
    .eq('notifications_enabled', true);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No users with notifications' });
  }

  let pushSent = 0;
  let telegramSent = 0;
  let skipped = 0;

  for (const profile of profiles) {
    // Get today's actions
    const { data: completions } = await supabase
      .from('completions')
      .select('count_done')
      .eq('user_id', profile.id)
      .eq('completion_date', today);

    const todayActions = completions?.reduce(
      (sum: number, c: { count_done: number }) => sum + c.count_done,
      0,
    ) ?? 0;

    const target = profile.daily_actions_target || 30;
    const content = getNotificationContent(hour, todayActions, target, profile.display_name);

    if (!content) {
      skipped++;
      continue;
    }

    // Send Web Push
    if (vapidPublic && vapidPrivate) {
      const { data: pushSubs } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth_key')
        .eq('user_id', profile.id);

      for (const sub of pushSubs ?? []) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
            JSON.stringify({ ...content, icon: '/icons/icon-192.png', url: '/dashboard' }),
          );
          pushSent++;
        } catch (err) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 410 || code === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }
      }
    }

    // Send Telegram
    const { data: tgLink } = await supabase
      .from('telegram_links')
      .select('chat_id, is_active')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .maybeSingle();

    if (tgLink) {
      const tgText = `<b>${content.title}</b>\n\n${content.body}`;
      const sent = await sendTelegramMessage(tgLink.chat_id, tgText);
      if (sent) telegramSent++;
    }
  }

  return NextResponse.json({
    push_sent: pushSent,
    telegram_sent: telegramSent,
    skipped,
    total_users: profiles.length,
  });
}
