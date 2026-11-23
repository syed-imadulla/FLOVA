// Auth service (owner: M1). Supabase Auth stores and checks credentials;
// FLOVA never stores passwords itself.
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export async function signUp(email: string, password: string, displayName?: string): Promise<User | null> {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: displayName ? { display_name: displayName } : undefined },
  });
  if (error) throw new Error(`Sign-up failed: ${error.message}`);
  // data.session is null when email confirmation is ON in the Supabase dashboard.
  return data.user;
}

export async function signIn(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login failed: ${error.message}`);
  return data.session;
}

export async function signOut(): Promise<void> {
  const { signOutAll } = await import("./socialAuth");
  await signOutAll();
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Session check failed: ${error.message}`);
  return data.session;
}

/** Subscribe to login/logout/token refresh. Returns an unsubscribe function (call it in a React effect cleanup). */
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}
