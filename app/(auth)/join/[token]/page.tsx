import Link from "next/link";
import { redirect } from "next/navigation";

import { clearInvitationToken, ensureProfile, storeInvitationToken } from "@/lib/auth";
import { isInvitationExpired } from "@/lib/invitations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types";

function InvalidInvitationState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-surface-lowest p-8 shadow-card-md">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-error">Invitación</p>
        <h1 className="mt-3 font-display text-3xl text-on-surface">Este link de invitación no es válido o ya expiró</h1>
        <p className="mt-3 text-sm text-secondary">Pídele al administrador del grupo que te comparta un nuevo enlace de acceso.</p>
        <Link href="mailto:admin@example.com" className="mt-6 inline-flex rounded-full bg-surface-high px-5 py-3 text-sm font-semibold text-on-surface">Contactar al administrador</Link>
      </section>
    </main>
  );
}

type InvitationLookup = Pick<Database["public"]["Tables"]["invitation_links"]["Row"], "id" | "group_id" | "expires_at" | "token">;
type MemberInsert = Database["public"]["Tables"]["members"]["Insert"];
type SupabaseErrorLike = { message: string } | null;

type InvitationTable = {
  select(columns: string): {
    eq(column: "token", value: string): {
      maybeSingle(): Promise<{ data: InvitationLookup | null; error: SupabaseErrorLike }>;
    };
  };
};

type MembersTable = {
  select(columns: string): {
    eq(column: "group_id", value: string): {
      eq(column: "user_id", value: string): {
        maybeSingle(): Promise<{ data: { id: string } | null; error: SupabaseErrorLike }>;
      };
    };
  };
  insert(values: MemberInsert): Promise<{ error: SupabaseErrorLike }>;
};

export default async function JoinTokenPage({ params }: { params: { token: string } }) {
  const supabase = createSupabaseServerClient();
  const invitations = supabase.from("invitation_links") as unknown as InvitationTable;
  const members = supabase.from("members") as unknown as MembersTable;
  const { data: invitation } = await invitations
    .select("id, group_id, expires_at, token")
    .eq("token", params.token)
    .maybeSingle();

  if (!invitation || isInvitationExpired(invitation.expires_at)) {
    return <InvalidInvitationState />;
  }

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    storeInvitationToken(params.token);
    redirect(`/login?next=${encodeURIComponent(`/join/${params.token}`)}`);
  }

  const ensured = await ensureProfile();

  if (ensured.error || !ensured.profile) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <section className="max-w-md rounded-2xl bg-surface-lowest p-8 shadow-card-md text-sm text-error">
          {ensured.error ?? "No se pudo preparar tu perfil para unirte al grupo."}
        </section>
      </main>
    );
  }

  const { data: existingMember } = await members
    .select("id")
    .eq("group_id", invitation.group_id)
    .eq("user_id", ensured.profile.id)
    .maybeSingle();

  if (existingMember) {
    clearInvitationToken();
    redirect("/dashboard");
  }

  const { error } = await members.insert({
    group_id: invitation.group_id,
    user_id: ensured.profile.id,
    role: "member"
  });

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <section className="max-w-md rounded-2xl bg-error-cont p-8 text-sm text-error shadow-card-md">
          {error.message}
        </section>
      </main>
    );
  }

  clearInvitationToken();
  redirect("/dashboard");
}
