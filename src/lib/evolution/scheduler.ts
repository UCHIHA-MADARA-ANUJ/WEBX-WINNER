/**
 * THE SCHEDULER — selection, not chaos
 * Four structural shapes compete. Fitness = similarity between the
 * live genome and each shape's ideal, + novelty pressure, − revisit
 * penalty. Epochs every N actions / T seconds; switches need the
 * challenger to beat the incumbent by a hysteresis margin.
 */

import type { Genome } from "./genome";

export type ShapeId = "magazine" | "constellation" | "deck" | "orbit";

export const PARADIGMS: Record<ShapeId, {
  id: ShapeId; name: string; glyph: string; blurb: string; explain: string;
  ideal: Genome;
}> = {
  magazine: {
    id: "magazine",
    name: "Magazine",
    glyph: "▤",
    blurb: "a calm editorial spread — one story at a time",
    explain: "You read with patience → the site rebuilt itself as a magazine",
    ideal: { linearity: 0.92, pace: 0.3, depth: 0.8, agency: 0.26, keyboard: 0.22 },
  },
  constellation: {
    id: "constellation",
    name: "Constellation",
    glyph: "✦",
    blurb: "a star-map of work to roam freely",
    explain: "You roam and explore → the site rebuilt itself as a constellation",
    ideal: { linearity: 0.2, pace: 0.55, depth: 0.4, agency: 0.9, keyboard: 0.34 },
  },
  deck: {
    id: "deck",
    name: "Swipe Deck",
    glyph: "⇉",
    blurb: "full-screen cards for decision speed",
    explain: "You move at speed → the site rebuilt itself as a swipe deck",
    ideal: { linearity: 0.42, pace: 0.92, depth: 0.16, agency: 0.5, keyboard: 0.38 },
  },
  orbit: {
    id: "orbit",
    name: "Orbit",
    glyph: "◎",
    blurb: "one idea at the centre, the rest revolving",
    explain: "You follow threads of thought → the site rebuilt itself as an orbit",
    ideal: { linearity: 0.34, pace: 0.48, depth: 0.72, agency: 0.62, keyboard: 0.36 },
  },
};

export const PARADIGM_IDS = Object.keys(PARADIGMS) as ShapeId[];

const TRAIT_KEYS: (keyof Genome)[] = ["linearity", "pace", "depth", "agency", "keyboard"];
const HYSTERESIS = 0.07;
const NOVELTY_PER_S = 0.0024;
const NOVELTY_CAP = 0.17;
const REVISIT_PENALTY = 0.12;
const REVISIT_DECAY_S = 75;
const EPOCH_ACTIONS = 10;
const EPOCH_SECONDS = 50;

function similarity(genome: Genome, ideal: Genome): number {
  let sum = 0;
  for (const t of TRAIT_KEYS) sum += 1 - Math.abs(genome[t] - ideal[t]);
  return sum / TRAIT_KEYS.length;
}

export type Fitness = {
  id: ShapeId; name: string; score: number;
  base: number; novelty: number; penalty: number;
};

export type Decision = {
  from: ShapeId; to: ShapeId; reason: string; why: string;
  at: number; fitness: Fitness[];
};

export function createScheduler(opts: {
  genome: Genome;
  onChanged?: (d: Decision) => void;
  onEpoch?: () => void;
}) {
  const { genome, onChanged, onEpoch } = opts;
  let current: ShapeId = "magazine";
  let enteredAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  let lastLeft: { id: ShapeId | null; at: number } = { id: null, at: 0 };
  let actionsSinceEpoch = 0;
  let secondsSinceEpoch = 0;
  const log: Decision[] = [];

  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

  function noveltyFor(id: ShapeId): number {
    if (id === current) return 0;
    return Math.min(NOVELTY_CAP, ((now() - enteredAt) / 1000) * NOVELTY_PER_S);
  }

  function revisitPenalty(id: ShapeId): number {
    if (id !== lastLeft.id) return 0;
    return REVISIT_PENALTY * Math.max(0, 1 - (now() - lastLeft.at) / 1000 / REVISIT_DECAY_S);
  }

  function fitnesses(): Fitness[] {
    return PARADIGM_IDS.map((id) => ({
      id,
      name: PARADIGMS[id].name,
      score: similarity(genome, PARADIGMS[id].ideal) + noveltyFor(id) - revisitPenalty(id),
      base: similarity(genome, PARADIGMS[id].ideal),
      novelty: noveltyFor(id),
      penalty: revisitPenalty(id),
    })).sort((a, b) => b.score - a.score);
  }

  function switchTo(id: ShapeId, reason: string, why?: string): Decision | null {
    const from = current;
    if (id === from) return null;
    lastLeft = { id: from, at: now() };
    current = id;
    enteredAt = now();
    actionsSinceEpoch = 0;
    secondsSinceEpoch = 0;
    const decision: Decision = {
      from,
      to: id,
      reason,
      why: why || PARADIGMS[id].explain,
      at: Date.now(),
      fitness: fitnesses(),
    };
    log.push(decision);
    if (log.length > 20) log.shift();
    onChanged?.(decision);
    return decision;
  }

  return {
    get current() { return current; },
    get log() { return log; },
    fitnesses,

    onAction(): Decision | null {
      actionsSinceEpoch += 1;
      return this.maybeRestructure();
    },

    onTick(dtSeconds: number): Decision | null {
      secondsSinceEpoch += dtSeconds;
      return this.maybeRestructure();
    },

    maybeRestructure(force = false): Decision | null {
      const due = force || actionsSinceEpoch >= EPOCH_ACTIONS || secondsSinceEpoch >= EPOCH_SECONDS;
      if (!due) return null;
      const ranked = fitnesses();
      const best = ranked[0];
      const incumbent = ranked.find((f) => f.id === current)!;
      actionsSinceEpoch = 0;
      secondsSinceEpoch = 0;
      onEpoch?.(); // every epoch boundary is observed — switched or not
      if (best.id !== current && best.score > incumbent.score + HYSTERESIS) {
        return switchTo(best.id, "epoch");
      }
      return null;
    },

    force(id: ShapeId, reason = "forced"): Decision | null {
      return switchTo(id, reason, `you chose this · ${PARADIGMS[id].blurb}`);
    },

    serialize() {
      return { current, enteredAt, lastLeft, log: log.slice(-6) };
    },

    restore(data?: {
      current?: ShapeId; lastLeft?: { id: ShapeId | null; at: number };
      log?: Decision[];
    } | null) {
      if (!data) return;
      if (data.current && PARADIGMS[data.current]) current = data.current;
      if (data.lastLeft) lastLeft = data.lastLeft;
      if (Array.isArray(data.log)) log.push(...data.log.slice(-6));
    },
  };
}

export type Scheduler = ReturnType<typeof createScheduler>;
