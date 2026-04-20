import { Trip } from '@/lib/types/trip';

export function generateSharePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function requiresSharePassword(trip: Trip): boolean {
  return Boolean(trip.share.enabled && trip.share.requiresPassword && trip.share.password);
}

export function verifySharePassword(trip: Trip, password: string): boolean {
  if (!requiresSharePassword(trip)) {
    return true;
  }

  return trip.share.password === password.trim().toUpperCase();
}

export function getTripAccessStorageKey(tripId: string): string {
  return `trip-access:${tripId}`;
}
