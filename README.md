# ANUJ PHULERA — the impossible interface

**My portfolio has no fixed layout.** It watches how you browse — pace, trajectory,
depth, agency — then *physically rebuilds itself* into a different kind of website
around you. A careful reader gets a magazine. A wild explorer gets a constellation.
A speedrunner gets a swipe deck. Two visitors end up in structurally different
portfolios built from the same story.

> Built for **WEBX · The Impossible Interface** challenge.
> The story never changes. The shape it's told in always does.

**Live →** https://cdn.jsdelivr.net/gh/UCHIHA-MADARA-ANUJ/WEBX-WINNER@3a6c365/index.html
*(verified CDN mirror of this branch)*
**GitHub Pages →** https://uchiha-madara-anuj.github.io/WEBX-WINNER/ — *Settings → Pages → Deploy from a branch → `arena/df15d562-webx-winner` / root.*
**Source →** https://github.com/UCHIHA-MADARA-ANUJ/WEBX-WINNER (PR [#1](https://github.com/UCHIHA-MADARA-ANUJ/WEBX-WINNER/pull/1))

---

## The visitor workflow

1. **Cinematic landing** — name, creed, and three glowing doors:
   📖 **READ CAREFULLY** · 🗺️ **EXPLORE WILDLY** · 💳 **SPEEDRUN** (or *"just start"*).
   Each door declares intent — the genome listens, and the first big morph
   happens before you finish clicking.
2. **The living surface** — real portfolio content: Verde, RESONATE, SkillVerse,
   Nirmaan, the MUN circuit, skills, story, contact. The brain watches *how* you move.
3. **THE MORPH** — when it has you figured out, every card physically flies into a
   new structure (FLIP + stagger + crimson glow), with a plain-English banner:
   *"You read with patience → the site rebuilt itself as a magazine."*
4. **Memory** — come back tomorrow: the genome has mutated overnight and the site
   may open in a different shape entirely.

## The four shapes (structure, not themes)

| Shape | Kind of website | Nav model | Hierarchy | Born for |
|---|---|---|---|---|
| 📖 **Magazine** | editorial spread | chapter rail + progress | the re-rankable sequence | calm, deep readers |
| 🗺️ **Constellation** | star-map of work | position & proximity | affinity-driven placement | wild explorers |
| 💳 **Swipe Deck** | full-screen triage | the queue + keep/skip | live decision order | speedrunners |
| 🌀 **Orbit** | hub & spoke | the orbit trail | relatedness radius | thread-followers |

This is **not** theme-swapping or shuffled `<div>`s (explicitly out of scope).
The navigation model, information hierarchy, primary action set and page topology
all change — and the same cards keep **persistent DOM identity**, so the morphs are
one organism rearranging its body, not a page reload.

---

## The Evolution Engine

```
   ┌─────────────┐  events   ┌─────────┐  deltas  ┌──────────┐
   │  TELEMETRY  │ ────────► │  GENOME │ ───────► │  FITNESS │
   │  (senses)   │           │(belief) │          │ (select) │
   └──────┬──────┘           └────┬────┘          └─────┬────┘
          │ dwell · pace          │ 5 traits [0..1]      │ vs 4 ideals
          │ trajectory · depth    │ decay → 0.5          │ + novelty
          │ agency · keyboard     │ mutate across visits │ − revisit
          ▼                       ▼                     ▼
     event ring             localStorage         ┌─────────────┐
     (human words)          (generation N)        │  SCHEDULER  │
                                                  │ epochs ·    │
                                                  │ hysteresis  │
                                                  └──────┬──────┘
                                                         ▼
                                             THE MORPH (FLIP + banner)
```

### What it tracks (all local, all inspectable, all erasable — press **B**)

| Signal | Feeds |
|---|---|
| dwell (ms per card) | `depth`, `pace` |
| inter-action gaps + scroll velocity | `pace` |
| transitions vs. declared threads | `linearity` |
| expand/read vs. graze/skip | `depth` |
| pins, jumps, deliberate choices | `agency` |
| ⌘K palette / deck keys | `keyboard` |
| per-project affinity | information hierarchy |
| visit `generation` | cross-visit mutation |

### How it decides

- **Genome:** five traits in `[0,1]` — `linearity · pace · depth · agency · keyboard`.
  Small **bounded** deltas per event (no single click dominates), **decay toward 0.5**
  with a ~90s half-life — so recent behaviour rules.
- **Fitness:** similarity between your genome and each shape's ideal profile, plus
  **novelty pressure** (grows the longer you stay — the site is never permanently
  static) minus a **revisit penalty** (no thrashing back to the shape you just left).
- **Epochs:** structural review every ~10 actions or ~50 active seconds. A switch
  happens only if the challenger beats the incumbent by **hysteresis (0.07)**.
- **Procedural state:** `localStorage` keeps genome, affinity, pins, promoted
  actions. On visit N ≥ 2 the genome **mutates** (bounded random walk) and the site
  may boot into a different shape — *"the genome mutated while you were away."*
- **Declared intent:** the three doors apply a `prime` event — a loud, honest prior.

### The golden rule: usable, navigable, consistent

- **Reachability invariant** — ⌘K / `Ctrl+K` / `/` quick-jump works in every shape
- **Stable identity** — cards keep their DOM identity across every morph
- **Legible intelligence** — every restructure is announced (`aria-live`) *and*
  explained in plain English; **B** opens *"see its brain"* (live traits in human
  words, the four shapes competing, the raw event stream, erase button)
- **Accessibility** — keyboard support throughout, focus rings, and a honest
  `prefers-reduced-motion` fallback (no flights — the structure still visibly changes)

---

## Seeing two visitors diverge

1. **Visitor A:** click 📖 READ CAREFULLY, read cards slowly, use *Next story*.
   → `depth ↑ pace ↓ linearity ↑` → stays in **Magazine**, chapters re-order
   around what they finish.
2. **Visitor B:** click 🗺️ EXPLORE WILDLY, ⌘K-jump between distant projects,
   follow threads. → `agency ↑ linearity ↓` → morphs to **Constellation** → **Orbit**.
3. Press **B** on both and compare the brains.

## Run locally

```bash
python3 -m http.server 4173     # → http://localhost:4173
npm install && npm test         # 15 tests: engine units + jsdom UI smoke
```

Zero runtime dependencies, no build step. `jsdom` is dev-only.

## Repository map

```
assets/                      6 cinematic key visuals (generated)
index.html                   shell: hero host, chrome, frame, banners, jump
css/  base · shapes · motion design system · the four bodies · FLIP cinema
js/
  content.js                 the story (PROFILE + 12 units) — the constants
  engine/  telemetry · genome · scheduler · memory   ← the Evolution Engine
  ui/  cards · morph · shell · hero · banner · brain
       shapes/ magazine · map · deck · orbit         ← the four bodies
  controller.js              act → sense → evolve → morph
test/  engine.test.mjs · dom.smoke.mjs
```

---

*The interface you are using is one individual in a population of possible
interfaces. Your behaviour is the selection pressure. Wake up to reality.*
