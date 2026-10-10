# LATTICE — the impossible interface

**A living web surface with no fixed interface.** Navigation, information
hierarchy, available actions and element placement are not designed once —
they are *grown*, continuously, around the behaviour of whoever is visiting.
Two people who move differently through LATTICE will end up navigating
structurally different versions of the same website.

> The ideas never change. Everything else does.

**Live →** https://cdn.jsdelivr.net/gh/UCHIHA-MADARA-ANUJ/WEBX-WINNER@arena/df15d562-webx-winner/index.html
(instant CDN mirror of this branch — verified serving)

**GitHub Pages →** https://uchiha-madara-anuj.github.io/WEBX-WINNER/
*Settings → Pages → Deploy from a branch → `arena/df15d562-webx-winner` / root.*
(A deploy-from-Actions template is in `docs/github-pages.yml.example`.)

---

## Why this is not "just a re-skin"

Changing themes, colors, fonts, or randomly shuffling `<div>`s is explicitly
out of scope — and LATTICE does none of those things. What evolves is the
**core structural paradigm** of the interface itself: the navigation model,
the hierarchy, the primary action set, and the topology of the page.

The same ten ideas (cards, with persistent DOM identity) are re-parented,
re-proportioned and re-ordered into **six genuinely different navigation
organisms** — and the transitions between them are physical: FLIP-morphed,
with the cards flying from their old coordinates to their new ones.

| Paradigm | Structural model | Nav = | Hierarchy = | For whom |
|---|---|---|---|---|
| **Editorial** `linear` | chaptered long-form document | progress rail + prev/next | the sequence itself | sequential, deliberate readers |
| **Constellation** `spatial` | 2D field of nodes, semantic edges | position & proximity | radial placement by affinity | wanderers, explorers |
| **Orbital** `orbital` | hub-and-spoke association | the orbit trail | relatedness radius | associative, non-linear thinkers |
| **Terminal** `command` | keyboard-first command surface | command history | usage frequency of actions | fast, autonomous, keyboard users |
| **Triage** `deck` | decision stack (keep / skip / open) | the queue | live triage order | rapid scanners |
| **Dashboard** `grid` | modular widgets + digest | tabs & groups | pins and spans | task-oriented returners |

Within each paradigm the structure keeps moving: the chapter order is
re-ranked by affinity, pins widen widgets into `span-2` hubs, promoted
actions physically grow (unused ones shrink and demote), and the density of
the layout scales with how slowly you read.

---

## The Evolution Engine

```
   ┌──────────────┐   events   ┌──────────┐  trait deltas  ┌─────────┐
   │  TELEMETRY   │ ─────────► │  GENOME  │ ─────────────► │ FITNESS │
   │  (senses)    │            │ (belief) │                │ (select)│
   └──────┬───────┘            └────┬─────┘                └────┬────┘
          │ dwell · pace            │ 5 traits in [0,1]          │ vs 6 ideals
          │ trajectory · depth      │ decay → 0.5               │ + novelty
          │ agency · keyboard       │ mutate across visits       │ − revisit
          ▼                         ▼                           ▼
   raw event ring            localStorage                ┌──────────────┐
   (180 events)              (generation N)               │  SCHEDULER   │
                                                          │ epochs ·     │
                                                          │ hysteresis · │
                                                          │ restructuring│
                                                          └──────┬───────┘
                                                                 ▼
                                                    FLIP morph → new body
                                                    (cards keep identity)
```

### 1 · What it tracks (all local, all inspectable, all erasable)

| Signal | Sensor | Feeds trait |
|---|---|---|
| **Dwell** | ms spent inside each idea | `depth`, `pace` |
| **Pace** | EMA of inter-action gaps + scroll velocity | `pace` |
| **Trajectory** | transitions across the semantic graph vs. declared links | `linearity` |
| **Depth** | expand/read vs. graze/skip | `depth` |
| **Agency** | pins, jumps, commands, manual navigation | `agency` |
| **Keyboard** | command surface & jump palette usage | `keyboard` |
| **Affinity** | per-idea score from opens, dwell, pins | information hierarchy |
| **Generation** | visit counter in `localStorage` | cross-visit mutation |

Nothing leaves the browser. Press **E** (or the *engine* button) to open the
inspector: live trait bars, live paradigm fitness, the raw event stream, and
an `erase memory` control.

### 2 · The genome — a five-trait belief vector

`linearity · pace · depth · agency · keyboard`, each in `[0, 1]`.
Every event nudges traits by small **bounded** deltas (no single click can
dominate — only sustained patterns). Traits **decay toward 0.5** with a ~90s
half-life, so recent behaviour dominates: weather has to become climate.

### 3 · How it decides to adapt

Each of the six paradigms declares an **ideal behavioural profile** (e.g.
Terminal ideal ≈ `keyboard 0.95, agency 0.94, pace 0.82, linearity 0.26`).
Fitness = similarity between your current genome and that ideal, plus:

- **Novelty pressure** — grows the longer you stay in one paradigm (capped),
  so the surface is never permanently static
- **Revisit penalty** — the paradigm you just left must work harder to win
  you back → no thrashing

**Epochs** (structural review points) fire every **11 meaningful actions**
or **55 s** of active use. A switch happens only when the challenger beats
the incumbent by a **hysteresis margin (0.07)** — *evolution, not chaos.*
Every restructuring is announced (ARIA live region) and explained in a toast:
why you moved, and what about your behaviour caused it.

### 4 · Cross-visit procedural state

State persists in `localStorage` (`generation`, genome, affinity map, pins,
promoted actions, scheduler log). On **visit N ≥ 2** the genome is
**mutated** (bounded random walk, strength grows with generation) and the
surface may boot into a different paradigm entirely. Your third visit is
shaped by everything the first two taught the engine.

### 5 · The golden rule: usable, navigable, consistent

- **Reachability invariant** — every idea is always reachable: the quick-jump
  palette (`⌘K` / `Ctrl+K` / `/`) works in *every* paradigm
- **Stable identity** — cards keep their DOM identity across restructures
  (FLIP morphs, not page reloads); pins and progress survive every shift
- **Legible intelligence** — the inspector shows exactly what the engine
  believes and why each decision was made
- **Accessibility** — full keyboard support, focus rings, `aria-live`
  restructuring announcements, honest `prefers-reduced-motion` fallback
  (crossfade instead of flights — structure still visibly changes)

---

## Seeing two users diverge

1. **User A — the reader:** open an idea, read it slowly, click *Next*.
   Stay on each card > 12 s. → `linearity ↑ depth ↑ pace ↓` → the surface
   settles into **Editorial** and re-orders chapters around what you finish.
2. **User B — the jumper:** press `⌘K`, jump between distant ideas fast,
   open the Terminal (`E` → force, or just behave this way), type commands.
   → `agency ↑ keyboard ↑ linearity ↓ pace ↑` → **Terminal** or **Triage**,
   with the action set re-ranked around commands and jumps.
3. Then open the inspector on both and compare the genomes, the fitness
   ranking, and the structure you are each standing in.

Want to see everything immediately? The inspector's **force structure** chips
override the engine (a manual override is itself recorded as agency).

---

## Run it locally

```bash
# any static server works — there is no build step
python3 -m http.server 4173        # → http://localhost:4173

# tests: engine unit tests + jsdom UI smoke tests
npm install
npm test
```

Built with zero runtime dependencies: hand-rolled ES modules, CSS custom
properties, FLIP animations. `jsdom` is a dev-only test dependency.

## Repository map

```
index.html                 shell: chrome host, nav host, main host, jump palette
css/
  base.css                 design system + shared card anatomy + inspector
  paradigms.css            the six structural bodies
  transitions.css          FLIP / morph / reduced-motion
js/
  content.js               the ten ideas (the only constants)
  engine/
    telemetry.js           senses: dwell, pace, trajectory, depth, agency
    genome.js              belief vector: 5 traits, bounded deltas, decay
    scheduler.js           selection: fitness, novelty, hysteresis, epochs
    memory.js              cross-visit procedural state (localStorage)
  ui/
    cards.js               persistent card identity + action promotion
    morph.js               FLIP structural morphing
    shell.js               chrome + live genome pulse
    inspector.js           the glass box
    paradigms/*.js         the six bodies: linear spatial orbital command deck grid
  controller.js            the single action funnel: act → sense → evolve → morph
test/
  engine.test.mjs          genome & scheduler behaviour (node:test)
  dom.smoke.mjs            boots the real UI in jsdom, walks real interactions
```

---

*LATTICE — the interface you are using is one individual in a population of
possible interfaces. Your behaviour is the selection pressure.*
