import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';
import { listTrips } from '@/lib/trips/service';

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/dashboard');
  }

  const tripResult = await listTrips(supabase, user.id);
  if (!tripResult.error && tripResult.data.length > 0) {
    const cookieStore = await cookies();
    const lastOpenedTripId = cookieStore.get('travel-planner-last-trip-id')?.value ?? null;
    const selectedTripId = lastOpenedTripId && tripResult.data.some((trip) => trip.id === lastOpenedTripId)
      ? lastOpenedTripId
      : tripResult.data[0].id;

    redirect(`/trip/${selectedTripId}`);
  }

  return <DashboardClient userId={user.id} />;
}
