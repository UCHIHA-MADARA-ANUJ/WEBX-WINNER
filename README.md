# WEBX — The Evolution Engine

A website with no fixed interface. Its structure — navigation, hierarchy, what is
prominent, how sections connect, and how you move between them — is rebuilt around
how each visitor actually behaves. Two visitors who interact differently end up in
structurally different versions of the same site.

Zero dependencies, no build step. Plain HTML, CSS and ES modules.

```bash
npm start        # http://localhost:8080  (binds 0.0.0.0)
npm test         # engine unit tests (node:test)
```

## The rule that never changes

Every structure shows the same five sections and the same entries, and the header
always reaches any section. Only the *arrangement and paradigm* change — never the
reachability. The shell's `contact`, `ls` and `cat` work in every structure.

## What the engine observes

All signals stay in the browser (`localStorage`, key `webx.evolution.v1`). Nothing is
sent anywhere. The profile is a sliding window of the last 120 events, so it forgets
old habits as new ones form.

| Signal | Captured from | Meaning |
|---|---|---|
| **Sequence** | section changes (`from → to`) | Sequential moves vs. backtracks/skips |
| **Dwell** | time between section changes (capped at 2 min) | Slow reading vs. skimming |
| **Scroll pace** | smoothed px/s, ignoring the site's own smooth scrolls | Calm vs. fast scrolling |
| **Interest** | clicks per topic | Concentration of attention on one section |
| **Hesitation** | lingering ≥1.2 s over an entry without clicking | Undecided exploration |
| **Command use** | terminal commands and the `/` palette | Keyboard/shell-first behaviour |
| **Memory** | `visits`, `generation`, last structure and focus | Cross-visit learning |

## How it decides

`src/engine/profile.js` derives metrics from the window and scores all five structures
(each in 0–1):

- **Chronicle** = 0.6·sequential + 0.2·slow dwell + 0.2·calm scroll
- **Atlas** = 0.5·non-sequential + 0.3·breadth of sections touched + 0.2·hesitation
- **Index** = 0.6·fast scroll + 0.4·short dwell (needs both signals)
- **Deck** = 0.7·interest concentration + 0.3·deep dwell
- **Terminal** = command ratio × 2.5 (needs ≥3 commands)

Decision rules, so the site never thrashes:

1. Evidence first: at least 5 navigations or 3 commands.
2. The current structure gets a +0.08 hysteresis bonus.
3. The challenger must lead by ≥0.12.
4. At least 6 navigations must happen between transformations (cooldown).
5. Manually choosing a structure pins it. Auto-evolve can be resumed from the dock.

When the engine moves, the interface shows a veil ("Rebuilding structure"), rebuilds
the DOM, and explains why ("you jump between sections (67% non-sequential moves)") with
**Revert** and **Keep** actions. The **Observer** panel shows every signal, every score,
and the evolution history, and has a "Forget me" reset.

## The five structural states

1. **Chronicle** — a linear editorial scroll with scroll-linked focus. Reading order is the map.
2. **Atlas** — a spatial constellation of nodes and edges, with a focus panel. Relationships are drawn, not listed.
3. **Terminal** — the site as a shell (`ls`, `cat`, `open`, `goto`, `mode`, `whoami`, `contact`).
4. **Index** — a dense, filterable catalogue of every entry for people who skim.
5. **Deck** — one section held in focus at a time, stepped with arrows or buttons.

Focus (the current section) survives every transformation, so you never lose your place.
The `/` palette opens the same shell from anywhere.

## Layout of the code

```
index.html            shell: header, dock, observer, dialogs
styles.css            all five structures + chrome, responsive
src/app.js            orchestrator: capture → engine → rebuild, UI wiring
src/engine/profile.js pure engine: reduce(), metrics(), evaluate()   ← the algorithm
src/engine/store.js   localStorage persistence
src/content.js        the single content model shared by every structure
src/commands.js       command grammar (terminal + palette)
src/console.js        reusable console component
src/views/*.js        the five structures (mount / sync / destroy)
tests/engine.test.mjs unit tests for the engine
server.mjs            zero-dependency static server
```

## Ideas for next steps

- Per-element structural memory (e.g. entries you return to become pinned in Index).
- Shared "drift" metrics across visitors, shown in the Drift Index experiment.
- A/B-free evaluation harness that replays synthetic personas through `evaluate`.
