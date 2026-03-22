"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/supabase/config";
import type { Database } from "@/types";

type ActionResult = { error: string } | void;
type SupabaseErrorLike = { message: string } | null;
type MembershipLookup = Pick<Database["public"]["Tables"]["members"]["Row"], "id">;
type CreatedGroup = Pick<Database["public"]["Tables"]["groups"]["Row"], "id">;

type MembersTable = {
  select(columns: string): {
    eq(column: "user_id", value: string): {
      limit(count: number): {
        maybeSingle(): Promise<{ data: MembershipLookup | null; error: SupabaseErrorLike }>;
      };
    };
  };
  insert(values: Database["public"]["Tables"]["members"]["Insert"]): Promise<{ data: { id: string } | null; error: SupabaseErrorLike }>;
};


function createActionSupabaseClient() {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient<Database, "public">(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      }
    }
  });
}

type GroupsTable = {
  insert(values: Database["public"]["Tables"]["groups"]["Insert"]): {
    select(columns: string): {
      single(): Promise<{ data: CreatedGroup | null; error: SupabaseErrorLike }>;
    };
  };
};

export async function createGroup(formData: FormData): Promise<ActionResult> {
  const supabase = createActionSupabaseClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  console.error('CREATE_GROUP_DEBUG user:', user?.id, 'error:', authError?.message);

  if (authError || !user) {
    return { error: "No autenticado" };
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
  const groups = supabase.from("groups") as unknown as GroupsTable;

  const { data: existingMembership, error: membershipError } = await members
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.error("groups.membership_lookup_error", membershipError.message);
    return { error: "No se pudo validar tu grupo actual. Intentalo de nuevo." };
  }

  if (existingMembership) {
    return { error: "Ya sos miembro de un grupo" };
  }

  const { data: createdGroup, error: groupError } = await groups
    .insert({ name, created_by: user.id })
    .select("id")
    .single();

  console.error("CREATE_GROUP_DEBUG group insert:", createdGroup, groupError?.message);

  if (groupError || !createdGroup) {
    console.error("groups.insert_group_error", groupError?.message ?? "missing group");
    return { error: "No se pudo crear el grupo. Intentalo de nuevo." };
  }

  const { data: memberData, error: memberError } = await members.insert({
    group_id: createdGroup.id,
    user_id: user.id,
    role: "admin"
  });

  console.error("CREATE_GROUP_DEBUG member insert:", memberData, memberError?.message);

  if (memberError) {
    console.error("groups.insert_member_error", memberError.message);
    return { error: "No se pudo crear la membresía administradora. Intentalo de nuevo." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
