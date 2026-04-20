export type ItineraryItem = {
  id: string;
  date: string;
  title: string;
  description: string;
};

export type FlightItem = {
  id: string;
  direction: 'outbound' | 'return';
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
};

export type HotelItem = {
  id: string;
  name: string;
  checkIn: string;
  checkOut: string;
  address: string;
};

export type PlaceItem = {
  id: string;
  name: string;
  area: string;
  memo?: string;
};

export type NoteItem = {
  id: string;
  content: string;
};

export type TripShareSettings = {
  enabled: boolean;
  requiresPassword: boolean;
  password?: string;
};

export type Trip = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  summary: string;
  share: TripShareSettings;
  itinerary: ItineraryItem[];
  flights: FlightItem[];
  hotels: HotelItem[];
  places: PlaceItem[];
  notes: NoteItem[];
};
