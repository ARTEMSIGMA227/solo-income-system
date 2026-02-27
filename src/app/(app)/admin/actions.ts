'use server';

import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = ['samoilov.a4tem@mail.ru'];

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    throw new Error('Not admin');
  }
  return user;
}

export async function activateProAction(userId: string, days: number) {
  await requireAdmin();

  const service = await createServiceSupabaseClient();
  const proUntil = new Date();
  proUntil.setDate(proUntil.getDate() + days);

  const { error, count } = await service
    .from('profiles')
    .update({
      is_pro: true,
      pro_until: proUntil.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  return { success: true, pro_until: proUntil.toISOString() };
}

export async function deactivateProAction(userId: string) {
  await requireAdmin();

  const service = await createServiceSupabaseClient();
  const { error } = await service
    .from('profiles')
    .update({
      is_pro: false,
      pro_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  return { success: true };
}