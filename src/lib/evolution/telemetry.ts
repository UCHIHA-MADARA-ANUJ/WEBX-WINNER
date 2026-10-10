/**
 * TELEMETRY — the senses. All local, all inspectable, all erasable.
 */

export type RawEvent = {
  type: string;
  t: number;
  unitId?: string;
  via?: string;
  q?: string;
  ms?: number;
  on?: boolean;
  verdict?: string;
  mode?: string;
  [k: string]: unknown;
};

export type TelemetrySnapshot = {
  pace: number;
  dwell: Record<string, number>;
  actionCounts: Record<string, number>;
  lastGapMs: number;
  stats: { actions: number; opens: number; jumps: number; pins: number; fullReads: number };
};

export function createTelemetry() {
  const events: RawEvent[] = [];
  const RING = 180;
  const dwell = new Map<string, number>();
  const actionCounts = new Map<string, number>();

  let lastActiveAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  let paceEma = 0.5;

  const stats = { actions: 0, opens: 0, jumps: 0, pins: 0, fullReads: 0 };

  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

  function push(type: string, payload: Record<string, unknown> = {}) {
    const ev: RawEvent = { type, t: Date.now(), ...payload } as RawEvent;
    events.push(ev);
    if (events.length > RING) events.splice(0, events.length - RING);
    actionCounts.set(type, (actionCounts.get(type) || 0) + 1);
    stats.actions += 1;

    const gap = now() - lastActiveAt;
    if (gap < 20000) {
      const instant = 1 - Math.min(1, Math.max(0, (gap - 150) / 3850));
      paceEma = paceEma * 0.82 + instant * 0.18;
    }
    lastActiveAt = now();
    return ev;
  }

  /* dwell */
  let dwellId: string | null = null;
  let dwellStart = 0;
  function flushDwell() {
    if (dwellId == null) return;
    dwell.set(dwellId, (dwell.get(dwellId) || 0) + (now() - dwellStart));
    dwellId = null;
  }

  return {
    events,
    stats,
    dwell,

    setDwellTarget(unitId: string | null) {
      flushDwell();
      if (unitId != null) {
        dwellId = unitId;
        dwellStart = now();
      }
    },

    snapshot(): TelemetrySnapshot {
      flushDwell();
      return {
        pace: paceEma,
        dwell: Object.fromEntries(dwell),
        actionCounts: Object.fromEntries(actionCounts),
        lastGapMs: now() - lastActiveAt,
        stats: { ...stats },
      };
    },

    recordTransition(_from: string | null, to: string, via: string) {
      return push("navigate", { unitId: to, via });
    },
    recordOpen(unitId: string, via: string) {
      stats.opens += 1;
      return push("open", { unitId, via });
    },
    recordExpand(unitId: string, on: boolean) {
      if (on) stats.fullReads += 1;
      return push("expand", { unitId, on });
    },
    recordPin(unitId: string, on: boolean) {
      stats.pins += 1;
      return push("pin", { unitId, on });
    },
    recordJump(unitId: string, via = "jump") {
      stats.jumps += 1;
      return push("jump", { unitId, via });
    },
    recordSearch(q: string) {
      return push("search", { q });
    },
    recordAction(type: string, payload: Record<string, unknown> = {}) {
      return push(type, payload);
    },
    markIdle() {
      flushDwell();
    },
  };
}

export type Telemetry = ReturnType<typeof createTelemetry>;
