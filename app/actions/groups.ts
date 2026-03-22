"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types"

export async function createGroup(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "No autenticado" }

  const name = (formData.get("name") as string)?.trim()
  if (!name) return { error: "El nombre del grupo es obligatorio" }
  if (name.length > 60) return { error: "Máximo 60 caracteres" }

  const { data: existing } = await supabase
    .schema("public")
    .from("members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)

  if (existing && existing.length > 0) return { error: "Ya sos miembro de un grupo" }

  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: group, error: groupError } = await adminClient
    .schema("public")
    .from("groups")
    .insert({ name, created_by: user.id })
    .select("id")
    .single()

  if (groupError || !group) {
    console.error("group insert error:", groupError?.message)
    return { error: "No se pudo crear el grupo. Intentalo de nuevo." }
  }

  const { error: memberError } = await adminClient
    .schema("public")
    .from("members")
    .insert({ group_id: group.id, user_id: user.id, role: "admin" })

  if (memberError) {
    console.error("member insert error:", memberError.message)
    return { error: "No se pudo crear la membresía. Intentalo de nuevo." }
  }

  revalidatePath("/dashboard")
  redirect("/dashboard")
}
