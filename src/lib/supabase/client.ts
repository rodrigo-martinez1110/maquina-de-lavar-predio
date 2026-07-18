import { createClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { publicEnv } from "../public-env";

export function createBrowserSupabaseClient() {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
