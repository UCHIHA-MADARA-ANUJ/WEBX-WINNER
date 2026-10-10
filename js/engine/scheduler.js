/**
 * THE EVOLUTION ENGINE — selection scheduler (the brain)
 *
 * Four structural shapes compete continuously. Each declares an ideal
 * behavioural profile; fitness = similarity between your live genome
 * and that ideal, plus:
 *
 *   · novelty pressure  — grows the longer you stay in one shape
 *   · revisit penalty   — the shape you just left must win harder
 *
 * Epochs fire every N actions or T active seconds. A switch needs the
 * challenger to beat the incumbent by the hysteresis margin —
 * evolution, never chaos.
 */

export const PARADIGMS = {
  magazine: {
    id: "magazine",
    name: "Magazine",
    glyph: "📖",
    blurb: "a calm editorial spread — one story at a time",
    explain: "You read with patience → the site rebuilt itself as a magazine",
    ideal: { linearity: 0.92, pace: 0.3, depth: 0.8, agency: 0.26, keyboard: 0.22 },
  },
  map: {
    id: "map",
    name: "Constellation",
    glyph: "🗺️",
    blurb: "a star-map of work to roam freely",
    explain: "You roam and explore → the site rebuilt itself as a constellation",
    ideal: { linearity: 0.2, pace: 0.55, depth: 0.4, agency: 0.9, keyboard: 0.34 },
  },
  deck: {
    id: "deck",
    name: "Swipe Deck",
    glyph: "💳",
    blurb: "full-screen cards for decision speed",
    explain: "You move at speed → the site rebuilt itself as a swipe deck",
    ideal: { linearity: 0.42, pace: 0.92, depth: 0.16, agency: 0.5, keyboard: 0.38 },
  },
  orbit: {
    id: "orbit",
    name: "Orbit",
    glyph: "🌀",
    blurb: "one idea at the centre, the rest revolving",
    explain: "You follow threads of thought → the site rebuilt itself as an orbit",
    ideal: { linearity: 0.34, pace: 0.48, depth: 0.72, agency: 0.62, keyboard: 0.36 },
  },
};

export const PARADIGM_IDS = Object.keys(PARADIGMS);

const TRAIT_KEYS = ["linearity", "pace", "depth", "agency", "keyboard"];

const HYSTERESIS = 0.07;
const NOVELTY_PER_S = 0.0024;
const NOVELTY_CAP = 0.17;
const REVISIT_PENALTY = 0.12;
const REVISIT_DECAY_S = 75;
const EPOCH_ACTIONS = 10;
const EPOCH_SECONDS = 50;

function similarity(genome, ideal) {
  let sum = 0;
  for (const t of TRAIT_KEYS) sum += 1 - Math.abs(genome[t] - ideal[t]);
  return sum / TRAIT_KEYS.length;
}

export function createScheduler({ genome, onChanged }) {
  let current = "magazine";
  let enteredAt = performance.now();
  let lastLeft = { id: null, at: 0 };
  let actionsSinceEpoch = 0;
  let secondsSinceEpoch = 0;
  const log = [];

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

  function explain(toId) {
    return PARADIGMS[toId].explain;
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
      why: why || explain(id),
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

    onAction() {
      actionsSinceEpoch += 1;
      return this.maybeRestructure();
    },

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
      return null;
    },

    force(id, reason = "forced") {
      if (!PARADIGMS[id]) return null;
      return switchTo(id, reason, `you chose this · ${PARADIGMS[id].blurb}`);
    },

    serialize() {
      return { current, enteredAt, lastLeft, log: log.slice(-6) };
    },

    restore(data) {
      if (!data) return;
      if (data.current && PARADIGMS[data.current]) current = data.current;
      if (data.lastLeft) lastLeft = data.lastLeft;
      if (Array.isArray(data.log)) log.push(...data.log.slice(-6));
    },
  };
}
