// src/app/api/notifications/test/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:admin@solo-income-system.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

interface SubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

export async function GET() {
  return NextResponse.json({ status: "ok", route: "notifications/test" });
}

export async function POST() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_key")
    .eq("user_id", user.id);

  if (error || !subs || subs.length === 0) {
    return NextResponse.json(
      { error: "No subscriptions found", details: error },
      { status: 404 },
    );
  }

  let sent = 0;
  const errors: string[] = [];

  for (const row of subs as SubscriptionRow[]) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh,
            auth: row.auth_key,
          },
        },
        JSON.stringify({
          title: "\uD83E\uDDEA Test push",
          body: "Push notifications are working!",
        }),
      );
      sent++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown";
      errors.push(msg);
    }
  }

  return NextResponse.json({ sent, errors });
}