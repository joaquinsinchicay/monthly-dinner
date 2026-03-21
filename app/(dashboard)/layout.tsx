import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Protege las rutas del route group `(dashboard)` que todavía no pasan por el matcher del middleware.
 */
export default async function DashboardGroupLayout({ children }: { children: ReactNode }) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/events');
  }

  return children;
}
