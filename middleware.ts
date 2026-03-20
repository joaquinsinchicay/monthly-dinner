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
  loginUrl.searchParams.set('next', normalizeRedirectPath(requestedPath));
  return loginUrl;
}

/** Protects authenticated group routes and restores the intended destination after re-login. */
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

  const { data: { user } } = await supabase.auth.getUser();

  if (pathname === '/' || pathname === '/login') {
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
  matcher: ['/', '/login', '/dashboard/:path*', '/groups/:path*', '/group/:path*'],
};
