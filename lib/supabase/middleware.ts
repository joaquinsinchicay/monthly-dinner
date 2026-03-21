import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { Database } from "@/types";
import { getSupabaseEnv } from "./config";

export function updateSession(request: NextRequest): Promise<{ response: NextResponse; userId: string | null }> {
  const { url, anonKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database, "public">(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value: "", ...options, maxAge: 0 });
      }
    }
  });

  return supabase.auth.getUser().then(({ data }) => ({ response, userId: data.user?.id ?? null }));
}
