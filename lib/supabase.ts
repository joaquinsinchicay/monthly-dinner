import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseEnv } from './env';

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

/**
 * Returns a singleton Supabase browser client so the App Router reuses the same
 * auth instance across renders and OAuth redirects.
 */
export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}
