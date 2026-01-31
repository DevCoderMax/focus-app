import type { Profile } from '@/types';
import { generateId } from '@/utils/helpers';

const PROFILES_KEY = 'focus.profiles';
const ACTIVE_PROFILE_KEY = 'focus.activeProfile';

const DEFAULT_AVATARS = ['🟦', '🟩', '🟪', '🟨', '🟥', '🟧'];

export function getProfiles(): Profile[] {
  const stored = window.localStorage.getItem(PROFILES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as Profile[];
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: Profile[]): void {
  window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function getActiveProfileId(): string | null {
  return window.localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function setActiveProfileId(profileId: string): void {
  window.localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
}

export function createProfile(name: string, avatar?: string): Profile {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name,
    avatar: avatar || DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)],
    createdAt: now,
    updatedAt: now,
  };
}

export function updateProfile(profile: Profile): Profile {
  return {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
}
