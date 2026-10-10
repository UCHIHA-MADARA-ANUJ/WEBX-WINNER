/**
 * LATTICE — evolution scheduler (the brain)
 *
 * Six structural paradigms compete continuously. Each declares an
 * ideal behavioural profile; fitness = similarity between the current
 * genome and that ideal, plus:
 *
 *   · novelty pressure  — grows the longer you stay in one paradigm,
 *                         so the surface is never static for long
 *   · revisit penalty   — a paradigm you just left must work harder
 *                         to win you back (no thrashing)
 *
 * Epochs (structural review points) fire every N meaningful actions
 * OR every T seconds of active use. A switch happens only when the
 * challenger beats the incumbent by the hysteresis margin — the
 * golden rule: evolution, not chaos.
 */

export const PARADIGMS = {
  linear: {
    id: "linear",
    name: "Editorial",
    glyph: "§",
    blurb: "a chaptered document with a progress rail",
    ideal: { linearity: 0.92, pace: 0.32, depth: 0.78, agency: 0.26, keyboard: 0.22 },
  },
  spatial: {
    id: "spatial",
    name: "Constellation",
    glyph: "✦",
    blurb: "ideas as a field of nodes to wander",
    ideal: { linearity: 0.22, pace: 0.52, depth: 0.42, agency: 0.86, keyboard: 0.34 },
  },
  orbital: {
    id: "orbital",
    name: "Orbital",
    glyph: "◎",
    blurb: "one idea at the centre, relations in orbit",
    ideal: { linearity: 0.34, pace: 0.48, depth: 0.68, agency: 0.62, keyboard: 0.38 },
  },
  command: {
    id: "command",
    name: "Terminal",
    glyph: "›_",
    blurb: "a keyboard-first command surface",
    ideal: { linearity: 0.26, pace: 0.82, depth: 0.36, agency: 0.94, keyboard: 0.95 },
  },
  deck: {
    id: "deck",
    name: "Triage",
    glyph: "⇉",
    blurb: "a decision stack for rapid scanning",
    ideal: { linearity: 0.42, pace: 0.9, depth: 0.18, agency: 0.52, keyboard: 0.4 },
  },
  grid: {
    id: "grid",
    name: "Dashboard",
    glyph: "⊞",
    blurb: "a pinned workspace of live widgets",
    ideal: { linearity: 0.38, pace: 0.58, depth: 0.56, agency: 0.78, keyboard: 0.5 },
  },
};

export const PARADIGM_IDS = Object.keys(PARADIGMS);

const TRAIT_KEYS = ["linearity", "pace", "depth", "agency", "keyboard"];

const HYSTERESIS = 0.07; // challenger must beat incumbent by this much
const NOVELTY_PER_S = 0.0022; // mutation pressure per second in a paradigm
const NOVELTY_CAP = 0.16;
const REVISIT_PENALTY = 0.12; // applied to the paradigm you just left
const REVISIT_DECAY_S = 75; // …fading over this many seconds
const EPOCH_ACTIONS = 11;
const EPOCH_SECONDS = 55;

function similarity(genome, ideal) {
  // 1 - mean absolute deviation → plain, explainable, stable
  let sum = 0;
  for (const t of TRAIT_KEYS) sum += 1 - Math.abs(genome[t] - ideal[t]);
  return sum / TRAIT_KEYS.length;
}

export function createScheduler({ genome, onChanged }) {
  let current = "linear";
  let enteredAt = performance.now();
  let lastLeft = { id: null, at: 0 };
  let actionsSinceEpoch = 0;
  let secondsSinceEpoch = 0;
  const log = []; // decision history for the inspector

  function noveltyFor(id) {
    if (id === current) return 0;
    const ageS = (performance.now() - enteredAt) / 1000;
    return Math.min(NOVELTY_CAP, ageS * NOVELTY_PER_S);
  }

  function revisitPenalty(id) {
    if (id !== lastLeft.id) return 0;
    const ageS = (performance.now() - lastLeft.at) / 1000;
    return REVISIT_PENALTY * Math.max(0, 1 - ageS / REVISIT_DECAY_S);
  }

  function fitnesses() {
    return PARADIGM_IDS.map((id) => ({
      id,
      name: PARADIGMS[id].name,
      score: similarity(genome, PARADIGMS[id].ideal) + noveltyFor(id) - revisitPenalty(id),
      base: similarity(genome, PARADIGMS[id].ideal),
      novelty: noveltyFor(id),
      penalty: revisitPenalty(id),
    })).sort((a, b) => b.score - a.score);
  }

  /** Why a challenger won — written for humans. */
  function explain(fromId, toId) {
    const ideal = PARADIGMS[toId].ideal;
    const gaps = TRAIT_KEYS.map((t) => ({ t, gap: ideal[t] - genome[t] }))
      .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
      .slice(0, 2);
    const words = gaps.map(({ t, gap }) => {
      const dir = gap > 0 ? "high" : "low";
      return `${dir} ${t}`;
    });
    return `genome drift: ${words.join(", ")} · ${PARADIGMS[toId].name} fits best (${PARADIGMS[toId].blurb})`;
  }

  function switchTo(id, reason, why) {
    const from = current;
    if (id === from) return null;
    lastLeft = { id: from, at: performance.now() };
    current = id;
    enteredAt = performance.now();
    actionsSinceEpoch = 0;
    secondsSinceEpoch = 0;
    const decision = {
      from,
      to: id,
      reason,
      why: why || explain(from, id),
      at: Date.now(),
      fitness: fitnesses(),
    };
    log.push(decision);
    if (log.length > 20) log.shift();
    onChanged?.(decision);
    return decision;
  }

  return {
    get current() {
      return current;
    },
    get log() {
      return log;
    },
    fitnesses,

    /** Called on every meaningful action; returns a decision or null. */
    onAction() {
      actionsSinceEpoch += 1;
      return this.maybeRestructure();
    },

    /** Active-time accumulation — pace-independent epoch pressure. */
    onTick(dtSeconds) {
      secondsSinceEpoch += dtSeconds;
      return this.maybeRestructure();
    },

    maybeRestructure(force = false) {
      const due = force || actionsSinceEpoch >= EPOCH_ACTIONS || secondsSinceEpoch >= EPOCH_SECONDS;
      if (!due) return null;
      const ranked = fitnesses();
      const best = ranked[0];
      const incumbent = ranked.find((f) => f.id === current);
      actionsSinceEpoch = 0;
      secondsSinceEpoch = 0;
      if (best.id !== current && best.score > incumbent.score + HYSTERESIS) {
        return switchTo(best.id, "epoch");
      }
      return null; // incumbent survives the epoch
    },

    /** Manual override from the inspector / command surface. */
    force(id, reason = "forced") {
      if (!PARADIGMS[id]) return null;
      return switchTo(id, reason, `manual override · ${PARADIGMS[id].blurb}`);
    },

    /** Serialisation for cross-visit memory. */
    serialize() {
      return {
        current,
        enteredAt,
        lastLeft,
        log: log.slice(-6),
      };
    },

    restore(data) {
      if (!data) return;
      if (data.current && PARADIGMS[data.current]) current = data.current;
      if (data.lastLeft) lastLeft = data.lastLeft;
      if (Array.isArray(data.log)) log.push(...data.log.slice(-6));
    },
  };
}
