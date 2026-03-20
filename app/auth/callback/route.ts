import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseEnv } from '@/lib/env';
import { normalizeRedirectPath } from '@/lib/auth';

function buildRedirectUrl(request: NextRequest, pathname: string) {
  return new URL(pathname, request.url);
}

export async function GET(request: NextRequest) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const cookieStore = cookies();
  const code = request.nextUrl.searchParams.get('code');
  const errorCode = request.nextUrl.searchParams.get('error_code');
  const errorDescription = request.nextUrl.searchParams.get('error_description');
  const nextPath = normalizeRedirectPath(request.nextUrl.searchParams.get('next'), '/groups');

  if (errorCode === 'access_denied' || errorDescription?.toLowerCase().includes('cancel')) {
    return NextResponse.redirect(buildRedirectUrl(request, '/'));
  }

  let response = NextResponse.redirect(buildRedirectUrl(request, nextPath));

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  if (!code) {
    return NextResponse.redirect(buildRedirectUrl(request, '/'));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(buildRedirectUrl(request, '/'));
  }

  return response;
}
