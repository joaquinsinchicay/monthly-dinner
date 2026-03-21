import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { normalizeRedirectPath } from '@/lib/auth';
import { getSupabaseEnv } from '@/lib/env';

const PROTECTED_PATH_PREFIXES = ['/dashboard', '/groups', '/group'];

/** Returns true when the requested pathname requires an authenticated Supabase session. */
export function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Creates the login redirect for expired or missing sessions while preserving navigation context. */
export function buildLoginRedirect(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set('redirect', normalizeRedirectPath(requestedPath));
  return loginUrl;
}

/** Protects authenticated routes and redirects login traffic based on the current session state. */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request: { headers: request.headers } });

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

  // If the user is already authenticated, keep the login entry points out of the happy path.
  if (pathname === '/' || pathname === '/login') {
    if (user) {
      const redirectTo = normalizeRedirectPath(request.nextUrl.searchParams.get('redirect'), '/dashboard');
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    return response;
  }

  // Allow public routes such as the invite landing and OAuth callback without auth gating.
  if (!isProtectedPath(pathname)) {
    return response;
  }

  // Missing or expired sessions are always sent back to login with the original destination preserved.
  if (!user) {
    return NextResponse.redirect(buildLoginRedirect(request));
  }

  return response;
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*', '/groups/:path*', '/group/:path*'],
};
