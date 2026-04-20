export type TripSummary = {
  id: string;
  ownerUserId: string | null;
  title: string;
  startDate: string;
  endDate: string;
  sharePassword: string;
  isShareProtected: boolean;
};

export type Place = {
  id: string;
  tripId: string;
  visitDate: string;
  name: string;
  address: string;
  memo: string;
  lat: number | null;
  lng: number | null;
  sortOrder: number;
};

export type Flight = {
  id: string;
  tripId: string;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  memo: string;
};

export type Hotel = {
  id: string;
  tripId: string;
  name: string;
  address: string;
  checkInDate: string;
  checkOutDate: string;
  memo: string;
};

export type Note = {
  id: string;
  tripId: string;
  title: string;
  content: string;
};

export type TripDetail = {
  trip: TripSummary;
  places: Place[];
  notes: Note[];
};

export type CreateTripInput = {
  ownerUserId: string;
  title: string;
  startDate: string;
  endDate: string;
  isShareProtected: boolean;
};

export type UpdateTripInput = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  isShareProtected: boolean;
  sharePassword: string;
};

export type CreatePlaceInput = {
  tripId: string;
  visitDate: string;
  name: string;
  address: string;
  memo: string;
  sortOrder: number;
};

export type UpdatePlaceInput = {
  id: string;
  visitDate: string;
  name: string;
  address: string;
  memo: string;
  sortOrder: number;
};

export type PlaceOrderUpdate = {
  id: string;
  visitDate: string;
  sortOrder: number;
};

export type CreateFlightInput = {
  tripId: string;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  memo: string;
};

export type UpdateFlightInput = {
  id: string;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  memo: string;
};

export type CreateHotelInput = {
  tripId: string;
  name: string;
  address: string;
  checkInDate: string;
  checkOutDate: string;
  memo: string;
};

export type UpdateHotelInput = {
  id: string;
  name: string;
  address: string;
  checkInDate: string;
  checkOutDate: string;
  memo: string;
};

export type CreateNoteInput = {
  tripId: string;
  title: string;
  content: string;
};

export type UpdateNoteInput = {
  id: string;
  title: string;
  content: string;
};
