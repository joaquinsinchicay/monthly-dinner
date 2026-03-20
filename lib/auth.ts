import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { getSupabaseBrowserClient } from './supabase';

const GENERIC_OAUTH_ERROR = 'No pudimos conectarte, intentá de nuevo';
const MISSING_PROFILE_ERROR = 'Tu cuenta se creó, pero no pudimos preparar tu perfil. Reintentá para continuar.';

export type AuthResult =
  | { status: 'success'; redirectTo: '/groups' }
  | { status: 'cancelled'; redirectTo: '/' }
  | { status: 'error'; message: string };

/**
 * Starts the Google OAuth flow and delegates profile creation to Supabase Auth.
 * The frontend never inserts into public.profiles directly; it only redirects to
 * the provider and later verifies that the auth trigger created the profile.
 */
export async function signInWithGoogle(origin: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });
  if (error) {
    return { status: 'error' as const, message: GENERIC_OAUTH_ERROR };
  }
  return { status: 'redirect' as const, url: data.url };
}

/**
 * Verifies the active Supabase session after OAuth redirect.
 * Supabase PKCE exchanges the code automatically — this function
 * only reads the resulting session and confirms the profile exists.
 */
export async function completeOAuthSignIn(
  params: URLSearchParams,
  router: Pick<AppRouterInstance, 'replace'>,
): Promise<AuthResult> {
  const errorCode = params.get('error_code');
  const errorDescription = params.get('error_description');

  if (errorCode === 'access_denied' || errorDescription?.toLowerCase().includes('cancel')) {
    router.replace('/');
    return { status: 'cancelled', redirectTo: '/' };
  }

  const supabase = getSupabaseBrowserClient();

  // Supabase PKCE ya intercambió el código — solo leemos la sesión resultante
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: 'error', message: GENERIC_OAUTH_ERROR };
  }

  const profile = await supabase
    .from('profiles')
    .select('id')
    .eq('id', session.user.id)
    .maybeSingle();

  if (profile.error || !profile.data) {
    await supabase.auth.signOut();
    return { status: 'error', message: MISSING_PROFILE_ERROR };
  }

  router.replace('/groups');
  return { status: 'success', redirectTo: '/groups' };
}
