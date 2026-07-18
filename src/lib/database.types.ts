export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
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
