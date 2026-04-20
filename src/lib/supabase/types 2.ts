import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/types/db';

export type SupabaseDBClient = ReturnType<typeof createBrowserClient<Database>>;
