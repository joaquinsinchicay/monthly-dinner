import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  return { url, anonKey };
}

export function createBrowserClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createSupabaseBrowserClient(url, anonKey);
}
