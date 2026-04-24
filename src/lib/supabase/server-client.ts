import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/types/db';

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot modify cookies. Middleware refreshes the
            // Supabase session and writes any updated cookies to the response.
          }
        },
      },
    },
  );
}
