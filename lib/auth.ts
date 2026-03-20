import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const DEFAULT_POST_LOGIN_REDIRECT = '/dashboard';
const GENERIC_OAUTH_ERROR = 'Hubo un problema al conectar con Google. Reintentá para continuar.';
const MISSING_PROFILE_ERROR = 'Tu cuenta se autenticó, pero no pudimos preparar tu perfil. Reintentá para continuar.';

export type AuthResult =
  | { status: 'success'; redirectTo: string }
  | { status: 'cancelled'; redirectTo: '/login' }
  | { status: 'error'; message: string };

export function normalizeRedirectPath(candidate: string | null, fallback = DEFAULT_POST_LOGIN_REDIRECT) {
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//') || candidate.startsWith('/auth/callback')) {
    return fallback;
  }

  return candidate;
}

export function buildOAuthRedirectUrl(origin: string, nextPath?: string | null) {
  const callbackUrl = new URL('/auth/callback', origin);
  callbackUrl.searchParams.set('next', normalizeRedirectPath(nextPath ?? null));
  return callbackUrl.toString();
}

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

  if (error || !data.url) {
    return { status: 'error' as const, message: GENERIC_OAUTH_ERROR };
  }

  return { status: 'redirect' as const, url: data.url };
}

export async function completeOAuthSignIn(
  params: URLSearchParams,
  router: Pick<AppRouterInstance, 'replace'>,
): Promise<AuthResult> {
  const errorCode = params.get('error_code');
  const errorDescription = params.get('error_description');

  if (errorCode === 'access_denied' || errorDescription?.toLowerCase().includes('cancel')) {
    router.replace('/login?message=cancelled');
    return { status: 'cancelled', redirectTo: '/login' };
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

  const redirectTo = normalizeRedirectPath(params.get('next'));
  router.replace(redirectTo);
  return { status: 'success', redirectTo };
}
