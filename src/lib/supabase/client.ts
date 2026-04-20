'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/db';

let browserClient: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient(): { client: SupabaseClient<Database> | null; error: string | null } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      client: null,
      error: '環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。',
    };
  }

  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return { client: browserClient, error: null };
}
