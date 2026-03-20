import { NextResponse, type NextRequest } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

const PUBLIC_PATHS = ['/login', '/auth/callback'];
const PROTECTED_PATHS = ['/dashboard'];

export function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path));
}

export function buildLoginRedirect(request: NextRequest) {
  const url = new URL('/login', request.url);
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.searchParams.set('next', requestedPath);
  return url;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Public routes stay accessible without a session so OAuth can begin and return safely.
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return response;
  }

  const supabase = createSupabaseServerClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The root route acts as a friendly alias: active sessions go to the dashboard, otherwise to /login.
  if (pathname === '/') {
    return NextResponse.redirect(new URL(user ? '/dashboard' : '/login', request.url));
  }

  // Protected routes share the same guard list so future MVP pages can be added without rewriting logic.
  if (isProtectedPath(pathname) && !user) {
    return NextResponse.redirect(buildLoginRedirect(request));
  }

  return response;
}

export const config = {
  matcher: ['/', '/login', '/auth/callback', '/dashboard/:path*'],
};
