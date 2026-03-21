import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { normalizeRedirectPath } from '@/lib/auth';
import { getSupabaseEnv } from '@/lib/env';
import { validateInviteToken } from '@/lib/invite';

function buildRedirectUrl(request: NextRequest, pathname: string) {
  return new URL(pathname, request.url);
}

async function ensureProfileAndMembership(
  supabase: ReturnType<typeof createServerClient>,
  inviteToken: string | null,
  request: NextRequest,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(buildRedirectUrl(request, '/login?status=oauth_error'));
  }

  const profilePayload = {
    id: user.id,
    full_name: user.user_metadata.full_name ?? user.user_metadata.name ?? user.email ?? user.id,
    email: user.email ?? '',
    avatar_url: user.user_metadata.avatar_url ?? null,
  };

  const profileResult = await (supabase.from('profiles') as any).upsert(profilePayload, { onConflict: 'id' });
  if (profileResult.error) {
    await supabase.auth.signOut();
    return NextResponse.redirect(buildRedirectUrl(request, '/login?status=oauth_error'));
  }

  if (inviteToken) {
    const inviteResult = await validateInviteToken(supabase, inviteToken, user);
    if (inviteResult.status === 'expired') {
      return NextResponse.redirect(buildRedirectUrl(request, `/invite/${inviteToken}`));
    }

    const memberInsert = await (supabase.from('members') as any).upsert(
      {
        group_id: inviteResult.group.id,
        profile_id: user.id,
        role: 'member',
      },
      { onConflict: 'group_id,profile_id', ignoreDuplicates: true },
    );

    if (memberInsert.error && memberInsert.error.code !== '23505') {
      return NextResponse.redirect(buildRedirectUrl(request, '/dashboard?status=already_member'));
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const cookieStore = cookies();
  const code = request.nextUrl.searchParams.get('code');
  const errorCode = request.nextUrl.searchParams.get('error_code');
  const errorDescription = request.nextUrl.searchParams.get('error_description');
  const redirectPath = normalizeRedirectPath(request.nextUrl.searchParams.get('redirect'), '/dashboard');
  const inviteToken = request.nextUrl.searchParams.get('invite');

  if (errorCode === 'access_denied' || errorDescription?.toLowerCase().includes('cancel')) {
    return NextResponse.redirect(buildRedirectUrl(request, '/login?status=oauth_cancelled'));
  }

  let response = NextResponse.redirect(buildRedirectUrl(request, redirectPath));
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
    return NextResponse.redirect(buildRedirectUrl(request, '/login?status=oauth_error'));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(buildRedirectUrl(request, '/login?status=oauth_error'));
  }

  const sideEffectRedirect = await ensureProfileAndMembership(supabase, inviteToken, request);
  if (sideEffectRedirect) {
    return sideEffectRedirect;
  }

  return response;
}
