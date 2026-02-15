import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface SyncCompletion {
  offline_id: string;
  completion_date: string;
  count_done: number;
  notes: string | null;
  quest_id?: string | null;
  habit_id?: string | null;
}

interface SyncXPEvent {
  offline_id: string;
  event_type: string;
  xp_amount: number;
  description: string | null;
  event_date: string;
}

interface SyncGoldEvent {
  offline_id: string;
  amount: number;
  event_type: string;
  description: string | null;
  event_date: string;
}

interface SyncIncomeEvent {
  offline_id: string;
  amount: number;
  source: string;
  client_name?: string | null;
  description?: string | null;
  event_date: string;
}

interface SyncPayload {
  completions?: SyncCompletion[];
  xp_events?: SyncXPEvent[];
  gold_events?: SyncGoldEvent[];
  income_events?: SyncIncomeEvent[];
}

async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Route handler — ignore cookie set errors
          }
        },
      },
    },
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: SyncPayload = await request.json();
    const results = {
      completions: 0,
      xp_events: 0,
      gold_events: 0,
      income_events: 0,
      errors: [] as string[],
    };

    // Sync completions
    if (payload.completions && payload.completions.length > 0) {
      for (const c of payload.completions) {
        // Skip if already synced (check by offline_id)
        const { data: existing } = await supabase
          .from('completions')
          .select('id')
          .eq('user_id', user.id)
          .eq('offline_id', c.offline_id)
          .maybeSingle();

        if (existing) continue;

        const { error } = await supabase.from('completions').insert({
          user_id: user.id,
          completion_date: c.completion_date,
          count_done: c.count_done,
          notes: c.notes,
          quest_id: c.quest_id ?? null,
          habit_id: c.habit_id ?? null,
          synced: true,
          offline_id: c.offline_id,
        });

        if (error) {
          results.errors.push(`completion ${c.offline_id}: ${error.message}`);
        } else {
          results.completions++;
        }
      }
    }

    // Sync XP events
    if (payload.xp_events && payload.xp_events.length > 0) {
      const rows = payload.xp_events.map((e) => ({
        user_id: user.id,
        event_type: e.event_type,
        xp_amount: e.xp_amount,
        description: e.description,
        event_date: e.event_date,
      }));

      const { error } = await supabase.from('xp_events').insert(rows);
      if (error) {
        results.errors.push(`xp_events: ${error.message}`);
      } else {
        results.xp_events = rows.length;
      }
    }

    // Sync gold events
    if (payload.gold_events && payload.gold_events.length > 0) {
      const rows = payload.gold_events.map((e) => ({
        user_id: user.id,
        amount: e.amount,
        event_type: e.event_type,
        description: e.description,
        event_date: e.event_date,
      }));

      const { error } = await supabase.from('gold_events').insert(rows);
      if (error) {
        results.errors.push(`gold_events: ${error.message}`);
      } else {
        results.gold_events = rows.length;
      }
    }

    // Sync income events
    if (payload.income_events && payload.income_events.length > 0) {
      const rows = payload.income_events.map((e) => ({
        user_id: user.id,
        amount: e.amount,
        source: e.source,
        client_name: e.client_name ?? null,
        description: e.description ?? null,
        event_date: e.event_date,
      }));

      const { error } = await supabase.from('income_events').insert(rows);
      if (error) {
        results.errors.push(`income_events: ${error.message}`);
      } else {
        results.income_events = rows.length;
      }
    }

    return NextResponse.json({
      success: true,
      synced: results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Sync failed', details: message },
      { status: 500 },
    );
  }
}
