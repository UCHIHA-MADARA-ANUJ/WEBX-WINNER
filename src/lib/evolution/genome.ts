/**
 * THE GENOME — a five-trait belief vector
 * linearity · pace · depth · agency · keyboard, each in [0,1].
 * Bounded deltas per event. Decay toward 0.5 — recent behaviour rules.
 */

export const TRAITS = ["linearity", "pace", "depth", "agency", "keyboard"] as const;
export type Trait = (typeof TRAITS)[number];

export const TRAIT_LABELS: Record<Trait, [string, string]> = {
  linearity: ["straight line", "free roam"],
  pace: ["calm", "rapid"],
  depth: ["grazing", "diving"],
  agency: ["follows", "drives"],
  keyboard: ["pointer", "keys"],
};

export type Genome = Record<Trait, number>;

export function neutralGenome(): Genome {
  return { linearity: 0.5, pace: 0.5, depth: 0.5, agency: 0.5, keyboard: 0.5 };
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

function nudge(g: Genome, trait: Trait, delta: number, gain = 1) {
  g[trait] = clamp(g[trait] + delta * gain * 0.07);
}

export type EngineEvent = {
  type: string;
  via?: string;
  mode?: string;
  on?: boolean;
  ms?: number;
  velocity?: number;
  verdict?: string;
  unitId?: string | null;
  [k: string]: unknown;
};

/** Event → trait deltas. The learning rules of the organism. */
export function applyEvent(genome: Genome, ev: EngineEvent): void {
  const bump = (trait: Trait, delta: number, gain = 1) => nudge(genome, trait, delta, gain);

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
      const s = (ev.ms || 0) / 1000;
      if (s > 12) {
        bump("depth", 0.9);
        bump("pace", -0.7);
        bump("linearity", 0.35);
      } else if (s > 5) {
        bump("depth", 0.35);
      } else if (s < 2.2 && (ev.ms || 0) > 250) {
        bump("depth", -0.7);
        bump("pace", 0.6);
      }
      break;
    }
    case "scroll": {
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
      bump("agency", 0.8);
      bump("keyboard", 0.3);
      break;
    }
    case "prime": {
      const mode = ev.mode;
      if (mode === "reader") {
        bump("depth", 1.6, 1); bump("pace", -1.6, 1); bump("linearity", 1.2, 1); bump("agency", -0.9, 1);
      } else if (mode === "explorer") {
        bump("agency", 1.6, 1); bump("linearity", -1.5, 1); bump("pace", 0.35, 1); bump("depth", -0.5, 1);
      } else if (mode === "speedrunner") {
        bump("pace", 1.8, 1); bump("depth", -1.5, 1); bump("agency", 0.5, 1); bump("linearity", -0.4, 1);
      }
      break;
    }
    default:
      break;
  }
}

/** Decay toward 0.5. ~90s half-life on behavioural signal. */
export function decay(genome: Genome, dtMs: number): void {
  const k = 1 - Math.exp(-dtMs / 90000);
  for (const t of TRAITS) {
    genome[t] += (0.5 - genome[t]) * k;
  }
}

/** Cross-visit procedural mutation: bounded random walk. */
export function mutate(genome: Genome, strength = 0.12): void {
  for (const t of TRAITS) {
    const drift = (Math.random() * 2 - 1) * strength;
    let next = clamp(genome[t] + drift);
    if (next === 0 || next === 1) next = clamp(genome[t] - drift * 0.5);
    genome[t] = next;
  }
}
