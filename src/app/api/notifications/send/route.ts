import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface UserStats {
  streak: number;
  level: number;
  display_name: string | null;
}

function getVapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL;

  if (!publicKey || !privateKey || !email) {
    throw new Error("VAPID keys not configured");
  }

  return { publicKey, privateKey, email };
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase admin credentials not configured");
  }

  return createClient(url, serviceKey);
}

function buildNotificationPayload(stats: UserStats | null): string {
  const messages = [
    "⚔️ Охотник, твои квесты ждут! Не дай рангу упасть.",
    "🔥 Серия активна! Не сломай streak.",
    "💀 Босс появился в подземелье. Готов сразиться?",
    "🏆 Проверь магазин — новые награды доступны!",
    "📊 Зайди в аналитику и оцени свой прогресс.",
  ];

  let title = "Solo Income System";
  let body = messages[Math.floor(Math.random() * messages.length)];

  if (stats) {
    if (stats.streak > 0) {
      body = `🔥 Streak: ${stats.streak} дней! ${body}`;
    }
    title = stats.display_name
      ? `${stats.display_name}, Level ${stats.level}`
      : `Охотник Level ${stats.level}`;
  }

  return JSON.stringify({
    title,
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: "/dashboard" },
  });
}

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && secret !== cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const vapid = getVapidKeys();
    const supabase = getSupabaseAdmin();

    webpush.setVapidDetails(
      `mailto:${vapid.email}`,
      vapid.publicKey,
      vapid.privateKey
    );

    // Get all subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth");

    if (subError) {
      console.error("Failed to fetch subscriptions:", subError);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: "No subscriptions" });
    }

    const typedSubs = subscriptions as PushSubscriptionRecord[];

    let sent = 0;
    let failed = 0;
    const staleIds: string[] = [];

    for (const sub of typedSubs) {
      try {
        // Get user stats for personalized message
        const { data: stats } = await supabase
          .from("profiles")
          .select("streak, level, display_name")
          .eq("id", sub.user_id)
          .single();

        const payload = buildNotificationPayload(
          stats as UserStats | null
        );

        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );

        sent++;
      } catch (err: unknown) {
        failed++;
        const pushError = err as { statusCode?: number };
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          staleIds.push(sub.id);
        }
        console.error(
          `Push failed for ${sub.user_id}:`,
          pushError.statusCode
        );
      }
    }

    // Clean up stale subscriptions
    if (staleIds.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("id", staleIds);
    }

    return NextResponse.json({
      sent,
      failed,
      cleaned: staleIds.length,
      total: typedSubs.length,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    console.error("Push send error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}