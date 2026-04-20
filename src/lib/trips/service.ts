import { trips } from '@/data/trips';
import { Trip } from '@/lib/types/trip';

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export function listTrips(): Trip[] {
  return trips;
}

export function findTripById(id: string): Trip | undefined {
  return trips.find((trip) => trip.id === id);
}

export function buildTripShareUrl(id: string): string {
  return `${APP_BASE_URL}/trip/${id}`;
}
