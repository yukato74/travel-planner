import { redirect } from 'next/navigation';
import { NewTripClient } from '@/components/trip/NewTripClient';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

export default async function NewTripPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/trip/new');
  }

  return <NewTripClient userId={user.id} />;
}
