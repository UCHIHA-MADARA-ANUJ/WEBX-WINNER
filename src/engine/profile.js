// The Evolution Engine's core: a pure, DOM-free model of the visitor.
// Events go in, a recency-weighted profile comes out, and `evaluate`
// decides which structural paradigm (mode) the interface should take.

export const SECTION_IDS = ['manifesto', 'work', 'method', 'journal', 'contact'];
export const MODES = ['chronicle', 'atlas', 'terminal', 'index', 'deck'];

const MAX_EVENTS = 120;      // sliding window: the engine forgets old behaviour
const MAX_DWELL_MS = 120000; // idle tabs must not look like "slow reading"
const SWITCH_MARGIN = 0.12;  // score gap required before the interface moves
const HYSTERESIS = 0.08;     // bonus for the structure the user already has
const MIN_NAVS_BETWEEN_EVOLUTIONS = 6;

export function createProfile() {
  return {
    version: 1,
    visits: 0,
    generation: 0,          // number of structural transformations so far
    lastMode: 'chronicle',
    lastFocus: 'manifesto',
    pinned: false,          // user manually chose a structure: stop auto-evolving
    events: [],             // sliding window of observed events
    lastNav: null,          // { to, at } of the most recent section change
    lastScrollV: 0,
    navSinceEvolve: 0,
    modeHistory: [],
  };
}

const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const sectionIndex = (id) => SECTION_IDS.indexOf(id);

/**
 * Fold one observed event into the profile (mutates and returns it).
 * Event shapes:
 *   { t:'nav',    to, source: 'click'|'scroll'|'key'|'cmd', at }
 *   { t:'click',  topic, at }
 *   { t:'hover',  topic, ms, at }          // hesitation over an item, no click
 *   { t:'scroll', v, at }                  // smoothed px/s
 *   { t:'cmd',    cmd, at }                // command shell / palette usage
 */
export function reduce(p, ev) {
  const e = { ...ev, at: ev.at ?? Date.now() };
  if (e.t === 'nav') {
    if (!SECTION_IDS.includes(e.to) || (p.lastNav && p.lastNav.to === e.to)) return p;
    e.from = p.lastNav ? p.lastNav.to : null;
    if (p.lastNav) e.dwell = Math.min(e.at - p.lastNav.at, MAX_DWELL_MS); // time spent on `from`
    p.lastNav = { to: e.to, at: e.at };
    p.lastFocus = e.to;
    p.navSinceEvolve += 1;
  }
  if (e.t === 'scroll') p.lastScrollV = e.v;
  p.events.push(e);
  if (p.events.length > MAX_EVENTS) p.events.splice(0, p.events.length - MAX_EVENTS);
  return p;
}

/** Derive interpretable behavioural metrics from the event window. */
export function metrics(p) {
  const ev = p.events;
  const navs = ev.filter((e) => e.t === 'nav');
  const clicks = ev.filter((e) => e.t === 'click');
  const hovers = ev.filter((e) => e.t === 'hover');
  const cmds = ev.filter((e) => e.t === 'cmd');
  const scrolls = ev.filter((e) => e.t === 'scroll');

  let linear = 0, back = 0, jump = 0;
  for (const n of navs) {
    if (n.from == null) continue;
    const d = sectionIndex(n.to) - sectionIndex(n.from);
    if (d === 1) linear++;
    else if (d < 0) back++;
    else if (d > 1) jump++;
  }
  const transitions = linear + back + jump;

  const dwells = navs.filter((n) => n.dwell != null).map((n) => n.dwell);
  const topics = {};
  for (const c of clicks) topics[c.topic] = (topics[c.topic] || 0) + 1;
  const clickTotal = clicks.length;
  const topTopic = Object.entries(topics).sort((a, b) => b[1] - a[1])[0] || null;
  const actions = navs.length + clickTotal + cmds.length;

  return {
    navCount: navs.length,
    transitions,
    linearity: transitions >= 2 ? linear / transitions : null,
    erratic: transitions >= 2 ? (back + jump) / transitions : null,
    avgDwell: mean(dwells),
    speed: scrolls.length ? mean(scrolls.slice(-12).map((s) => s.v)) : null,
    diversity: new Set(navs.map((n) => n.to)).size / SECTION_IDS.length,
    clickCount: clickTotal,
    topic: topTopic ? topTopic[0] : null,
    dominance: topTopic && clickTotal >= 3 ? topTopic[1] / clickTotal : 0,
    hesitation: hovers.length + clickTotal ? hovers.length / (hovers.length + clickTotal) : null,
    cmdCount: cmds.length,
    cmdRatio: actions ? cmds.length / actions : null,
  };
}

/**
 * Score every structural paradigm and decide whether to move.
 * Returns the winning mode, raw scores, human-readable reasons and a
 * `shouldEvolve` flag that respects hysteresis, evidence and cooldown.
 */
export function evaluate(p, current = p.lastMode) {
  const m = metrics(p);
  const evidence = m.navCount >= 5 || m.cmdCount >= 3;
  const pct = (x) => `${Math.round(x * 100)}%`;
  const raw = { chronicle: 0, atlas: 0, terminal: 0, index: 0, deck: 0 };
  const why = { chronicle: '', atlas: '', terminal: '', index: '', deck: '' };

  if (m.linearity != null) {
    const dwellSlow = m.avgDwell != null ? clamp((m.avgDwell - 6000) / 18000) : 0;
    const scrollCalm = m.speed != null && m.speed < 800 ? 1 : 0;
    raw.chronicle = 0.6 * m.linearity + 0.2 * dwellSlow + 0.2 * scrollCalm;
    why.chronicle = `you read in order (${pct(m.linearity)} sequential moves)`;
  }
  if (m.erratic != null) {
    raw.atlas = 0.5 * m.erratic + 0.3 * m.diversity + 0.2 * (m.hesitation ?? 0);
    why.atlas = `you jump between sections (${pct(m.erratic)} non-sequential moves)`;
  }
  if (m.speed != null && m.avgDwell != null && m.navCount >= 5) {
    raw.index = 0.6 * clamp((m.speed - 1000) / 1500) + 0.4 * clamp((6000 - m.avgDwell) / 4000);
    why.index = `you skim quickly (~${Math.round(m.speed)} px/s, ${(m.avgDwell / 1000).toFixed(1)}s per section)`;
  }
  if (m.clickCount >= 4 || m.navCount >= 3) {
    const dwellDeep = m.avgDwell != null ? clamp((m.avgDwell - 12000) / 20000) : 0;
    raw.deck = 0.7 * m.dominance + 0.3 * dwellDeep;
    why.deck = `you keep returning to ${m.topic ?? 'one topic'} (${pct(m.dominance)} of your clicks)`;
  }
  if (m.cmdCount >= 3) {
    raw.terminal = clamp(m.cmdRatio * 2.5);
    why.terminal = `you reach for commands (${pct(m.cmdRatio)} of your actions)`;
  }

  const adjusted = { ...raw, [current]: raw[current] + HYSTERESIS };
  let best = current;
  for (const mode of MODES) if (adjusted[mode] > adjusted[best]) best = mode;

  const shouldEvolve =
    evidence &&
    !p.pinned &&
    best !== current &&
    adjusted[best] - adjusted[current] >= SWITCH_MARGIN &&
    p.navSinceEvolve >= MIN_NAVS_BETWEEN_EVOLUTIONS;

  return {
    mode: best,
    current,
    raw,
    adjusted,
    metrics: m,
    evidence,
    shouldEvolve,
    reasons: [why[best] || 'the signals are still forming'],
  };
}

/** Called by the app once the structure has actually been rebuilt. */
export function markEvolution(p, mode, reason, auto) {
  p.navSinceEvolve = 0;
  p.lastMode = mode;
  p.generation += 1;
  p.modeHistory.push({ mode, reason, auto, at: Date.now() });
  if (p.modeHistory.length > 12) p.modeHistory.splice(0, p.modeHistory.length - 12);
  return p;
}
