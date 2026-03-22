"use server";

import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSupabaseEnv } from "@/lib/supabase/config";
import type { Database } from "@/types";

type ActionResult = { error: string } | void;

function createActionSupabaseClient() {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      }
    }
  });
}

export async function createGroup(formData: FormData): Promise<ActionResult> {
  const supabase = createActionSupabaseClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  console.error("CREATE_GROUP_DEBUG user:", user?.id, "error:", userError?.message);

  if (userError || !user) {
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

  const { data: existingMembers, error: membershipError } = await supabase
    .schema("public")
    .from("members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (membershipError) {
    console.error("membership_lookup_error", membershipError.message);
    return { error: "No se pudo validar tu grupo actual. Intentalo de nuevo." };
  }

  if (existingMembers && existingMembers.length > 0) {
    return { error: "Ya sos miembro de un grupo" };
  }

  const { data: groupData, error: groupError } = await supabase
    .schema("public")
    .from("groups")
    .insert({ name, created_by: user.id })
    .select("id")
    .single();

  console.error("CREATE_GROUP_DEBUG group insert:", groupData, groupError?.message);

  if (groupError || !groupData) {
    console.error("groups.insert_group_error", groupError?.message ?? "missing group");
    return { error: "No se pudo crear el grupo. Intentalo de nuevo." };
  }

  const { data: memberData, error: memberError } = await supabase.schema("public").from("members").insert({
    group_id: groupData.id,
    user_id: user.id,
    role: "admin"
  }).select("id").single();

  console.error("CREATE_GROUP_DEBUG member insert:", memberData, memberError?.message);

  if (memberError) {
    console.error("groups.insert_member_error", memberError.message);
    return { error: "No se pudo crear la membresía administradora. Intentalo de nuevo." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
