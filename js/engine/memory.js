/**
 * LATTICE — memory
 * Procedural state across visits. The organism remembers you.
 * Everything degrades gracefully: no storage → session-only genome.
 */

const KEY = "lattice.genome.v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, ...state }));
  } catch {
    /* private mode / quota — the session continues without persistence */
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
