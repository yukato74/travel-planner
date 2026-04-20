export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      trips: {
        Row: {
          id: string;
          title: string;
          start_date: string;
          end_date: string;
          share_password: string;
          is_share_protected: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          start_date: string;
          end_date: string;
          share_password: string;
          is_share_protected?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          start_date?: string;
          end_date?: string;
          share_password?: string;
          is_share_protected?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      places: {
        Row: {
          id: string;
          trip_id: string;
          visit_date: string;
          name: string;
          address: string | null;
          memo: string | null;
          lat: number | null;
          lng: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          visit_date: string;
          name: string;
          address?: string | null;
          memo?: string | null;
          lat?: number | null;
          lng?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          visit_date?: string;
          name?: string;
          address?: string | null;
          memo?: string | null;
          lat?: number | null;
          lng?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'places_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      flights: {
        Row: {
          id: string;
          trip_id: string;
          airline: string;
          flight_number: string;
          departure_airport: string;
          arrival_airport: string;
          departure_time: string;
          arrival_time: string;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          airline: string;
          flight_number: string;
          departure_airport: string;
          arrival_airport: string;
          departure_time: string;
          arrival_time: string;
          memo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          airline?: string;
          flight_number?: string;
          departure_airport?: string;
          arrival_airport?: string;
          departure_time?: string;
          arrival_time?: string;
          memo?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'flights_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      hotels: {
        Row: {
          id: string;
          trip_id: string;
          name: string;
          address: string | null;
          check_in_date: string;
          check_out_date: string;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          name: string;
          address?: string | null;
          check_in_date: string;
          check_out_date: string;
          memo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          name?: string;
          address?: string | null;
          check_in_date?: string;
          check_out_date?: string;
          memo?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'hotels_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      notes: {
        Row: {
          id: string;
          trip_id: string;
          title: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          title: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          title?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
