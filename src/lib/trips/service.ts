import { SupabaseClient } from '@supabase/supabase-js';
import { generateSharePassword } from '@/lib/share/access';
import { Database } from '@/lib/types/db';
import { CreateTripInput, TripSummary, UpdateTripInput } from '@/lib/types/trip';

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function mapTrip(row: Database['public']['Tables']['trips']['Row']): TripSummary {
  return {
    id: row.id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    sharePassword: row.share_password,
    isShareProtected: row.is_share_protected,
  };
}

export function buildTripShareUrl(id: string): string {
  return `${APP_BASE_URL}/trip/${id}`;
}

export async function listTrips(
  supabase: SupabaseClient<Database>,
): Promise<{ data: TripSummary[]; error: string | null }> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('start_date', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: `旅行一覧の取得に失敗しました: ${error.message}` };
  }

  return { data: data.map(mapTrip), error: null };
}

export async function getTripById(
  supabase: SupabaseClient<Database>,
  tripId: string,
): Promise<{ data: TripSummary | null; error: string | null }> {
  const { data, error } = await supabase.from('trips').select('*').eq('id', tripId).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: null, error: null };
    }
    return { data: null, error: `旅行情報の取得に失敗しました: ${error.message}` };
  }

  return { data: mapTrip(data), error: null };
}

export async function createTrip(
  supabase: SupabaseClient<Database>,
  input: CreateTripInput,
): Promise<{ data: TripSummary | null; error: string | null }> {
  const { data, error } = await supabase
    .from('trips')
    .insert({
      title: input.title,
      start_date: input.startDate,
      end_date: input.endDate,
      is_share_protected: input.isShareProtected,
      share_password: generateSharePassword(),
    })
    .select('*')
    .single();

  if (error) {
    return { data: null, error: `旅行の作成に失敗しました: ${error.message}` };
  }

  return { data: mapTrip(data), error: null };
}

export async function updateTrip(
  supabase: SupabaseClient<Database>,
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
    return { data: null, error: `旅行情報の更新に失敗しました: ${error.message}` };
  }

  return { data: mapTrip(data), error: null };
}
