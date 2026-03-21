import { NextResponse } from "next/server";

import { clearInvitationToken, ensureProfile, readInvitationToken } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types";

type MembershipLookup = Pick<Database["public"]["Tables"]["members"]["Row"], "id">;
type MembersTable = {
  select(columns: string): {
    eq(column: "user_id", value: string): {
      limit(count: number): {
        maybeSingle(): Promise<{ data: MembershipLookup | null; error: { message: string } | null }>;
      };
    };
  };
};

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

  if (!ensured.profile) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  const members = supabase.from("members") as unknown as MembersTable;
  const { data: membership } = await members.select("id").eq("user_id", ensured.profile.id).limit(1).maybeSingle();

  return NextResponse.redirect(new URL(membership ? next : "/onboarding", request.url));
}
