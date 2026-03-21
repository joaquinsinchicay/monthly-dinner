"use client";

import { createBrowserClient } from "@supabase/ssr";

import { Button } from "@/components/ui/button";

export function LoginButton({ next }: { next?: string }) {
  async function handleLogin() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const redirectUrl = new URL(`${window.location.origin}/api/auth/callback`);

    if (next) {
      redirectUrl.searchParams.set("next", next);
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl.toString()
      }
    });
  }

  return (
    <Button type="button" className="w-full bg-primary-gradient" onClick={() => { void handleLogin(); }}>
      Ingresar con Google
    </Button>
  );
}
