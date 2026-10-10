/**
 * LATTICE — controller
 * The conductor between senses (telemetry), belief (genome),
 * selection (scheduler) and bodies (paradigms).
 *
 * Every user action is an evolutionary event:
 *   action → telemetry → trait deltas → fitness re-eval → (maybe) restructure
 */

import { UNIT_IDS, UNIT_MAP, hash01, searchUnits } from "./content.js";
import { createTelemetry } from "./engine/telemetry.js";
import {
  neutralGenome,
  applyEvent,
  decay,
  mutate,
  traitWord,
} from "./engine/genome.js";
import { createScheduler, PARADIGMS } from "./engine/scheduler.js";
import { loadState, saveState, clearState } from "./engine/memory.js";
import { createCard, updateCard, refreshAllCards } from "./ui/cards.js";
import { flipMorph } from "./ui/morph.js";
import { buildChrome } from "./ui/shell.js";
import { buildInspector } from "./ui/inspector.js";
import { createLinear } from "./ui/paradigms/linear.js";
import { createSpatial } from "./ui/paradigms/spatial.js";
import { createOrbital } from "./ui/paradigms/orbital.js";
import { createCommand } from "./ui/paradigms/command.js";
import { createDeck } from "./ui/paradigms/deck.js";
import { createGrid } from "./ui/paradigms/grid.js";

const FACTORIES = {
  linear: createLinear,
  spatial: createSpatial,
  orbital: createOrbital,
  command: createCommand,
  deck: createDeck,
  grid: createGrid,
};

export function boot() {
  /* ---------------- memory: generation N ---------------- */
  const saved = loadState();
  const generation = (saved?.generation || 0) + 1;

  const genome = saved?.genome ? { ...neutralGenome(), ...saved.genome } : neutralGenome();

  const state = {
    expanded: new Set(saved?.expanded || []),
    pins: new Set(saved?.pins || []),
    seen: new Set(saved?.seen || []),
    focusId: saved?.focusId || UNIT_IDS[0],
    trail: saved?.trail || [],
    tagFilter: null,
    gridGroup: "all",
    deck: {
      index: 0,
      kept: new Set(),
      skipped: new Set(),
    },
    affinity: new Map(saved?.affinity || UNIT_IDS.map((id) => [id, 0])),
    promoted: { ...(saved?.promoted || {}) },
    paradigm: null,
    paradigmName: "",
  };

  const telemetry = createTelemetry();
  const scheduler = createScheduler({ genome });
  if (saved?.scheduler) scheduler.restore(saved.scheduler);
  scheduler.restore({ current: saved?.lastParadigm || "linear" });

  /* cross-visit procedural state: the surface mutates on return */
  let mutationNote = null;
  if (generation >= 2) {
    const strength = Math.min(0.22, 0.1 + generation * 0.02);
    mutate(genome, strength);
    const rankedFit = scheduler.fitnesses();
    const best = rankedFit[0];
    if (best.id !== scheduler.current) {
      scheduler.force(best.id, "return-visit");
      mutationNote = `gen ${String(generation).padStart(2, "0")} · genome mutated while you were away — restructured to ${PARADIGMS[best.id].name}`;
    } else {
      mutationNote = `gen ${String(generation).padStart(2, "0")} · your genome was remembered and pushed further`;
    }
  }

  /* ---------------- DOM scaffold ---------------- */
  const chromeHost = document.getElementById("chrome");
  const navHost = document.getElementById("nav-host");
  const mainHost = document.getElementById("main-host");
  const frame = document.getElementById("frame");
  const toastHost = document.getElementById("toast-host");
  const liveRegion = document.getElementById("live-region");
  const jumpEl = document.getElementById("jump");
  const jumpInput = document.getElementById("jump-input");
  const jumpResults = document.getElementById("jump-results");

  const cards = new Map();
  const ctxBase = {
    state,
    genome,
    affinity: state.affinity,
    promoted: state.promoted,
    cards,
    act,
    get ranked() {
      return rankedUnits();
    },
  };
  for (const id of UNIT_IDS) {
    cards.set(id, createCard(id, { act }));
    cards.get(id).dataset.title = UNIT_MAP.get(id).title;
  }

  const chrome = buildChrome(chromeHost, {
    openJump,
    toggleInspector,
  });
  chrome.setGeneration(generation);

  const inspector = buildInspector(document.body, {
    toggleInspector,
    forceParadigm(id) {
      telemetry.recordAction("force-paradigm", { via: "inspector" });
      applyEvent(genome, { type: "force-paradigm" });
      const decision = scheduler.force(id, "manual");
      if (decision) restructure(decision);
    },
    reset() {
      clearState();
      location.reload();
    },
  });

  /* ---------------- hierarchy ---------------- */
  function rankedUnits() {
    return [...UNIT_IDS].sort((a, b) => score(b) - score(a));
  }
  function score(id) {
    const aff = state.affinity.get(id) || 0;
    return (
      aff * 2.1 +
      (state.pins.has(id) ? 1.1 : 0) +
      (state.seen.has(id) ? -0.3 : 0.8) +
      hash01(id + ":" + generation) * 0.2
    );
  }

  function bumpAffinity(id, amount) {
    if (!id) return;
    state.affinity.set(id, (state.affinity.get(id) || 0) + amount);
  }

  /* ---------------- restructuring ---------------- */
  function resetCardStyles() {
    for (const el of cards.values()) {
      el.style.cssText = "";
      el.classList.remove("is-hub", "is-satellite", "is-dimmed", "is-span2", "is-swipe-keep", "is-swipe-skip");
      el.removeAttribute("aria-hidden");
    }
    refreshAllCards(cards, state, state.promoted);
  }

  function renderParadigm() {
    const id = scheduler.current;
    const factory = FACTORIES[id];
    if (!factory) return;

    resetCardStyles();
    state.paradigm = id;
    state.paradigmName = PARADIGMS[id].name;

    const ranked = rankedUnits();
    const view = factory({
      ...ctxBase,
      ranked,
      recentEvents: telemetry.events,
      telemetryStats: telemetry.snapshot().stats,
    });

    navHost.replaceChildren(view.nav);
    mainHost.replaceChildren(view.main);
    document.body.dataset.paradigm = id;
    frame.dataset.layout = view.layout;
    refreshAllCards(cards, state, state.promoted);
    chrome.setParadigm(PARADIGMS[id].name);
  }

  function restructure(decision) {
    frame.classList.add("is-restructuring");
    chrome.pulseRestructure();
    flipMorph(renderParadigm).then(() => {
      frame.classList.remove("is-restructuring");
    });
    const from = PARADIGMS[decision.from]?.name || decision.from;
    const to = PARADIGMS[decision.to].name;
    announce(`Interface restructured: ${from} → ${to}. ${PARADIGMS[decision.to].blurb}`);
    showToast(
      decision.reason === "manual" ? "manual override" : "evolution epoch",
      `Structure: ${from} → ${to}`,
      decision.why
    );
  }

  function announce(msg) {
    liveRegion.textContent = msg;
  }

  function showToast(kicker, text, why, amber = false) {
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `
      <div class="toast__kicker ${amber ? "toast__kicker--amber" : ""}">${kicker}</div>
      <div class="toast__text">${text}</div>
      ${why ? `<div class="toast__why">${why}</div>` : ""}
    `;
    toastHost.appendChild(t);
    setTimeout(() => {
      t.classList.add("is-out");
      setTimeout(() => t.remove(), 400);
    }, 5200);
  }

  /* ---------------- quick jump (invariant escape hatch) ---------------- */
  let jumpActiveIdx = 0;
  function openJump(v = true) {
    jumpEl.hidden = !v;
    if (v) {
      jumpInput.value = "";
      renderJump("");
      jumpInput.focus();
    }
  }
  function renderJump(q) {
    const results = searchUnits(q, state.affinity).slice(0, 7);
    jumpActiveIdx = 0;
    jumpResults.innerHTML = "";
    results.forEach((u, i) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      if (i === 0) b.classList.add("is-active");
      b.innerHTML = `<span class="r-title">${u.title}</span><span class="r-meta">${u.tags[0]} · ${u.minutes} min</span>`;
      b.addEventListener("click", () => {
        openJump(false);
        act("jump", { unitId: u.id, via: "jump" });
      });
      li.appendChild(b);
      jumpResults.appendChild(li);
    });
  }
  jumpInput.addEventListener("input", () => renderJump(jumpInput.value));
  jumpInput.addEventListener("keydown", (e) => {
    e.stopPropagation();
    const btns = [...jumpResults.querySelectorAll("button")];
    if (e.key === "ArrowDown") {
      e.preventDefault();
      jumpActiveIdx = Math.min(btns.length - 1, jumpActiveIdx + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      jumpActiveIdx = Math.max(0, jumpActiveIdx - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      btns[jumpActiveIdx]?.click();
      return;
    } else if (e.key === "Escape") {
      openJump(false);
      return;
    } else return;
    btns.forEach((b, i) => b.classList.toggle("is-active", i === jumpActiveIdx));
    btns[jumpActiveIdx]?.scrollIntoView({ block: "nearest" });
  });
  jumpEl.querySelector("[data-jump-close]").addEventListener("click", () => openJump(false));

  function toggleInspector(v) {
    const open = v === undefined ? !inspector.isOpen() : v;
    inspector.open(open);
  }

  /* ---------------- focus tracking ---------------- */
  function setFocus(id, { seen = true } = {}) {
    if (!id || !UNIT_MAP.has(id)) return;
    state.focusId = id;
    if (seen) {
      state.seen.add(id);
      telemetry.setDwellTarget(id);
    }
    if (state.trail[state.trail.length - 1] !== id) {
      state.trail.push(id);
      if (state.trail.length > 12) state.trail.shift();
    }
    refreshAllCards(cards, state, state.promoted);
  }

  /* ---------------- the single action funnel ---------------- */
  function act(type, payload = {}) {
    const { unitId } = payload;
    state.promoted[type] = (state.promoted[type] || 0) + 1;
    let reRender = true;

    switch (type) {
      case "toggle": {
        const on = !state.expanded.has(unitId);
        if (on) state.expanded.add(unitId);
        else state.expanded.delete(unitId);
        telemetry.recordExpand(unitId, on);
        applyEvent(genome, { type: "expand", on });
        setFocus(unitId);
        break;
      }
      case "open": {
        const from = state.focusId;
        telemetry.recordOpen(unitId, payload.via || "open");
        applyEvent(genome, { type: "open", via: payload.via || "open" });
        if (from !== unitId) telemetry.recordTransition(from, unitId, payload.via || "open");
        state.expanded.add(unitId);
        setFocus(unitId);
        bumpAffinity(unitId, 0.45);
        requestAnimationFrame(() => {
          cards.get(unitId)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
        break;
      }
      case "jump": {
        telemetry.recordJump(unitId, payload.via || "jump");
        applyEvent(genome, { type: "jump" });
        telemetry.recordTransition(state.focusId, unitId, "jump");
        state.expanded.add(unitId);
        setFocus(unitId);
        bumpAffinity(unitId, 0.4);
        break;
      }
      case "rel": {
        const from = payload.from || state.focusId;
        telemetry.recordOpen(unitId, "relation");
        applyEvent(genome, { type: "open", via: "relation" });
        telemetry.recordTransition(from, unitId, "relation");
        state.expanded.add(unitId);
        setFocus(unitId);
        bumpAffinity(unitId, 0.55);
        bumpAffinity(from, 0.2);
        break;
      }
      case "orbit": {
        telemetry.recordAction("orbit", { unitId });
        applyEvent(genome, { type: "open", via: "satellite" });
        telemetry.recordTransition(state.focusId, unitId, "satellite");
        setFocus(unitId);
        bumpAffinity(unitId, 0.5);
        break;
      }
      case "focus": {
        setFocus(unitId);
        applyEvent(genome, { type: "open", via: "graze" });
        telemetry.recordAction("focus", { unitId });
        break;
      }
      case "pin": {
        const on = !state.pins.has(unitId);
        if (on) state.pins.add(unitId);
        else state.pins.delete(unitId);
        telemetry.recordPin(unitId, on);
        applyEvent(genome, { type: "pin", on });
        setFocus(unitId, { seen: false });
        bumpAffinity(unitId, 0.35);
        break;
      }
      case "next":
      case "prev": {
        const order = rankedUnits();
        const idx = Math.max(0, order.indexOf(state.focusId));
        const nextId = order[type === "next"
          ? Math.min(order.length - 1, idx + 1)
          : Math.max(0, idx - 1)];
        telemetry.recordOpen(nextId, type);
        applyEvent(genome, { type: "open", via: type });
        telemetry.recordTransition(state.focusId, nextId, type);
        state.expanded.add(nextId);
        setFocus(nextId);
        bumpAffinity(nextId, 0.3);
        requestAnimationFrame(() => {
          cards.get(nextId)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
        break;
      }
      case "keep":
      case "skip":
      case "open-card": {
        const order = rankedUnits();
        const currentId = order[state.deck.index];
        if (type === "keep") {
          if (currentId) {
            state.deck.kept.add(currentId);
            state.pins.add(currentId);
            telemetry.recordAction("triage", { unitId: currentId, verdict: "keep" });
            applyEvent(genome, { type: "triage", verdict: "keep" });
            bumpAffinity(currentId, 0.6);
          }
          state.deck.index += 1;
        } else if (type === "skip") {
          if (currentId) {
            state.deck.skipped.add(currentId);
            telemetry.recordAction("triage", { unitId: currentId, verdict: "skip" });
            applyEvent(genome, { type: "triage", verdict: "skip" });
            bumpAffinity(currentId, -0.2);
          }
          state.deck.index += 1;
        } else {
          if (currentId) {
            state.expanded.add(currentId);
            setFocus(currentId);
            telemetry.recordOpen(currentId, "triage");
            applyEvent(genome, { type: "open", via: "triage" });
            state.deck.index += 1;
          }
        }
        break;
      }
      case "reshuffle": {
        state.deck.index = 0;
        state.deck.skipped.clear();
        telemetry.recordAction("reshuffle", {});
        applyEvent(genome, { type: "command" });
        break;
      }
      case "filter-tag": {
        state.tagFilter = state.tagFilter === payload.tag ? null : payload.tag;
        telemetry.recordAction("filter-tag", { tag: state.tagFilter });
        break;
      }
      case "grid-group": {
        state.gridGroup = payload.group;
        telemetry.recordAction("grid-group", { group: payload.group });
        break;
      }
      case "evolve": {
        telemetry.recordAction("evolve", {});
        applyEvent(genome, { type: "command" });
        const decision = scheduler.maybeRestructure(true);
        if (decision) {
          restructure(decision);
          save();
          return; // paradigm render already happened
        } else {
          showToast("evolution epoch", "Incumbent structure survives — no challenger cleared the hysteresis margin.", "the golden rule: evolution, not chaos", true);
        }
        break;
      }
      default:
        telemetry.recordAction(type, payload);
        reRender = false;
    }

    // scheduling: every meaningful action is an evolutionary trial
    const decision = scheduler.onAction();
    if (decision) {
      restructure(decision);
      save();
      return;
    }

    if (reRender) {
      flipMorph(renderParadigm).then(() => {});
    }
    chrome.setGenome(genome);
    saveThrottled();
  }

  /* ---------------- persistence ---------------- */
  let lastSave = 0;
  function save() {
    saveState({
      generation,
      genome,
      pins: [...state.pins],
      seen: [...state.seen],
      expanded: [...state.expanded],
      focusId: state.focusId,
      trail: state.trail,
      affinity: [...state.affinity.entries()],
      promoted: state.promoted,
      lastParadigm: scheduler.current,
      scheduler: scheduler.serialize(),
    });
    lastSave = Date.now();
  }
  function saveThrottled() {
    if (Date.now() - lastSave > 4000) save();
  }
  addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      telemetry.markIdle();
      save();
    }
  });

  /* ---------------- global keys ---------------- */
  addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || "");
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openJump(true);
      return;
    }
    if (e.key === "Escape" && !jumpEl.hidden) {
      openJump(false);
      return;
    }
    if (typing) return;
    if (e.key === "/") {
      e.preventDefault();
      openJump(true);
      return;
    }
    if (e.key === "e" && !e.metaKey && !e.ctrlKey) {
      toggleInspector();
      return;
    }
    if (scheduler.current === "deck") {
      if (e.key === "ArrowLeft") act("skip", {});
      else if (e.key === "ArrowRight") act("keep", {});
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        act("open-card", {});
      }
    }
  });

  /* ---------------- the living clock ---------------- */
  const timers = new Set();
  let lastTick = performance.now();
  timers.add(setInterval(() => {
    const now = performance.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;

    const snap = telemetry.snapshot();
    const active = snap.lastGapMs < 20000;
    if (active) {
      decay(genome, dt * 1000);
      for (const [id, v] of state.affinity) {
        state.affinity.set(id, v * 0.997);
      }
      const decision = scheduler.onTick(dt);
      if (decision) {
        restructure(decision);
        save();
        return;
      }
      chrome.setGenome(genome);
      inspector.render({
        genome,
        fitnesses: scheduler.fitnesses(),
        current: scheduler.current,
        events: telemetry.events,
      });
      saveThrottled();
    }
  }, 1000));

  /* ---------------- resize: spatial field re-measures ---------------- */
  let resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => renderParadigm(), 260);
  });

  /* ---------------- boot ---------------- */
  renderParadigm();
  chrome.setGenome(genome);
  inspector.render({
    genome,
    fitnesses: scheduler.fitnesses(),
    current: scheduler.current,
    events: telemetry.events,
  });

  timers.add(setTimeout(() => {
    if (mutationNote) showToast("procedural state", mutationNote, `traits after mutation: ${traitWord("linearity", genome.linearity)} · ${traitWord("pace", genome.pace)} · ${traitWord("depth", genome.depth)}`, true);
    else
      showToast(
        "the interface is listening",
        "Your pace, trajectory, depth and agency are rewriting this structure in real time.",
        "open the engine panel (key E) to watch it think",
        true
      );
    announce(`LATTICE ready. Structure: ${PARADIGMS[scheduler.current].name}. Press E to inspect the engine.`);
  }, 1200));

  /** teardown — used by tests; the page itself lives until closed */
  return {
    stop() {
      for (const t of timers) clearInterval(t);
      timers.clear();
    },
  };
}
