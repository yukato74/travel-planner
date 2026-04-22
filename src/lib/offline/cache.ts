'use client';

import { Flight, Hotel, Note, Place, TripSummary } from '@/lib/types/trip';

const CACHE_PREFIX = 'travel-planner:offline:v1';

function buildKey(key: string): string {
  return `${CACHE_PREFIX}:${key}`;
}

function readCache<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const value = window.localStorage.getItem(buildKey(key));
    if (!value) {
      return null;
    }
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(buildKey(key), JSON.stringify(value));
  } catch {
    // Ignore storage errors to keep UI responsive.
  }
}

export function isLikelyOfflineError(message: string | null | undefined): boolean {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();
  return (
    normalized.includes('failed to fetch') ||
    normalized.includes('network') ||
    normalized.includes('fetch') ||
    normalized.includes('load failed') ||
    normalized.includes('internet')
  );
}

export function getCachedTripList(userId: string): TripSummary[] {
  return readCache<TripSummary[]>(`trips:${userId}`) ?? [];
}

export function setCachedTripList(userId: string, trips: TripSummary[]): void {
  writeCache(`trips:${userId}`, trips);
}

export function getCachedTrip(tripId: string): TripSummary | null {
  return readCache<TripSummary>(`trip:${tripId}`);
}

export function setCachedTrip(trip: TripSummary): void {
  writeCache(`trip:${trip.id}`, trip);
}

export function getCachedPlaces(tripId: string): Place[] {
  return readCache<Place[]>(`places:${tripId}`) ?? [];
}

export function setCachedPlaces(tripId: string, places: Place[]): void {
  writeCache(`places:${tripId}`, places);
}

export function getCachedFlights(tripId: string): Flight[] {
  return readCache<Flight[]>(`flights:${tripId}`) ?? [];
}

export function setCachedFlights(tripId: string, flights: Flight[]): void {
  writeCache(`flights:${tripId}`, flights);
}

export function getCachedHotels(tripId: string): Hotel[] {
  return readCache<Hotel[]>(`hotels:${tripId}`) ?? [];
}

export function setCachedHotels(tripId: string, hotels: Hotel[]): void {
  writeCache(`hotels:${tripId}`, hotels);
}

export function getCachedNotes(tripId: string): Note[] {
  return readCache<Note[]>(`notes:${tripId}`) ?? [];
}

export function setCachedNotes(tripId: string, notes: Note[]): void {
  writeCache(`notes:${tripId}`, notes);
}
