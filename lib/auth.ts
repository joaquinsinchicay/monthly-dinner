import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { getSupabaseBrowserClient } from './supabase';

const GENERIC_OAUTH_ERROR = 'No pudimos conectarte, intentá de nuevo';
const MISSING_PROFILE_ERROR = 'Tu cuenta se creó, pero no pudimos preparar tu perfil. Reintentá para continuar.';
const DEFAULT_POST_LOGIN_REDIRECT = '/group/group-curated-table';
const LEGACY_POST_LOGIN_REDIRECT = '/group/group-curated-table';

export type AuthResult =
  | { status: 'success'; redirectTo: string }
  | { status: 'cancelled'; redirectTo: '/login' }
  | { status: 'error'; message: string };

/** Returns a safe in-app redirect target and preserves the navigation context for protected routes. */
export function normalizeRedirectPath(candidate: string | null, fallback = DEFAULT_POST_LOGIN_REDIRECT) {
  if (!candidate) return fallback;
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return fallback;
  if (candidate.startsWith('/auth/callback')) return fallback;
  return candidate;
}

/** Builds the OAuth callback URL carrying the protected destination to restore after sign-in. */
export function buildOAuthRedirectUrl(origin: string, nextPath?: string | null) {
  const callbackUrl = new URL('/auth/callback', origin);
  callbackUrl.searchParams.set('next', normalizeRedirectPath(nextPath ?? null));
  return callbackUrl.toString();
}

/** Starts Google OAuth for both registration and login and leaves profile creation to Supabase Auth. */
export async function signInWithGoogle(origin: string, nextPath?: string | null) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: buildOAuthRedirectUrl(origin, nextPath),
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

/** Resolves the destination that the user should see immediately after OAuth completes. */
export function resolvePostLoginRedirect(params: URLSearchParams) {
  return normalizeRedirectPath(params.get('next'), LEGACY_POST_LOGIN_REDIRECT);
}

/** Confirms the recovered session and profile, then redirects back to the intended protected page. */
export async function completeOAuthSignIn(
  params: URLSearchParams,
  router: Pick<AppRouterInstance, 'replace'>,
): Promise<AuthResult> {
  const errorCode = params.get('error_code');
  const errorDescription = params.get('error_description');

  if (errorCode === 'access_denied' || errorDescription?.toLowerCase().includes('cancel')) {
    router.replace('/login');
    return { status: 'cancelled', redirectTo: '/login' };
  }

  const supabase = getSupabaseBrowserClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: 'error', message: GENERIC_OAUTH_ERROR };
  }

  const profile = await supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle();

  if (profile.error || !profile.data) {
    await supabase.auth.signOut();
    return { status: 'error', message: MISSING_PROFILE_ERROR };
  }

  const redirectTo = resolvePostLoginRedirect(params);
  router.replace(redirectTo);
  return { status: 'success', redirectTo };
}
