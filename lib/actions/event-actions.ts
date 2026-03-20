'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { validateMonthlyEvent } from '@/lib/domain';
import { getSupabaseEnv } from '@/lib/env';

/** Validates the organizer event payload and demonstrates the required server-action Supabase client wiring. */
export async function saveMonthlyEventAction(formData: FormData) {
  const cookieStore = cookies();
  const { supabaseAnonKey, supabaseUrl } = getSupabaseEnv();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });

  void supabase;

  return validateMonthlyEvent({
    month: String(formData.get('month') ?? ''),
    eventDate: String(formData.get('eventDate') ?? ''),
    existingMonth: (formData.get('existingMonth') as string | null) ?? null,
  });
}
