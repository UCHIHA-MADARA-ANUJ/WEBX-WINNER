/**
 * LATTICE — telemetry (the senses)
 *
 * What the organism observes:
 *   · dwell        — time spent inside each idea
 *   · pace         — speed of interaction & scrolling (EMA of gaps)
 *   · trajectory   — sequential vs erratic movement through the graph
 *   · depth        — expand/full-read vs graze
 *   · agency       — pins, commands, jumps, manual navigation
 *   · keyboard     — command/jump palette usage
 *
 * Nothing leaves the browser. All telemetry is local, inspectable,
 * and erasable from the engine inspector.
 */

const RING = 180;

function createBus() {
  const listeners = new Map();
  return {
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type)?.delete(fn);
    },
    emit(type, payload) {
      const set = listeners.get(type);
      if (set) for (const fn of [...set]) fn(payload);
      const any = listeners.get("*");
      if (any) for (const fn of [...any]) fn({ type, payload });
    },
  };
}

export function createTelemetry() {
  const bus = createBus();
  const events = []; // ring buffer of raw events
  const dwell = new Map(); // unitId -> ms
  const actionCounts = new Map(); // action -> count
  const transitions = []; // { from, to, via, t }

  let active = true;
  let lastActiveAt = performance.now();
  let lastGapMs = 900;
  let paceEma = 0.5; // 0 = languid, 1 = rapid
  let scrollVel = 0; // px/s, decaying
  let lastScrollY = scrollY;
  let lastScrollAt = performance.now();

  const stats = {
    actions: 0,
    opens: 0,
    jumps: 0,
    searches: 0,
    pins: 0,
    fullReads: 0,
    skimmed: 0,
    sessionStart: Date.now(),
  };

  function now() {
    return performance.now();
  }

  function push(type, payload = {}) {
    const t = Date.now();
    events.push({ type, t, ...payload });
    if (events.length > RING) events.splice(0, events.length - RING);
    actionCounts.set(type, (actionCounts.get(type) || 0) + 1);
    stats.actions += 1;

    const gap = now() - lastActiveAt;
    if (gap < 20000) {
      // normalise inter-action gap to a 0..1 pace signal (~150ms → 1, ~4s → 0)
      const instant = 1 - Math.min(1, Math.max(0, (gap - 150) / 3850));
      paceEma = paceEma * 0.82 + instant * 0.18;
    }
    lastGapMs = gap;
    lastActiveAt = now();
    active = true;
    bus.emit("action", { type, payload, t });
    bus.emit(type, payload);
  }

  /* ---- scroll: velocity is a pace signal, not an aesthetic choice ---- */
  let raf = 0;
  function onScroll() {
    const y = scrollY;
    const t = now();
    const dt = Math.max(8, t - lastScrollAt);
    const instVel = (Math.abs(y - lastScrollY) / dt) * 1000;
    scrollVel = scrollVel * 0.82 + instVel * 0.18;
    lastScrollY = y;
    lastScrollAt = t;
    if (!raf) {
      raf = requestAnimationFrame(() => {
        raf = 0;
        // decay toward calm when the scrolling stops
        scrollVel *= 0.965;
        if (scrollVel < 40) scrollVel = 0;
        bus.emit("scroll", { velocity: scrollVel });
      });
    }
  }
  addEventListener("scroll", onScroll, { passive: true });

  /* ---- dwell: which ideas hold you, which you graze ---- */
  let dwellId = null;
  let dwellStart = 0;
  function flushDwell() {
    if (dwellId == null) return;
    const ms = now() - dwellStart;
    dwell.set(dwellId, (dwell.get(dwellId) || 0) + ms);
    bus.emit("dwell", { unitId: dwellId, ms });
    dwellId = null;
  }

  return {
    bus,
    events,
    stats,
    dwell,

    setDwellTarget(unitId) {
      flushDwell();
      if (unitId != null) {
        dwellId = unitId;
        dwellStart = now();
      }
    },

    /** All the derived signals the genome reads. */
    snapshot() {
      flushDwell();
      return {
        pace: paceEma,
        scrollVel,
        dwell: Object.fromEntries(dwell),
        actionCounts: Object.fromEntries(actionCounts),
        transitions: transitions.slice(-24),
        lastGapMs,
        stats: { ...stats, actions: stats.actions },
      };
    },

    recordTransition(from, to, via) {
      transitions.push({ from, to, via, t: Date.now() });
      if (transitions.length > 60) transitions.shift();
      push("navigate", { from, to, via });
    },

    recordSearch(q) {
      stats.searches += 1;
      push("search", { q });
    },

    recordJump(unitId, via = "jump") {
      stats.jumps += 1;
      push("jump", { unitId, via });
    },

    recordOpen(unitId, via) {
      stats.opens += 1;
      push("open", { unitId, via });
    },

    recordExpand(unitId, on) {
      if (on) stats.fullReads += 1;
      else stats.skimmed += 1;
      push("expand", { unitId, on });
    },

    recordPin(unitId, on) {
      stats.pins += 1;
      push("pin", { unitId, on });
    },

    recordAction(type, payload = {}) {
      push(type, payload);
    },

    markIdle() {
      flushDwell();
    },
  };
}
