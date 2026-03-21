import { NextResponse } from "next/server";

import { clearInvitationToken, ensureProfile, readInvitationToken } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  const redirectedFromInvite = readInvitationToken();

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
  }

  const ensured = await ensureProfile();
  if (ensured.error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(ensured.error)}`, request.url));
  }

  if (redirectedFromInvite) {
    clearInvitationToken();
    return NextResponse.redirect(new URL(`/join/${redirectedFromInvite}`, request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
