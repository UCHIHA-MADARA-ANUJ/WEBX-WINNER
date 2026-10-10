/**
 * LATTICE — genome (the belief vector)
 *
 * Five heritable traits, all in [0,1], all decaying toward 0.5
 * (recent behaviour dominates — weather becomes climate slowly).
 *
 *   linearity    1 = reads sequence-to-sequence · 0 = jumps the graph
 *   pace         1 = rapid scanning            · 0 = languid reading
 *   depth        1 = opens and dwells          · 0 = grazes summaries
 *   agency       1 = drives the system         · 0 = follows guidance
 *   keyboard     1 = lives in commands/jumps   · 0 = points and clicks
 *
 * Each observed event nudges traits by a small, bounded delta.
 * No single action can dominate; only sustained patterns can.
 */

export const TRAITS = ["linearity", "pace", "depth", "agency", "keyboard"];

export const TRAIT_LABELS = {
  linearity: ["erratic", "sequential"],
  pace: ["languid", "rapid"],
  depth: ["grazing", "diving"],
  agency: ["guided", "autonomous"],
  keyboard: ["pointer", "keys"],
};

export function neutralGenome() {
  return {
    linearity: 0.5,
    pace: 0.5,
    depth: 0.5,
    agency: 0.5,
    keyboard: 0.5,
  };
}

const clamp = (v) => Math.min(1, Math.max(0, v));

/** Bounded nudge. delta in [-1,1]; magnitude scaled by `gain`. */
function nudge(g, trait, delta, gain = 1) {
  g[trait] = clamp(g[trait] + delta * gain * 0.07);
}

/**
 * Event → trait deltas. The "learning rules" of the organism.
 * Returns a list of {trait, delta} for the inspector's event log.
 */
export function applyEvent(genome, ev, ctx = {}) {
  const changes = [];
  const bump = (trait, delta, gain = 1) => {
    const before = genome[trait];
    nudge(genome, trait, delta, gain);
    const d = genome[trait] - before;
    if (Math.abs(d) > 1e-6) changes.push({ trait, delta: d });
  };

  switch (ev.type) {
    case "open": {
      if (ev.via === "next" || ev.via === "prev" || ev.via === "chapter") {
        bump("linearity", 1);
        bump("agency", -0.25);
      } else if (ev.via === "jump" || ev.via === "search" || ev.via === "command") {
        bump("linearity", -1);
        bump("agency", 0.8);
        if (ev.via === "command") bump("keyboard", 1);
      } else if (ev.via === "relation") {
        bump("linearity", -0.45);
        bump("depth", 0.35);
        bump("agency", 0.5);
      } else if (ev.via === "hub" || ev.via === "satellite") {
        bump("linearity", -0.7);
        bump("depth", 0.3);
      } else if (ev.via === "triage") {
        bump("pace", 0.7);
        bump("depth", -0.4);
      }
      break;
    }
    case "expand": {
      if (ev.on) bump("depth", 1);
      else bump("depth", -0.8);
      break;
    }
    case "dwell": {
      const s = ev.ms / 1000;
      if (s > 12) {
        bump("depth", 0.9);
        bump("pace", -0.7);
        bump("linearity", 0.35);
      } else if (s > 5) {
        bump("depth", 0.35);
      } else if (s < 2.2 && ev.ms > 250) {
        bump("depth", -0.7);
        bump("pace", 0.6);
      }
      break;
    }
    case "scroll": {
      // sustained fast scrolling reads as scanning
      const v = ev.velocity || 0;
      if (v > 1400) {
        bump("pace", 0.55);
        bump("depth", -0.25);
      } else if (v > 0 && v < 220) {
        bump("pace", -0.35);
      }
      break;
    }
    case "pin": {
      bump("agency", 1);
      if (ev.on) bump("depth", 0.3);
      break;
    }
    case "search":
    case "jump": {
      bump("agency", 0.7);
      bump("linearity", -0.6);
      bump("keyboard", 0.55);
      break;
    }
    case "command": {
      bump("keyboard", 1.1);
      bump("agency", 0.9);
      bump("pace", 0.3);
      break;
    }
    case "navigate": {
      // transitions across the semantic graph — moving to distant ideas
      const via = ev.via || "unknown";
      if (via === "relation" || via === "hub" || via === "satellite") {
        bump("linearity", -0.3);
      }
      break;
    }
    case "triage": {
      bump("pace", 0.8);
      bump("depth", -0.5);
      bump("agency", 0.3);
      break;
    }
    case "force-paradigm": {
      // manual override is itself an expression of agency
      bump("agency", 0.8);
      bump("keyboard", 0.3);
      break;
    }
    default:
      break;
  }

  return changes;
}

/**
 * Decay: every trait relaxes toward 0.5.
 * `dtMs` is active-time elapsed; ~90s half-life on behavioural signal.
 */
export function decay(genome, dtMs) {
  const k = 1 - Math.exp(-dtMs / 90000);
  for (const t of TRAITS) {
    genome[t] += (0.5 - genome[t]) * k;
  }
}

/**
 * Procedural mutation across visits: generation N>1 drifts the genome
 * slightly off its remembered state — so a returning visitor's surface
 * is never exactly what they left, and evolves faster.
 */
export function mutate(genome, strength = 0.12) {
  const changes = [];
  for (const t of TRAITS) {
    // bounded random walk with reflection at the edges
    const drift = (Math.random() * 2 - 1) * strength;
    const before = genome[t];
    let next = clamp(genome[t] + drift);
    if (next === 0 || next === 1) next = clamp(genome[t] - drift * 0.5);
    genome[t] = next;
    if (next !== before) changes.push({ trait: t, delta: next - before });
  }
  return changes;
}

/** Human-readable trait word for chrome/inspector copy. */
export function traitWord(trait, value) {
  const [lo, hi] = TRAIT_LABELS[trait];
  if (value < 0.35) return lo;
  if (value > 0.65) return hi;
  return `mixed-${trait}`;
}
