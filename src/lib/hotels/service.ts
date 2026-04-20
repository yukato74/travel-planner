import { SupabaseDBClient } from '@/lib/supabase/types';
import { Database } from '@/lib/types/db';
import { CreateHotelInput, Hotel, UpdateHotelInput } from '@/lib/types/trip';

function mapHotel(row: Database['public']['Tables']['hotels']['Row']): Hotel {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    address: row.address ?? '',
    checkInDate: row.check_in_date,
    checkOutDate: row.check_out_date,
    memo: row.memo ?? '',
  };
}

export async function listHotelsByTripId(
  supabase: SupabaseDBClient,
  tripId: string,
): Promise<{ data: Hotel[]; error: string | null }> {
  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('trip_id', tripId)
    .order('check_in_date', { ascending: true });

  if (error) {
    return { data: [], error: `ホテル一覧の取得に失敗しました: ${error.message}` };
  }

  return { data: data.map(mapHotel), error: null };
}

export async function createHotel(
  supabase: SupabaseDBClient,
  input: CreateHotelInput,
): Promise<{ data: Hotel | null; error: string | null }> {
  const { data, error } = await supabase
    .from('hotels')
    .insert({
      trip_id: input.tripId,
      name: input.name,
      address: input.address || null,
      check_in_date: input.checkInDate,
      check_out_date: input.checkOutDate,
      memo: input.memo || null,
    })
    .select('*')
    .single();

  if (error) {
    return { data: null, error: `ホテルの追加に失敗しました: ${error.message}` };
  }

  return { data: mapHotel(data), error: null };
}

export async function updateHotel(
  supabase: SupabaseDBClient,
  input: UpdateHotelInput,
): Promise<{ data: Hotel | null; error: string | null }> {
  const { data, error } = await supabase
    .from('hotels')
    .update({
      name: input.name,
      address: input.address || null,
      check_in_date: input.checkInDate,
      check_out_date: input.checkOutDate,
      memo: input.memo || null,
    })
    .eq('id', input.id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: `ホテルの更新に失敗しました: ${error.message}` };
  }

  return { data: mapHotel(data), error: null };
}

export async function deleteHotel(
  supabase: SupabaseDBClient,
  hotelId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('hotels').delete().eq('id', hotelId);

  if (error) {
    return { error: `ホテルの削除に失敗しました: ${error.message}` };
  }

  return { error: null };
}
