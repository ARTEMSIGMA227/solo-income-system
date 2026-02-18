// src/app/api/cron/notify/route.ts
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

interface SubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  streak_current: number;
  timezone: string | null;
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
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    hour12: false,
  });
  return parseInt(formatter.format(new Date()), 10);
}

function getMessageForHour(
  hour: number,
  name: string,
  streak: number,
): { title: string; body: string } | null {
  if (hour === 10) {
    return {
      title: "\uD83C\uDF05 Morning quest",
      body: `${name}, start your day with a quest! Streak: ${streak} \uD83D\uDD25`,
    };
  }
  if (hour === 18) {
    return {
      title: "\u26A1 Evening boost",
      body: `${name}, don't forget to close your quests!`,
    };
  }
  if (hour === 21) {
    return {
      title: "\uD83C\uDF19 Last chance",
      body: `${name}, time is running out \u2014 don't lose streak ${streak}!`,
    };
  }
  return null;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: subscriptions, error: subError } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth_key");

  if (subError || !subscriptions) {
    return NextResponse.json(
      { error: "Failed to fetch subscriptions", details: subError },
      { status: 500 },
    );
  }

  const typedSubs = subscriptions as SubscriptionRow[];
  const userIds = [...new Set(typedSubs.map((s) => s.user_id))];

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, streak_current, timezone")
    .in("id", userIds);

  const profileMap = new Map<string, ProfileRow>();
  if (profiles) {
    for (const p of profiles as ProfileRow[]) {
      profileMap.set(p.id, p);
    }
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of typedSubs) {
    const profile = profileMap.get(row.user_id);
    const tz = profile?.timezone ?? "Europe/Berlin";
    const currentHour = getHourInTimezone(tz);
    const name = profile?.display_name ?? "Hunter";
    const streak = profile?.streak_current ?? 0;

    const message = getMessageForHour(currentHour, name, streak);
    if (!message) {
      skipped++;
      continue;
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh,
            auth: row.auth_key,
          },
        },
        JSON.stringify(message),
      );
      sent++;
    } catch (err: unknown) {
      failed++;
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errors.push(`User ${row.user_id}: ${errorMessage}`);

      if (isWebPushError(err) && (err.statusCode === 410 || err.statusCode === 404)) {
        await supabaseAdmin
          .from("push_subscriptions")
          .delete()
          .eq("id", row.id);
      }
    }
  }

  return NextResponse.json({ sent, skipped, failed, errors });
}