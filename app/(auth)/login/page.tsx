import { redirect } from "next/navigation";

import { LoginCard } from "@/components/auth/LoginCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginWithGoogle } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <form action={loginWithGoogle}>
          <LoginCard error={searchParams.error} next={searchParams.next} />
        </form>
      </div>
    </main>
  );
}
