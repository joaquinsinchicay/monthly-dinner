'use server';

import { redirect } from 'next/navigation';

import { createServerClient } from '@/lib/supabase/server';

/**
 * Inicia el flujo OAuth con Google.
 *
 * No inserta manualmente en `profiles`: Supabase crea `auth.users` y el trigger
 * `on_auth_user_created` replica los datos del usuario en `profiles`.
 */
export async function signInWithGoogle(): Promise<void> {
  const supabase = await createServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    redirect('/login?error=oauth_failed');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect('/login?error=oauth_failed');
  }

  redirect(data.url);
}
