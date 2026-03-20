import { NextRequest, NextResponse } from 'next/server';

import { normalizeRedirectPath } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Builds an absolute redirect URL for the OAuth callback outcomes while keeping
 * messaging in query params limited to controlled in-app values.
 */
function buildRedirectUrl(request: NextRequest, pathname: string, params?: Record<string, string>) {
  const url = new URL(pathname, request.url);

  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  return url;
}

/**
 * Completes the Google OAuth redirect returned by Supabase Auth.
 * It exchanges the authorization code for a session cookie and then
 * sends the user to the protected dashboard or back to login gracefully.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const errorCode = request.nextUrl.searchParams.get('error_code');
  const errorDescription = request.nextUrl.searchParams.get('error_description');
  const nextPath = normalizeRedirectPath(request.nextUrl.searchParams.get('next'));

  if (errorCode === 'access_denied' || errorDescription?.toLowerCase().includes('cancel')) {
    return NextResponse.redirect(buildRedirectUrl(request, '/login', { message: 'cancelled' }));
  }

  if (!code) {
    return NextResponse.redirect(buildRedirectUrl(request, '/login', { error: 'oauth_failed' }));
  }

  const response = NextResponse.redirect(buildRedirectUrl(request, nextPath));

  /**
   * The server client writes the auth cookies produced by the code exchange
   * so middleware and server components can immediately reuse the session.
   */
  const supabase = createSupabaseServerClient(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(buildRedirectUrl(request, '/login', { error: 'oauth_failed' }));
  }

  return response;
}
