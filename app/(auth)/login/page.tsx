import { redirect } from 'next/navigation';

import { LoginCard } from '@/app/(auth)/login/LoginCard';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { normalizeRedirectPath } from '@/lib/auth';
import type { AuthStatus } from '@/lib/auth-copy';

/** Server Component: validates whether an authenticated session already exists before rendering the login landing. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { redirect?: string; status?: AuthStatus };
}) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectTo = normalizeRedirectPath(searchParams?.redirect ?? null, '/dashboard');

  if (user) {
    redirect(redirectTo);
  }

  return <LoginCard redirectTo={redirectTo} status={searchParams?.status ?? null} />;
}
