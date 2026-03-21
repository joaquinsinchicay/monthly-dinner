import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/utils";
import type { Database, Profile } from "@/types";

const INVITATION_COOKIE = "monthly-dinner-invite";

type SupabaseErrorLike = { message: string } | null;

type ProfileInsertTable = {
  upsert(values: Database["public"]["Tables"]["profiles"]["Insert"], options: { onConflict: string }): {
    select(columns: string): {
      single(): Promise<{ data: Profile | null; error: SupabaseErrorLike }>;
    };
  };
  select(columns: string): {
    eq(column: "id", value: string): {
      maybeSingle(): Promise<{ data: Profile | null; error: SupabaseErrorLike }>;
    };
  };
};

function profilePayload(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): Database["public"]["Tables"]["profiles"]["Insert"] {
  const metadata = user.user_metadata ?? {};

  return {
    id: user.id,
    email: user.email ?? "",
    full_name: typeof metadata.full_name === "string" ? metadata.full_name : typeof metadata.name === "string" ? metadata.name : null,
    avatar_url: typeof metadata.avatar_url === "string" ? metadata.avatar_url : typeof metadata.picture === "string" ? metadata.picture : null,
    display_name: typeof metadata.name === "string" ? metadata.name : typeof metadata.full_name === "string" ? metadata.full_name : null
  };
}

export async function ensureProfile(): Promise<{ profile: Profile | null; error: string | null }> {
  const supabase = createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { profile: null, error: userError?.message ?? "No active session." };
  }

  const user = userData.user;
  const profiles = supabase.from("profiles") as unknown as ProfileInsertTable;
  const { data: existingProfile, error: selectError } = await profiles
    .select("id, email, full_name, avatar_url, display_name, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    return { profile: null, error: selectError.message };
  }

  if (existingProfile) {
    return { profile: existingProfile, error: null };
  }

  const payload = profilePayload(user);
  const { data: insertedProfile, error: insertError } = await profiles
    .upsert(payload, { onConflict: "email" })
    .select("id, email, full_name, avatar_url, display_name, created_at, updated_at")
    .single();

  if (insertError) {
    return { profile: null, error: insertError.message };
  }

  return { profile: insertedProfile, error: null };
}

export async function signInWithGoogle(nextPath?: string): Promise<never> {
  const supabase = createSupabaseServerClient();
  const callbackUrl = new URL(absoluteUrl("/api/auth/callback"));

  if (nextPath) {
    callbackUrl.searchParams.set("next", nextPath);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        access_type: "offline",
        prompt: "consent"
      }
    }
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "No se pudo iniciar OAuth.")}`);
  }

  redirect(data.url);
}

export function storeInvitationToken(token: string): void {
  cookies().set({
    name: INVITATION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15
  });
}

export function readInvitationToken(): string | undefined {
  return cookies().get(INVITATION_COOKIE)?.value;
}

export function clearInvitationToken(): void {
  cookies().set({ name: INVITATION_COOKIE, value: "", path: "/", maxAge: 0 });
}
