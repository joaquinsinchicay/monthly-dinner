import Link from "next/link";
import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types";

type MembershipLookup = Pick<Database["public"]["Tables"]["members"]["Row"], "id">;
type MembersTable = {
  select(columns: string): {
    eq(column: "user_id", value: string): {
      limit(count: number): {
        maybeSingle(): Promise<{ data: MembershipLookup | null }>;
      };
    };
  };
};

export default async function OnboardingPage() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const members = supabase.from("members") as unknown as MembersTable;
  const { data: membership } = await members.select("id").eq("user_id", userData.user.id).limit(1).maybeSingle();

  if (membership) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-low px-4 py-10">
      <Card className="w-full max-w-[420px] p-8 shadow-card-md">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Onboarding</p>
        <h1 className="mt-3 font-display text-4xl text-on-surface">Bienvenido a monthly-dinner</h1>
        <p className="mt-3 text-sm text-secondary">Para empezar, crea tu grupo o unite a uno existente.</p>

        <div className="mt-8 space-y-4">
          <Link
            href="/onboarding/new-group"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary-gradient px-5 py-3 text-sm font-semibold text-white shadow-card"
          >
            Crear un grupo nuevo
          </Link>

          <p className="text-center text-sm font-medium text-secondary">o</p>

          <Link
            href="/join"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-surface-high px-5 py-3 text-sm font-semibold text-on-surface"
          >
            Tengo un link de invitacion
          </Link>
        </div>

        <p className="mt-6 text-xs leading-5 text-secondary">
          Si creas el grupo, quedarás como admin y podrás invitar a otras personas. Si ya recibiste una invitación,
          continúa con el link para entrar directo a la cena mensual.
        </p>
      </Card>
    </main>
  );
}
