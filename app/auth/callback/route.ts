import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  if (!code || error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const supabase = await createServerClient();
  // Supabase usa PKCE: aquí intercambiamos el `code` temporal del proveedor por una sesión persistida en cookies.
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.session) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
