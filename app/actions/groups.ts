"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types";

type ActionResult = { error: string } | void;
type SupabaseErrorLike = { message: string } | null;
type MembershipLookup = Pick<Database["public"]["Tables"]["members"]["Row"], "id">;
type RpcResponse = { group_id: string; name: string };

type MembersTable = {
  select(columns: string): {
    eq(column: "user_id", value: string): {
      limit(count: number): {
        maybeSingle(): Promise<{ data: MembershipLookup | null; error: SupabaseErrorLike }>;
      };
    };
  };
};

type SupabaseWithRpc = ReturnType<typeof createSupabaseServerClient> & {
  rpc(fn: "create_group_with_admin", args: { group_name: string }): Promise<{ data: RpcResponse | null; error: SupabaseErrorLike }>;
};

export async function createGroup(formData: FormData): Promise<ActionResult> {
  const supabase = createSupabaseServerClient() as SupabaseWithRpc;
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { error: "Debes iniciar sesión para crear un grupo" };
  }

  const rawName = formData.get("name");
  const name = typeof rawName === "string" ? rawName.trim() : "";

  if (!name) {
    return { error: "El nombre del grupo es obligatorio" };
  }

  if (name.length > 60) {
    return { error: "El nombre del grupo no puede superar los 60 caracteres" };
  }

  const members = supabase.from("members") as unknown as MembersTable;
  const { data: existingMembership, error: membershipError } = await members
    .select("id")
    .eq("user_id", authData.user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.error("groups.membership_lookup_error", membershipError.message);
    return { error: "No se pudo validar tu grupo actual. Intentalo de nuevo." };
  }

  if (existingMembership) {
    return { error: "Ya sos miembro de un grupo" };
  }

  const { data, error } = await supabase.rpc("create_group_with_admin", { group_name: name });

  if (error || !data) {
    console.error("groups.create_group_error", error?.message ?? "missing data");
    return { error: "No se pudo crear el grupo. Intentalo de nuevo." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
