import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

webpush.setVapidDetails(
  "mailto:admin@solo-income-system.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

const MOTIVATIONAL_RU = [
  "💪 Каждое действие приближает тебя к цели!",
  "🔥 Ты сильнее, чем думаешь. Продолжай!",
  "⚡ Маленькие шаги — большие результаты.",
  "🎯 Фокус на действиях, результат придёт.",
  "🚀 Дисциплина побеждает мотивацию.",
  "💎 Инвестируй в себя каждый день.",
  "🏆 Победители не сдаются. Ты — победитель.",
  "⭐ Сегодня — лучший день для прогресса.",
];

interface SubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

interface TelegramLinkRow {
  user_id: string;
  chat_id: number;
  is_active: boolean;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  streak_current: number;
  timezone: string | null;
  notifications_enabled: boolean;
  daily_actions_target: number;
  notification_hours: number[] | null;
  is_pro: boolean;
}

interface WebPushError extends Error {
  statusCode: number;
}

function isWebPushError(err: unknown): err is WebPushError {
  return (
    err instanceof Error &&
    "statusCode" in err &&
    typeof (err as WebPushError).statusCode === "number"
  );
}

function getHourInTimezone(tz: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    });
    return parseInt(formatter.format(new Date()), 10);
  } catch {
    return new Date().getUTCHours();
  }
}

function getTodayForTz(tz: string): string {
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: tz });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function getMotivational(): string {
  return MOTIVATIONAL_RU[Math.floor(Math.random() * MOTIVATIONAL_RU.length)];
}

function getMessageForHour(
  hour: number,
  hours: number[],
  name: string,
  streak: number,
  todayActions: number,
  target: number,
): { title: string; body: string } | null {
  if (!hours.includes(hour)) return null;

  const percent = target > 0 ? Math.round((todayActions / target) * 100) : 0;
  const remaining = Math.max(target - todayActions, 0);

  // Determine message type by position in schedule
  const sorted = [...hours].sort((a, b) => a - b);
  const idx = sorted.indexOf(hour);
  const position = sorted.length === 1 ? "only" : idx === 0 ? "first" : idx === sorted.length - 1 ? "last" : "mid";

  // Morning (first notification of the day)
  if (position === "first" || (position === "only" && hour < 14)) {
    return {
      title: "🌅 Утренний квест",
      body: streak > 0
        ? `${name}, начни день! Серия: ${streak} 🔥\n${getMotivational()}`
        : `${name}, начни новую серию сегодня!\n${getMotivational()}`,
    };
  }

  // Last chance (last notification)
  if (position === "last" || (position === "only" && hour >= 19)) {
    if (percent >= 100) return null;
    return {
      title: "🌙 Последний шанс",
      body: `${name}, осталось ${remaining} действий! Не потеряй серию ${streak} 🔥`,
    };
  }

  // Mid-day status
  if (percent >= 100) {
    return {
      title: "✅ План выполнен!",
      body: `${name}, ты выполнил ${todayActions}/${target} действий. Молодец! ${getMotivational()}`,
    };
  }
  return {
    title: "⚡ Дневной статус",
    body: `${name}, ${todayActions}/${target} (${percent}%). Осталось ${remaining} действий!`,
  };
}

async function sendTelegramMsg(chatId: number, text: string): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load all data
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, streak_current, timezone, notifications_enabled, daily_actions_target, notification_hours, is_pro");

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ push_sent: 0, tg_sent: 0, reason: "no_profiles" });
  }

  const typedProfiles = profiles as ProfileRow[];
  const userIds = typedProfiles.map((p) => p.id);

  // Push subscriptions
  const { data: subscriptions } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth_key")
    .in("user_id", userIds);

  const typedSubs = (subscriptions ?? []) as SubscriptionRow[];

  // Telegram links
  const { data: tgLinks } = await supabaseAdmin
    .from("telegram_links")
    .select("user_id, chat_id, is_active")
    .in("user_id", userIds)
    .eq("is_active", true);

  const typedTgLinks = (tgLinks ?? []) as TelegramLinkRow[];

  const profileMap = new Map<string, ProfileRow>();
  for (const p of typedProfiles) profileMap.set(p.id, p);

  const tgLinkMap = new Map<string, TelegramLinkRow>();
  for (const l of typedTgLinks) tgLinkMap.set(l.user_id, l);

  // Today's actions per user
  const todayActionsMap = new Map<string, number>();
  for (const prof of typedProfiles) {
    const tz = prof.timezone ?? "Europe/Berlin";
    const today = getTodayForTz(tz);
    const { data: completions } = await supabaseAdmin
      .from("completions")
      .select("count_done")
      .eq("user_id", prof.id)
      .eq("completion_date", today);

    const total = (completions ?? []).reduce(
      (sum: number, c: { count_done: number }) => sum + c.count_done,
      0,
    );
    todayActionsMap.set(prof.id, total);
  }

  // Web Push notifications
  let pushSent = 0;
  let pushSkipped = 0;
  let pushFailed = 0;

  for (const row of typedSubs) {
    const profile = profileMap.get(row.user_id);
    if (!profile || !profile.notifications_enabled) {
      pushSkipped++;
      continue;
    }

    const tz = profile.timezone ?? "Europe/Berlin";
    const currentHour = getHourInTimezone(tz);
    const hours = profile.notification_hours ?? [10, 18, 21];
    const todayActions = todayActionsMap.get(profile.id) ?? 0;
    const target = profile.daily_actions_target ?? 30;

    const message = getMessageForHour(
      currentHour,
      hours,
      profile.display_name ?? "Охотник",
      profile.streak_current ?? 0,
      todayActions,
      target,
    );

    if (!message) {
      pushSkipped++;
      continue;
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth_key },
        },
        JSON.stringify(message),
      );
      pushSent++;
    } catch (err: unknown) {
      pushFailed++;
      if (isWebPushError(err) && (err.statusCode === 410 || err.statusCode === 404)) {
        await supabaseAdmin.from("push_subscriptions").delete().eq("id", row.id);
      }
    }
  }

  // Telegram notifications
  let tgSent = 0;
  let tgSkipped = 0;
  let tgFailed = 0;

  for (const prof of typedProfiles) {
    if (!prof.notifications_enabled) {
      tgSkipped++;
      continue;
    }

    const link = tgLinkMap.get(prof.id);
    if (!link) {
      tgSkipped++;
      continue;
    }

    const tz = prof.timezone ?? "Europe/Berlin";
    const currentHour = getHourInTimezone(tz);
    const hours = prof.notification_hours ?? [10, 18, 21];
    const todayActions = todayActionsMap.get(prof.id) ?? 0;
    const target = prof.daily_actions_target ?? 30;

    const message = getMessageForHour(
      currentHour,
      hours,
      prof.display_name ?? "Охотник",
      prof.streak_current ?? 0,
      todayActions,
      target,
    );

    if (!message) {
      tgSkipped++;
      continue;
    }

    const tgText =
      `<b>${message.title}</b>\n\n${message.body}\n\n` +
      `📊 <a href="https://solo-income-system.vercel.app/dashboard">Открыть Dashboard</a>`;

    const ok = await sendTelegramMsg(link.chat_id, tgText);
    if (ok) tgSent++;
    else tgFailed++;
  }

  return NextResponse.json({
    push: { sent: pushSent, skipped: pushSkipped, failed: pushFailed },
    telegram: { sent: tgSent, skipped: tgSkipped, failed: tgFailed },
    timestamp: new Date().toISOString(),
  });
}