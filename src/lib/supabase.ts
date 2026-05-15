import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type PicksClient = ReturnType<typeof makeClient>;

function makeClient() {
  return createClient(url!, anonKey!, {
    auth: { persistSession: false },
  });
}

let _publicClient: PicksClient | null = null;

/**
 * Anon-key Supabase client scoped to the `picks_daily` schema. Safe for server
 * components — Row-Level Security controls what rows it can see (only
 * published challenges whose date has arrived).
 */
export function getSupabasePublic(): PicksClient {
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env var",
    );
  }
  if (!_publicClient) _publicClient = makeClient();
  return _publicClient;
}
