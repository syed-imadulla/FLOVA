// Single Supabase browser client. Only the PUBLISHABLE (anon) key belongs here:
// it is safe in the browser because Row Level Security protects every table.
// NEVER put the service-role key or the Gemini key in any VITE_ variable.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

if (!url || !publishableKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY). " +
    "Copy .env.example to .env.local and configure the environment variables."
  );
}

export const supabase = createClient(url, publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** Turns a Supabase error into one the UI can show truthfully. */
export function unwrap<T>(result: { data: T | null; error: { message: string } | null }, action: string): T {
  if (result.error) throw new Error(`${action} failed: ${result.error.message}`);
  if (result.data === null) throw new Error(`${action} returned no data`);
  return result.data;
}
