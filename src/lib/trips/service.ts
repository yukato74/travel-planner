import { generateSharePassword } from '@/lib/share/access';
import { SupabaseDBClient } from '@/lib/supabase/types';
import { Database } from '@/lib/types/db';
import { CreateTripInput, TripSummary, UpdateTripInput } from '@/lib/types/trip';

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

function mapTrip(row: Database['public']['Tables']['trips']['Row']): TripSummary {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    sharePassword: row.share_password,
    isShareProtected: row.is_share_protected,
  };
}

export function buildTripShareUrl(id: string): string {
  const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const base = (runtimeOrigin || APP_BASE_URL).replace(/\/$/, '');
  return `${base}/trip/${id}`;
}

export type ItineraryOrderByDay = Record<string, string[]>;

function parseItineraryOrder(value: unknown): ItineraryOrderByDay {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const entries = Object.entries(value as Record<string, unknown>);
  const parsed: ItineraryOrderByDay = {};
  for (const [day, ids] of entries) {
    if (!Array.isArray(ids)) {
      continue;
    }
    parsed[day] = ids.filter((id): id is string => typeof id === 'string');
  }
  return parsed;
}

export async function getTripItineraryOrder(
  supabase: SupabaseDBClient,
  tripId: string,
): Promise<{ data: ItineraryOrderByDay; error: string | null }> {
  const { data, error } = await supabase.from('trips').select('itinerary_order').eq('id', tripId).single();
  if (error) {
    return { data: {}, error: `Failed to fetch itinerary order: ${error.message}` };
  }
  return { data: parseItineraryOrder(data?.itinerary_order), error: null };
}

export async function updateTripItineraryOrder(
  supabase: SupabaseDBClient,
  tripId: string,
  orderByDay: ItineraryOrderByDay,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('trips').update({ itinerary_order: orderByDay }).eq('id', tripId);
  if (error) {
    return { error: `Failed to save itinerary order: ${error.message}` };
  }
  return { error: null };
}

export async function listTrips(
  supabase: SupabaseDBClient,
  userId: string,
): Promise<{ data: TripSummary[]; error: string | null }> {
  const [ownerTripsResult, membershipResult] = await Promise.all([
    supabase
      .from('trips')
      .select('*')
      .eq('owner_user_id', userId)
      .order('start_date', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase.from('trip_members').select('trip_id').eq('user_id', userId),
  ]);

  if (ownerTripsResult.error) {
    return { data: [], error: `Failed to fetch trips: ${ownerTripsResult.error.message}` };
  }

  if (membershipResult.error) {
    return { data: [], error: `Failed to fetch shared trips: ${membershipResult.error.message}` };
  }

  const memberTripIds = Array.from(new Set((membershipResult.data ?? []).map((row: { trip_id: string }) => row.trip_id).filter(Boolean)));
  if (memberTripIds.length === 0) {
    return { data: ownerTripsResult.data.map(mapTrip), error: null };
  }

  const { data: invitedTrips, error: invitedTripsError } = await supabase
    .from('trips')
    .select('*')
    .in('id', memberTripIds)
    .order('start_date', { ascending: true })
    .order('created_at', { ascending: false });

  if (invitedTripsError) {
    return { data: [], error: `Failed to fetch shared trips: ${invitedTripsError.message}` };
  }

  const merged = [...ownerTripsResult.data, ...invitedTrips];
  const uniqueById = new Map<string, Database['public']['Tables']['trips']['Row']>();
  for (const trip of merged) {
    uniqueById.set(trip.id, trip);
  }
  const data = Array.from(uniqueById.values()).sort((a, b) => {
    if (a.start_date === b.start_date) {
      return b.created_at.localeCompare(a.created_at);
    }
    return a.start_date.localeCompare(b.start_date);
  });

  return { data: data.map(mapTrip), error: null };
}

export async function getTripById(
  supabase: SupabaseDBClient,
  tripId: string,
): Promise<{ data: TripSummary | null; error: string | null }> {
  const { data, error } = await supabase.from('trips').select('*').eq('id', tripId).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: null, error: null };
    }
    return { data: null, error: `Failed to fetch trip: ${error.message}` };
  }

  return { data: mapTrip(data), error: null };
}

export async function createTrip(
  supabase: SupabaseDBClient,
  input: CreateTripInput,
): Promise<{ data: TripSummary | null; error: string | null }> {
  const { data, error } = await supabase
    .from('trips')
    .insert({
      owner_user_id: input.ownerUserId,
      title: input.title,
      start_date: input.startDate,
      end_date: input.endDate,
      is_share_protected: input.isShareProtected,
      share_password: generateSharePassword(),
    })
    .select('*')
    .single();

  if (error) {
    return { data: null, error: `Failed to create trip: ${error.message}` };
  }

  return { data: mapTrip(data), error: null };
}

export async function updateTrip(
  supabase: SupabaseDBClient,
  input: UpdateTripInput,
): Promise<{ data: TripSummary | null; error: string | null }> {
  const { data, error } = await supabase
    .from('trips')
    .update({
      title: input.title,
      start_date: input.startDate,
      end_date: input.endDate,
      is_share_protected: input.isShareProtected,
      share_password: input.sharePassword,
    })
    .eq('id', input.id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: `Failed to update trip: ${error.message}` };
  }

  return { data: mapTrip(data), error: null };
}

export async function deleteTrip(
  supabase: SupabaseDBClient,
  tripId: string,
  userId: string,
): Promise<{ error: string | null }> {
  const { data: trip, error: tripError } = await supabase.from('trips').select('owner_user_id').eq('id', tripId).single();
  if (tripError) {
    return { error: `Failed to check trip owner: ${tripError.message}` };
  }
  if (!trip || trip.owner_user_id !== userId) {
    return { error: 'Only the trip owner can delete this trip.' };
  }

  const { error } = await supabase.from('trips').delete().eq('id', tripId);

  if (error) {
    return { error: `Failed to delete trip: ${error.message}` };
  }

  return { error: null };
}

export async function addTripMember(
  supabase: SupabaseDBClient,
  tripId: string,
  userId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('trip_members').upsert(
    {
      trip_id: tripId,
      user_id: userId,
    },
    { onConflict: 'trip_id,user_id' },
  );

  if (error) {
    return { error: `Failed to save shared trip: ${error.message}` };
  }

  return { error: null };
}

export async function isInvitedTripMember(
  supabase: SupabaseDBClient,
  tripId: string,
  userId: string,
): Promise<{ data: boolean; error: string | null }> {
  const { data, error } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return { data: false, error: `Failed to check trip membership: ${error.message}` };
  }

  return { data: Boolean(data), error: null };
}

export async function leaveTrip(
  supabase: SupabaseDBClient,
  tripId: string,
  userId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('trip_members').delete().eq('trip_id', tripId).eq('user_id', userId);

  if (error) {
    return { error: `Failed to leave trip: ${error.message}` };
  }

  return { error: null };
}
