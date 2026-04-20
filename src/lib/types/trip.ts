export type TripSummary = {
  id: string;
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
  title: string;
  startDate: string;
  endDate: string;
  isShareProtected: boolean;
};

export type CreatePlaceInput = {
  tripId: string;
  visitDate: string;
  name: string;
  address: string;
  memo: string;
  sortOrder: number;
};

export type CreateNoteInput = {
  tripId: string;
  title: string;
  content: string;
};
