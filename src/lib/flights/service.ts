import { SupabaseDBClient } from '@/lib/supabase/types';
import { Database } from '@/lib/types/db';
import { CreateFlightInput, Flight, UpdateFlightInput } from '@/lib/types/trip';

function mapFlight(row: Database['public']['Tables']['flights']['Row']): Flight {
  return {
    id: row.id,
    tripId: row.trip_id,
    airline: row.airline,
    flightNumber: row.flight_number,
    departureAirport: row.departure_airport,
    arrivalAirport: row.arrival_airport,
    departureTime: row.departure_time,
    arrivalTime: row.arrival_time,
    memo: row.memo ?? '',
  };
}

export async function listFlightsByTripId(
  supabase: SupabaseDBClient,
  tripId: string,
): Promise<{ data: Flight[]; error: string | null }> {
  const { data, error } = await supabase
    .from('flights')
    .select('*')
    .eq('trip_id', tripId)
    .order('departure_time', { ascending: true });

  if (error) {
    return { data: [], error: `Failed to fetch flights: ${error.message}` };
  }

  return { data: data.map(mapFlight), error: null };
}

export async function createFlight(
  supabase: SupabaseDBClient,
  input: CreateFlightInput,
): Promise<{ data: Flight | null; error: string | null }> {
  const { data, error } = await supabase
    .from('flights')
    .insert({
      trip_id: input.tripId,
      airline: input.airline,
      flight_number: input.flightNumber,
      departure_airport: input.departureAirport,
      arrival_airport: input.arrivalAirport,
      departure_time: input.departureTime,
      arrival_time: input.arrivalTime,
      memo: input.memo || null,
    })
    .select('*')
    .single();

  if (error) {
    return { data: null, error: `Failed to create flight: ${error.message}` };
  }

  return { data: mapFlight(data), error: null };
}

export async function updateFlight(
  supabase: SupabaseDBClient,
  input: UpdateFlightInput,
): Promise<{ data: Flight | null; error: string | null }> {
  const { data, error } = await supabase
    .from('flights')
    .update({
      airline: input.airline,
      flight_number: input.flightNumber,
      departure_airport: input.departureAirport,
      arrival_airport: input.arrivalAirport,
      departure_time: input.departureTime,
      arrival_time: input.arrivalTime,
      memo: input.memo || null,
    })
    .eq('id', input.id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: `Failed to update flight: ${error.message}` };
  }

  return { data: mapFlight(data), error: null };
}

export async function deleteFlight(
  supabase: SupabaseDBClient,
  flightId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('flights').delete().eq('id', flightId);

  if (error) {
    return { error: `Failed to delete flight: ${error.message}` };
  }

  return { error: null };
}
