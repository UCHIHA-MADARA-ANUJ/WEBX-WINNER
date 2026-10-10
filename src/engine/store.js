// Persistence: the interface remembers its visitor across visits.
import { createProfile } from './profile.js';

const KEY = 'webx.evolution.v1';

export function loadProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...createProfile(), ...JSON.parse(raw) };
  } catch (_) { /* corrupt or unavailable storage: start fresh */ }
  return createProfile();
}

export function saveProfile(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (_) { /* quota or private mode */ }
}

export function resetProfile() {
  try { localStorage.removeItem(KEY); } catch (_) { /* ignore */ }
}
