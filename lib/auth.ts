import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { getSupabaseBrowserClient } from './supabase';

const GENERIC_OAUTH_ERROR = 'No pudimos conectarte, intentá de nuevo';
const MISSING_PROFILE_ERROR = 'Tu cuenta se creó, pero no pudimos preparar tu perfil. Reintentá para continuar.';
const DEFAULT_POST_LOGIN_REDIRECT = '/dashboard';
const LEGACY_POST_LOGIN_REDIRECT = '/groups';

export type AuthResult =
  | { status: 'success'; redirectTo: string }
  | { status: 'cancelled'; redirectTo: '/' }
  | { status: 'error'; message: string };

/**
 * Returns a safe in-app redirect target. It preserves the navigation context for
 * protected routes, rejects external URLs, and falls back to the dashboard when
 * the callback does not include a valid target.
 */
export function normalizeRedirectPath(
  candidate: string | null,
  fallback = DEFAULT_POST_LOGIN_REDIRECT,
) {
  if (!candidate) {
    return fallback;
  }

  if (!candidate.startsWith('/') || candidate.startsWith('//')) {
    return fallback;
  }

  if (candidate.startsWith('/auth/callback')) {
    return fallback;
  }

  return candidate;
}

/**
 * Builds the Supabase OAuth callback URL and carries the intended in-app target
 * so the user can resume the same navigation context after authentication.
 */
export function buildOAuthRedirectUrl(origin: string, nextPath?: string | null) {
  const callbackUrl = new URL('/auth/callback', origin);
  callbackUrl.searchParams.set('next', normalizeRedirectPath(nextPath ?? null));
  return callbackUrl.toString();
}

/**
 * Starts the Google OAuth flow and delegates profile creation to Supabase Auth.
 * The frontend never inserts into public.profiles directly; it only redirects to
 * the provider and later verifies that the auth trigger created the profile.
 */
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

/**
 * Resolves the post-login destination from the OAuth callback. The legacy
 * `/groups` target remains as a fallback for earlier US-01 callers that did not
 * send an explicit `next` parameter.
 */
export function resolvePostLoginRedirect(params: URLSearchParams) {
  return normalizeRedirectPath(params.get('next'), LEGACY_POST_LOGIN_REDIRECT);
}

/**
 * Verifies the active Supabase session after OAuth redirect, confirms the
 * profile exists, and redirects the user back to the intended protected screen.
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

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

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
