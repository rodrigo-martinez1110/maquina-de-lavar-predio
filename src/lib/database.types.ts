export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      apartments: {
        Row: {
          id: string;
          number: number;
          pin_hash: string;
          resident_count: number;
          manual_adjustment_minutes: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          number: number;
          pin_hash: string;
          resident_count?: number;
          manual_adjustment_minutes?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          number?: number;
          pin_hash?: string;
          resident_count?: number;
          manual_adjustment_minutes?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          id: string;
          apartment_id: string;
          kind: Database["public"]["Enums"]["reservation_kind"];
          status: Database["public"]["Enums"]["reservation_status"];
          starts_at: string;
          ends_at: string;
          estimated_minutes: number;
          actual_minutes: number | null;
          released_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          apartment_id: string;
          kind: Database["public"]["Enums"]["reservation_kind"];
          status?: Database["public"]["Enums"]["reservation_status"];
          starts_at: string;
          ends_at: string;
          estimated_minutes: number;
          actual_minutes?: number | null;
          released_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          apartment_id?: string;
          kind?: Database["public"]["Enums"]["reservation_kind"];
          status?: Database["public"]["Enums"]["reservation_status"];
          starts_at?: string;
          ends_at?: string;
          estimated_minutes?: number;
          actual_minutes?: number | null;
          released_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      weekly_balances: {
        Row: {
          id: string;
          apartment_id: string;
          week_start: string;
          quota_minutes: number;
          manual_adjustment_minutes: number;
          received_minutes: number;
          sent_minutes: number;
          reserved_minutes: number;
          refunded_minutes: number;
          penalty_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          apartment_id: string;
          week_start: string;
          quota_minutes: number;
          manual_adjustment_minutes?: number;
          received_minutes?: number;
          sent_minutes?: number;
          reserved_minutes?: number;
          refunded_minutes?: number;
          penalty_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          apartment_id?: string;
          week_start?: string;
          quota_minutes?: number;
          manual_adjustment_minutes?: number;
          received_minutes?: number;
          sent_minutes?: number;
          reserved_minutes?: number;
          refunded_minutes?: number;
          penalty_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_transfers: {
        Row: {
          id: string;
          apartment_id: string;
          kind: Database["public"]["Enums"]["transfer_kind"];
          status: Database["public"]["Enums"]["transfer_status"];
          week_start: string;
          total_minutes: number;
          remaining_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          apartment_id: string;
          kind: Database["public"]["Enums"]["transfer_kind"];
          status?: Database["public"]["Enums"]["transfer_status"];
          week_start: string;
          total_minutes: number;
          remaining_minutes: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          apartment_id?: string;
          kind?: Database["public"]["Enums"]["transfer_kind"];
          status?: Database["public"]["Enums"]["transfer_status"];
          week_start?: string;
          total_minutes?: number;
          remaining_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_transfer_acceptances: {
        Row: {
          id: string;
          transfer_id: string;
          from_apartment_id: string;
          to_apartment_id: string;
          minutes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          transfer_id: string;
          from_apartment_id: string;
          to_apartment_id: string;
          minutes: number;
          created_at?: string;
        };
        Update: {
          transfer_id?: string;
          from_apartment_id?: string;
          to_apartment_id?: string;
          minutes?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          apartment_id: string | null;
          kind: Database["public"]["Enums"]["notification_kind"];
          title: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          apartment_id?: string | null;
          kind: Database["public"]["Enums"]["notification_kind"];
          title: string;
          body: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          apartment_id?: string | null;
          kind?: Database["public"]["Enums"]["notification_kind"];
          title?: string;
          body?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_kind: Database["public"]["Enums"]["actor_kind"];
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_kind: Database["public"]["Enums"]["actor_kind"];
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_kind?: Database["public"]["Enums"]["actor_kind"];
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      reservation_status: "reserved" | "in_use" | "finished" | "released" | "cancelled" | "unregistered" | "late";
      reservation_kind: "wash" | "dry" | "wash_dry" | "custom";
      transfer_kind: "offer" | "request";
      transfer_status: "open" | "partially_filled" | "filled" | "cancelled";
      notification_kind: "late" | "transfer" | "admin_correction" | "impacted_reservation";
      actor_kind: "apartment" | "admin" | "system";
    };
  };
};
