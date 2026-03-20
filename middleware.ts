import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getSupabaseEnv } from '@/lib/env';
import { normalizeRedirectPath } from '@/lib/auth';

const PROTECTED_PATH_PREFIXES = ['/dashboard', '/groups'];

/**
 * Returns true when the requested pathname requires an authenticated Supabase
 * session. Login and OAuth callback routes are intentionally excluded.
 */
export function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Creates the login redirect used when a token is missing or expired. The
 * original pathname and query string are preserved in `next` so the app can
 * restore navigation context after the user signs in again.
 */
export function buildLoginRedirect(request: NextRequest) {
  const loginUrl = new URL('/', request.url);
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set('next', normalizeRedirectPath(requestedPath));
  return loginUrl;
}

/**
 * Middleware protects application routes backed by Supabase Auth. When the
 * refresh token can no longer yield a valid user, the request is redirected to
 * the login screen without losing the original destination.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname === '/') {
    if (user) {
      const next = normalizeRedirectPath(request.nextUrl.searchParams.get('next'));
      return NextResponse.redirect(new URL(next, request.url));
    }

    return response;
  }

  if (!isProtectedPath(pathname)) {
    return response;
  }

  if (!user) {
    return NextResponse.redirect(buildLoginRedirect(request));
  }

  return response;
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/groups/:path*'],
};
