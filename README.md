# ANUJ PHULERA — the impossible interface

**A portfolio with no fixed layout.** It observes how you browse and physically rebuilds itself
around you — a magazine, a star-map, a swipe deck or an orbit — without ever becoming unusable.

<p align="center">
  <b>◈ LIVE → </b>
  <a href="https://cdn.jsdelivr.net/gh/UCHIHA-MADARA-ANUJ/WEBX-WINNER@be2d903/out/index.html">
    <b>anujphulera — the impossible interface</b>
  </a>
</p>

> THEME · MY PORTFOLIO WEBSITE — Anuj Phulera, Delhi
> BUILT WITH · **Next.js 15** · React 18 · TypeScript · Tailwind 4 · framer-motion · Three.js / R3F
> ENGINE · a behavioural genome + evolutionary shape selection, regression-tested

---

## ✦ The challenge, and the answer

> *“A web application with no fixed interface that continuously reorganizes its own layout and
> structure based on user behaviour — while staying usable and intelligent. Random shuffles and
> CSS theme changes don’t count.”*

This site is that answer. **The structure you are reading in is chosen, live, by the way you move.**
Two people on this site end up in structurally different websites — and the site explains every
change it makes, in plain English, before it makes it.

The golden rule, enforced in code and in tests:

> **EVOLUTION, NOT CHAOS.** Plain clicks never move anything. The hierarchy is frozen within a
> shape-session and reorders **only** at evolution moments — when the engine has evidence, and
> with a banner that says exactly why.

---

## 🧬 The Evolution Engine (the real deliverable)

```
          ┌─────────────────────────────────────────────────────────┐
          │                   YOU (behaviour)                       │
          └───────────────┬─────────────────────────────────────────┘
                          ▼
   ┌──────────────┐   ┌──────────────┐   ┌───────────────┐   ┌──────────────┐
   │  TELEMETRY   │ → │    GENOME    │ → │   SCHEDULER   │ → │    SHAPES    │
   │  the senses  │   │  the belief  │   │  natural      │   │  the body    │
   │  events,     │   │  5 traits in │   │  selection    │   │  magazine /  │
   │  dwell, pace │   │  [0,1], decay│   │  + hysteresis │   │  map / deck /│
   │  keyboard    │   │  + mutation  │   │  + novelty    │   │  orbit       │
   └──────────────┘   └──────────────┘   └───────────────┘   └──────────────┘
          │                   │                   │                    │
          └───────────────────┴──── MEMORABLE (localStorage) ─────────┘
```

**1 · TELEMETRY — the senses** (`src/lib/evolution/telemetry.ts`)
Every meaningful action is an event: opens (and *how* you opened — next? search? a relation
thread?), expands, dwell time per card, pin/triage verdicts, scroll velocity, keyboard commands.
All local. All inspectable in the brain panel. All erasable.

**2 · GENOME — the belief** (`src/lib/evolution/genome.ts`)
Five behavioural traits, each in [0,1]:

| trait | 0.0 | 1.0 |
|---|---|---|
| `linearity` | free roam | straight line |
| `pace` | calm | rapid |
| `depth` | grazing | diving |
| `agency` | follows | drives |
| `keyboard` | pointer | keys |

Events nudge traits in their natural direction (opening via search ⇒ `agency↑ linearity↓`;
lingering 12s+ ⇒ `depth↑ pace↓`; triaging at speed ⇒ `pace↑ depth↓`). Traits **decay toward
neutral (~90s half-life)** — only patterns rule, never a single stray click. Cross-visit,
procedural **mutation** (bounded random walk) means the site evolves *between* sessions too.

**3 · SCHEDULER — natural selection** (`src/lib/evolution/scheduler.ts`)
Four structural shapes compete every epoch (10 actions or 50s):

| shape | ideal visitor |
|---|---|
| ▤ **Magazine** | linear, patient, deep — reads like a human |
| ✦ **Constellation** | roams, branches, drives — refuses the path |
| ⇉ **Swipe Deck** | fast, triages, skims — decides in seconds |
| ◎ **Orbit** | follows threads, one idea at the centre |

Fitness = similarity to the shape's ideal genome **+ novelty pressure** (the current shape gets
stale) **− revisit penalty** (no flip-flopping). A challenger must beat the incumbent by a
**hysteresis margin** — that's the difference between *evolution* and a slot machine.

**4 · SHAPES — the body** (`src/components/shapes/`)
Four genuinely different kinds of website, not four CSS themes: an editorial spread with frozen
hierarchy; a spatial star-map you roam freely; a full-screen triage deck; a centred orbit of
threads. The **same content** travels between them via framer-motion shared-layout morphs.

**5 · MEMORY** (`src/lib/evolution/memory.ts`)
`localStorage: lattice.genome.v2` — genome, pins, expanded cards, affinity, trail, generation
count. Return visitors arrive mutated, primed and recognised (“GEN_02 // RETURNING”). One button
in the brain panel erases everything.

**6 · TRANSPARENCY — “see its brain” (press B)**
A live glass box: what it thinks of you (traits in human words), the four shapes' current fitness
scores, and the literal event log it just saw. Plus **⌘K / `/`** to jump anywhere or force a shape
(`go:orbit`), **M** to cycle shapes, **[ ]** to nudge its mind by hand.

---

## 🎬 The craft (we're not here to be subtle)

- **Terminal boot sequence** — typed `>` system lines, glitch-out, skippable
- **HUD cinematic hero** — giant Oswald type with RGB-split glitch, live telemetry readouts
  (lat/lon, node, generation), a 5000-point **Three.js neural wave** breathing behind everything
- **Three glowing doors** — READ CAREFULLY / EXPLORE WILDLY / SPEEDRUN (+ “or just start”) —
  the first three seconds are a trailer, not a nav bar
- **Shockwave morphs** — every evolution fires a full-screen shockwave while cards physically fly
  between structures on shared layout IDs
- **Typing banners** — every restructure is explained in plain English *before* the eye re-adjusts
- **Spotlight cards** — cursor-tracked glow, blur-up reveals, pin/expand/centre/“see it live”
- **Neon RESONATE DNA** — `#000000`/`#FF0055`/`#00F0FF`, noise, scanline, outline-fill type,
  mono HUD labels, glow borders everywhere

## 🧪 Prove it's intelligent

```bash
npm install
npm test        # 16/16 — engine, golden rule, content integrity
npm run build   # static export → out/
```

The regression suite (`test/engine.test.ts`) locks the promises:

- reader / explorer / speedrunner genomes select magazine / constellation / deck
- **hysteresis** — a weak challenger never steals the shape
- **golden rule** — clicking, reading and pinning can never move anything; only epochs can
- decay, bounded mutation, serialise/restore, prime-mode biasing
- every content link resolves; search and semantic distance behave

## 📁 Architecture

```
src/
  app/                  Next.js App Router shell (fonts, noise/scanline, metadata)
  components/
    boot.tsx            terminal loader
    hero.tsx            HUD hero + 3 doors
    particle-field.tsx  Three.js/R3F neural wave (client-only, ssr:false)
    experience.tsx      THE CONDUCTOR — act funnel, epochs, morph banners, keyboard
    cards/banner/brain/jump/chrome.tsx
    shapes/             magazine · constellation · deck · orbit
  lib/evolution/        content · telemetry · genome · scheduler · memory
out/                    static export (the CDN-served build)
test/engine.test.ts     16 assertions of intelligence
```

**The act funnel** (in `experience.tsx`) is the contract: every action runs
*senses → belief → selection → attention bookkeeping → evolution?* — and only the last step may
reorder hierarchy.

---

## 💌 Contact

- **Email** — `contact@anujphulera.dev` *(placeholder — swap in one line in `src/lib/evolution/content.ts`)*
- **GitHub** — [UCHIHA-MADARA-ANUJ](https://github.com/UCHIHA-MADARA-ANUJ)

> 「The world you desire is an illusion — wake up to reality.」
>
> Built for **WEBX**. First prize is the *minimum* spec. ◈
