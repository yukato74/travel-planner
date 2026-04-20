import { TripSummary } from '@/lib/types/trip';

export function generateSharePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function requiresSharePassword(trip: TripSummary): boolean {
  return Boolean(trip.isShareProtected && trip.sharePassword);
}

export function verifySharePassword(trip: TripSummary, password: string): boolean {
  if (!requiresSharePassword(trip)) {
    return true;
  }

  return trip.sharePassword === password.trim().toUpperCase();
}

export function getTripAccessStorageKey(tripId: string): string {
  return `trip-access:${tripId}`;
}
