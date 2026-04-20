import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/db';
import { CreatePlaceInput, Place } from '@/lib/types/trip';

function mapPlace(row: Database['public']['Tables']['places']['Row']): Place {
  return {
    id: row.id,
    tripId: row.trip_id,
    visitDate: row.visit_date,
    name: row.name,
    address: row.address ?? '',
    memo: row.memo ?? '',
    lat: row.lat,
    lng: row.lng,
    sortOrder: row.sort_order,
  };
}

export async function listPlacesByTripId(
  supabase: SupabaseClient<Database>,
  tripId: string,
): Promise<{ data: Place[]; error: string | null }> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('trip_id', tripId)
    .order('visit_date', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    return { data: [], error: `場所一覧の取得に失敗しました: ${error.message}` };
  }

  return { data: data.map(mapPlace), error: null };
}

export async function createPlace(
  supabase: SupabaseClient<Database>,
  input: CreatePlaceInput,
): Promise<{ data: Place | null; error: string | null }> {
  const { data, error } = await supabase
    .from('places')
    .insert({
      trip_id: input.tripId,
      visit_date: input.visitDate,
      name: input.name,
      address: input.address || null,
      memo: input.memo || null,
      sort_order: input.sortOrder,
      lat: null,
      lng: null,
    })
    .select('*')
    .single();

  if (error) {
    return { data: null, error: `場所の追加に失敗しました: ${error.message}` };
  }

  return { data: mapPlace(data), error: null };
}
