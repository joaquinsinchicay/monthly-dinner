import { redirect } from "next/navigation";

import { CreateGroupForm } from "@/components/group/CreateGroupForm";
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

export default async function NewGroupPage() {
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
      <CreateGroupForm />
    </main>
  );
}
