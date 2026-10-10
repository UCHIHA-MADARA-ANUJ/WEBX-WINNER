/**
 * MEMORY — procedural state across visits. The organism remembers you.
 */

const KEY = "lattice.genome.v2";

export type SavedState = {
  version: 2;
  generation: number;
  genome: Record<string, number>;
  pins: string[];
  seen: string[];
  expanded: string[];
  focusId: string | null;
  trail: string[];
  affinity: [string, number][];
  promoted: Record<string, number>;
  lastShape: string;
  scheduler: unknown;
};

export function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 2) return null;
    return parsed as SavedState;
  } catch {
    return null;
  }
}

export function saveState(state: Omit<SavedState, "version">): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 2, ...state }));
  } catch {
    /* private mode — the session continues without persistence */
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
