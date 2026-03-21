"use server";

import { signInWithGoogle } from "@/lib/auth";

export async function loginWithGoogle(formData: FormData): Promise<void> {
  const next = formData.get("next");
  await signInWithGoogle(typeof next === "string" && next ? next : undefined);
}
