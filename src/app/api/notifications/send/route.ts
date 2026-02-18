import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && secret !== cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL;

    if (!supabaseUrl || !serviceKey || !vapidPublic || !vapidPrivate || !vapidEmail) {
      return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    webpush.setVapidDetails(
      vapidEmail.startsWith("mailto:") ? vapidEmail : `mailto:${vapidEmail}`,
      vapidPublic,
      vapidPrivate
    );

    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth_key");

    if (subError) {
      console.error("Failed to fetch subscriptions:", subError);
      return NextResponse.json({ error: subError.message }, { status: 500 });
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
        const payload = JSON.stringify({
          title: "Solo Income System",
          body: "⚔️ Охотник, твои квесты ждут! Не дай рангу упасть.",
          icon: "/icon-192.png",
          data: { url: "/dashboard" },
        });

        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth_key,
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
      }
    }

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
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Push send error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}