'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAuthClient } from '../../firebase/firebaseClient';
import type { StudentProfile } from '@/types/profile';

const PROFILE_UPDATED_EVENT = 'student-profile-updated';

async function getIdToken(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const auth = getAuthClient();
      // If already restored, get token immediately
      if (auth.currentUser) {
        auth.currentUser.getIdToken().then(resolve).catch(() => resolve(null));
        return;
      }
      // Wait for auth state to restore (handles page reload / first mount)
      const unsub = auth.onAuthStateChanged((user) => {
        unsub();
        if (!user) { resolve(null); return; }
        user.getIdToken().then(resolve).catch(() => resolve(null));
      });
    } catch {
      resolve(null);
    }
  });
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/profile', { headers });
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<StudentProfile | null>;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
        setLoading(false);
      } else {
        void fetchProfile();
      }
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated as EventListener);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated as EventListener);
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<StudentProfile>) => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save profile');
      }
      const data = await res.json();
      setProfile(data.profile);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent<StudentProfile>(PROFILE_UPDATED_EVENT, { detail: data.profile }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return data.profile as StudentProfile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return { profile, loading, saving, saved, error, updateProfile, refetch: fetchProfile };
}
