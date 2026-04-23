import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';
import { listTrips } from '@/lib/trips/service';

export default async function HomePage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/');
  }

  const tripResult = await listTrips(supabase, user.id);
  if (tripResult.error) {
    redirect('/trip/new');
  }

  if (tripResult.data.length === 0) {
    redirect('/trip/new');
  }

  const cookieStore = await cookies();
  const lastOpenedTripId = cookieStore.get('travel-planner-last-trip-id')?.value ?? null;
  const selectedTripId = lastOpenedTripId && tripResult.data.some((trip) => trip.id === lastOpenedTripId)
    ? lastOpenedTripId
    : tripResult.data[0].id;

  redirect(`/trip/${selectedTripId}`);
}
