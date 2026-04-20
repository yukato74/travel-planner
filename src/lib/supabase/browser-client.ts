'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/types/db';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      client: null,
      error: 'Environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.',
    };
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return { client: browserClient, error: null };
}
