import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/db';
import { CreatePlaceInput, Place, PlaceOrderUpdate, UpdatePlaceInput } from '@/lib/types/trip';

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

export async function addPlace(
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

export async function updatePlace(
  supabase: SupabaseClient<Database>,
  input: UpdatePlaceInput,
): Promise<{ data: Place | null; error: string | null }> {
  const { data, error } = await supabase
    .from('places')
    .update({
      visit_date: input.visitDate,
      name: input.name,
      address: input.address || null,
      memo: input.memo || null,
      sort_order: input.sortOrder,
    })
    .eq('id', input.id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: `場所の更新に失敗しました: ${error.message}` };
  }

  return { data: mapPlace(data), error: null };
}

export async function deletePlace(
  supabase: SupabaseClient<Database>,
  placeId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('places').delete().eq('id', placeId);

  if (error) {
    return { error: `場所の削除に失敗しました: ${error.message}` };
  }

  return { error: null };
}

export async function reorderPlaces(
  supabase: SupabaseClient<Database>,
  updates: PlaceOrderUpdate[],
): Promise<{ error: string | null }> {
  for (const update of updates) {
    const { error } = await supabase
      .from('places')
      .update({
        visit_date: update.visitDate,
        sort_order: update.sortOrder,
      })
      .eq('id', update.id);

    if (error) {
      return { error: `場所の並び順保存に失敗しました: ${error.message}` };
    }
  }

  return { error: null };
}
