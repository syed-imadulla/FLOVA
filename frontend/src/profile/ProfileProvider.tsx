import React, { createContext, useCallback, useEffect, useState } from "react";
import { useSession } from "../auth/useSession";
import { getMyProfile, updateMyProfile } from "../services/data";
import type { Profile, ProfileUpdate } from "../types/contracts";

export interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  save: (patch: ProfileUpdate) => Promise<Profile>;
}

export const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useSession();
  const userId = user?.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (authLoading) {
      return;
    }
    if (!userId) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }
    // Keep current profile visible during reload; only set loading true if no profile exists yet
    setProfile((current) => {
      if (!current) setLoading(true);
      return current;
    });
    setError(null);
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [userId, authLoading]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const save = useCallback(
    async (patch: ProfileUpdate): Promise<Profile> => {
      if (!userId) {
        throw new Error("Cannot save profile without an active session");
      }
      const updated = await updateMyProfile(userId, patch);
      setProfile(updated);
      return updated;
    },
    [userId]
  );

  const effectiveLoading = authLoading || loading || (Boolean(userId) && !profile && !error);

  return (
    <ProfileContext.Provider value={{ profile, loading: effectiveLoading, error, reload: fetchProfile, save }}>
      {children}
    </ProfileContext.Provider>
  );
}
