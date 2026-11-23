// Single Supabase browser client. Only the PUBLISHABLE (anon) key belongs here:
// it is safe in the browser because Row Level Security protects every table.
// NEVER put the service-role key or the Gemini key in any VITE_ variable.
import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "https://msjzkylvafuwlkkujxpv.supabase.co";
const publishableKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zanpreWx2YWZ1d2xra3VqeHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNzY4MzksImV4cCI6MjExMDc1MjgzOX0.lvfYiD8jlW5ix0BVDqrbfeD37-XjUy_wNqP9_diRcoE";

if (!url || !publishableKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local and fill them in.");
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
