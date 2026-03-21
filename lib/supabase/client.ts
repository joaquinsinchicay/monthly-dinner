"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types";
import { getSupabaseEnv } from "./config";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createBrowserClient<Database, "public">(url, anonKey);
}
