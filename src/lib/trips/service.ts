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
  ownerUserId: string,
): Promise<{ data: TripSummary[]; error: string | null }> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .order('start_date', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: `Failed to fetch trips: ${error.message}` };
  }

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
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('trips').delete().eq('id', tripId);

  if (error) {
    return { error: `Failed to delete trip: ${error.message}` };
  }

  return { error: null };
}
