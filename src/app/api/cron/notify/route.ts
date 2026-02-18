import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:admin@solo-income-system.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface PushRow {
  id: string;
  user_id: string;
  subscription: webpush.PushSubscription;
}

interface ProfileRow {
  id: string;
  display_name: string;
  daily_actions_target: number;
  timezone: string;
}

interface CompletionRow {
  count_done: number;
}

function getUserHour(tz: string): number {
  try {
    const str = new Date().toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false });
    return parseInt(str, 10);
  } catch {
    return new Date().getUTCHours() + 1; // fallback CET
  }
}

function getTodayForTz(tz: string): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: tz });
}

function buildMessage(hour: number, todayActions: number, target: number, name: string): { title: string; body: string } | null {
  const pct = target > 0 ? Math.round((todayActions / target) * 100) : 0;

  if (hour >= 9 && hour <= 11) {
    return {
      title: '☀️ Доброе утро, Охотник!',
      body: `${name}, новый день — новый шанс. Цель: ${target} действий. Вперёд! ⚔️`,
    };
  }

  if (hour >= 17 && hour <= 19) {
    if (pct >= 100) {
      return {
        title: '🏆 День закрыт!',
        body: `${todayActions}/${target} — ты машина, ${name}! Отдыхай или добивай бонус.`,
      };
    }
    if (pct >= 50) {
      return {
        title: '⚡ Половина пути',
        body: `${todayActions}/${target} (${pct}%). Ещё ${target - todayActions} действий, ${name}. Не сбавляй!`,
      };
    }
    return {
      title: '⚠️ Мало действий!',
      body: `${todayActions}/${target} (${pct}%). ${name}, ещё ${target - todayActions} до цели. Серия под угрозой!`,
    };
  }

  if (hour >= 20 && hour <= 22) {
    if (pct >= 100) return null; // уже закрыл, не спамим
    return {
      title: '🔴 Последний шанс!',
      body: `${todayActions}/${target} — осталось ${target - todayActions}. Не потеряй серию, ${name}!`,
    };
  }

  return null;
}

export async function GET(request: Request) {
  // Vercel cron auth
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 1. Все push-подписки
  const { data: subs, error: subsErr } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, subscription');

  if (subsErr || !subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, reason: 'no_subs' });
  }

  const typedSubs = subs as PushRow[];

  // 2. Уникальные user_id
  const userIds = [...new Set(typedSubs.map((s) => s.user_id))];

  // 3. Профили
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, daily_actions_target, timezone')
    .in('id', userIds);

  const profileMap = new Map<string, ProfileRow>();
  (profiles as ProfileRow[] | null)?.forEach((p) => profileMap.set(p.id, p));

  let sent = 0;
  const stale: string[] = [];

  for (const userId of userIds) {
    const prof = profileMap.get(userId);
    if (!prof) continue;

    const userHour = getUserHour(prof.timezone);
    const today = getTodayForTz(prof.timezone);

    // Действия за сегодня
    const { data: completions } = await supabase
      .from('completions')
      .select('count_done')
      .eq('user_id', userId)
      .eq('completion_date', today);

    const todayActions = (completions as CompletionRow[] | null)?.reduce(
      (sum, c) => sum + c.count_done, 0,
    ) ?? 0;

    const msg = buildMessage(userHour, todayActions, prof.daily_actions_target, prof.display_name);
    if (!msg) continue;

    const payload = JSON.stringify({
      title: msg.title,
      body: msg.body,
      icon: '/icon-192.png',
    });

    // Отправить всем подпискам этого юзера
    const userSubs = typedSubs.filter((s) => s.user_id === userId);

    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        sent++;
      } catch (err: unknown) {
        const status = err instanceof webpush.WebPushError ? err.statusCode : 0;
        if (status === 410 || status === 404) {
          stale.push(sub.id);
        }
      }
    }
  }

  // Очистка мёртвых подписок
  if (stale.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', stale);
  }

  return NextResponse.json({ sent, cleaned: stale.length, users: userIds.length });
}