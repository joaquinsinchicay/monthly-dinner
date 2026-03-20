import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { normalizeRedirectPath } from '@/lib/auth';
import { getSupabaseEnv } from '@/lib/env';

function buildRedirectUrl(request: NextRequest, pathname: string) {
  return new URL(pathname, request.url);
}

export async function GET(request: NextRequest) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const cookieStore = cookies();
  const code = request.nextUrl.searchParams.get('code');
  const errorCode = request.nextUrl.searchParams.get('error_code');
  const errorDescription = request.nextUrl.searchParams.get('error_description');
  const nextPath = normalizeRedirectPath(request.nextUrl.searchParams.get('next'), '/group/group-curated-table');

  if (errorCode === 'access_denied' || errorDescription?.toLowerCase().includes('cancel')) {
    return NextResponse.redirect(buildRedirectUrl(request, '/login'));
  }

  let response = NextResponse.redirect(buildRedirectUrl(request, nextPath));
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  if (!code) {
    return NextResponse.redirect(buildRedirectUrl(request, '/login'));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(buildRedirectUrl(request, '/login'));
  }

  return response;
}
