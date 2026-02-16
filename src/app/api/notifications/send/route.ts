import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Use service role for cron — bypasses RLS
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@solo-income.app';

  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
  }

  webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);

  const supabase = createAdminClient();

  // Get all subscriptions with user profiles and today's activity
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
  const currentHour = new Date().toLocaleString('en-US', {
    timeZone: 'Europe/Berlin',
    hour: 'numeric',
    hour12: false,
  });
  const hour = parseInt(currentHour, 10);

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*, profiles!inner(display_name, daily_actions_target, notifications_enabled)');

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0 });
  }

  let sent = 0;
  let skipped = 0;
  const failed: string[] = [];

  for (const sub of subscriptions) {
    const profile = (sub as Record<string, unknown>).profiles as {
      display_name: string;
      daily_actions_target: number;
      notifications_enabled: boolean;
    } | null;

    if (!profile?.notifications_enabled) {
      skipped++;
      continue;
    }

    // Get today's completions for this user
    const { data: completions } = await supabase
      .from('completions')
      .select('count_done')
      .eq('user_id', sub.user_id)
      .eq('completion_date', today);

    const todayActions = completions?.reduce(
      (sum: number, c: { count_done: number }) => sum + c.count_done,
      0,
    ) ?? 0;

    const target = profile.daily_actions_target || 30;
    const percent = Math.round((todayActions / target) * 100);

    // Decide notification message
    let title = '';
    let body = '';
    let shouldSend = false;

    if (hour >= 10 && hour < 12 && todayActions === 0) {
      // Morning reminder
      title = '⚔️ Утренняя охота';
      body = `${profile.display_name}, новый день — новые XP! Начни с первого действия.`;
      shouldSend = true;
    } else if (hour >= 18 && hour < 20 && percent < 50) {
      // Evening warning
      title = '🔴 День ещё не закрыт!';
      body = `Только ${percent}% плана. Осталось ${target - todayActions} действий. Не теряй серию!`;
      shouldSend = true;
    } else if (hour >= 21 && hour < 22 && percent < 100) {
      // Critical warning
      title = '💀 ПОСЛЕДНИЙ ШАНС';
      body = `${todayActions}/${target} действий. Ещё можно успеть. Не допусти штраф!`;
      shouldSend = true;
    }

    if (!shouldSend) {
      skipped++;
      continue;
    }

    const pushPayload = JSON.stringify({
      title,
      body,
      icon: '/icons/icon-192.png',
      url: '/dashboard',
    });

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth_key },
        },
        pushPayload,
      );
      sent++;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      // 410 Gone = subscription expired, clean up
      if (statusCode === 410 || statusCode === 404) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('id', sub.id);
      }
      failed.push(sub.endpoint.slice(0, 50));
    }
  }

  return NextResponse.json({ sent, skipped, failed: failed.length });
}
