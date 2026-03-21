import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import { getSupabaseBrowserClient } from './supabase';

const DEFAULT_POST_LOGIN_REDIRECT = '/dashboard';
const GENERIC_OAUTH_ERROR = 'oauth_error';

export type AuthResult =
  | { status: 'success'; redirectTo: string }
  | { status: 'cancelled'; redirectTo: '/login?status=oauth_cancelled' }
  | { status: 'error'; message: string };

/** Returns a safe in-app redirect target and preserves the navigation context for protected routes. */
export function normalizeRedirectPath(candidate: string | null, fallback = DEFAULT_POST_LOGIN_REDIRECT) {
  if (!candidate) return fallback;
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return fallback;
  if (candidate.startsWith('/auth/callback')) return fallback;
  return candidate;
}

/** Builds the OAuth callback URL carrying the protected destination and optional invite token. */
export function buildOAuthRedirectUrl(origin: string, nextPath?: string | null, inviteToken?: string | null) {
  const callbackUrl = new URL('/auth/callback', origin);
  callbackUrl.searchParams.set('redirect', normalizeRedirectPath(nextPath ?? null));
  if (inviteToken) {
    callbackUrl.searchParams.set('invite', inviteToken);
  }
  return callbackUrl.toString();
}

/** Starts Google OAuth for both registration and login and delegates profile provisioning to the callback route. */
export async function signInWithGoogle({
  origin,
  nextPath,
  inviteToken,
}: {
  origin: string;
  nextPath?: string | null;
  inviteToken?: string | null;
}) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: buildOAuthRedirectUrl(origin, nextPath, inviteToken),
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error || !data.url) {
    return { status: 'error' as const, message: GENERIC_OAUTH_ERROR };
  }

  return { status: 'redirect' as const, url: data.url };
}

/** Resolves the destination that the user should see immediately after OAuth completes. */
export function resolvePostLoginRedirect(params: URLSearchParams) {
  return normalizeRedirectPath(params.get('redirect'), DEFAULT_POST_LOGIN_REDIRECT);
}

/** Confirms the recovered session and redirects back to the intended protected page after browser-side recovery. */
export async function completeOAuthSignIn(
  params: URLSearchParams,
  router: Pick<AppRouterInstance, 'replace'>,
): Promise<AuthResult> {
  const errorCode = params.get('error_code');
  const errorDescription = params.get('error_description');

  if (errorCode === 'access_denied' || errorDescription?.toLowerCase().includes('cancel')) {
    router.replace('/login?status=oauth_cancelled');
    return { status: 'cancelled', redirectTo: '/login?status=oauth_cancelled' };
  }

  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: 'error', message: GENERIC_OAUTH_ERROR };
  }

  const redirectTo = resolvePostLoginRedirect(params);
  router.replace(redirectTo);
  return { status: 'success', redirectTo };
}
