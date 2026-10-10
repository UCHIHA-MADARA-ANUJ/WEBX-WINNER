/**
 * CONTROLLER — the conductor
 * Every user action is an evolutionary event:
 *   action → telemetry → trait deltas → fitness → (maybe) THE MORPH
 */

import { UNIT_IDS, UNIT_MAP, hash01, searchUnits, PROFILE } from "./content.js";
import { createTelemetry } from "./engine/telemetry.js";
import { neutralGenome, applyEvent, decay, mutate, traitWord } from "./engine/genome.js";
import { createScheduler, PARADIGMS } from "./engine/scheduler.js";
import { loadState, saveState, clearState } from "./engine/memory.js";
import { createCard, updateCard, refreshAllCards } from "./ui/cards.js";
import { flipMorph } from "./ui/morph.js";
import { buildChrome } from "./ui/shell.js";
import { buildBrain } from "./ui/brain.js";
import { mountHero } from "./ui/hero.js";
import { showBanner } from "./ui/banner.js";
import { createMagazine } from "./ui/shapes/magazine.js";
import { createMap } from "./ui/shapes/map.js";
import { createDeck } from "./ui/shapes/deck.js";
import { createOrbit } from "./ui/shapes/orbit.js";

const FACTORIES = {
  magazine: createMagazine,
  map: createMap,
  deck: createDeck,
  orbit: createOrbit,
};

const MODE_TO_SHAPE = {
  reader: "magazine",
  explorer: "map",
  speedrunner: "deck",
};

export function boot() {
  /* ---------------- memory: generation N ---------------- */
  const saved = loadState();
  const generation = (saved?.generation || 0) + 1;
  const genome = saved?.genome ? { ...neutralGenome(), ...saved.genome } : neutralGenome();

  const state = {
    generation,
    expanded: new Set(saved?.expanded || []),
    pins: new Set(saved?.pins || []),
    seen: new Set(saved?.seen || []),
    focusId: saved?.focusId || "verde",
    trail: saved?.trail || [],
    tagFilter: null,
    deck: { index: 0, kept: new Set(), skipped: new Set() },
    affinity: new Map(saved?.affinity || UNIT_IDS.map((id) => [id, 0])),
    promoted: { ...(saved?.promoted || {}) },
    shape: null,
  };

  const telemetry = createTelemetry();
  const scheduler = createScheduler({ genome });
  if (saved?.scheduler) scheduler.restore(saved.scheduler);
  scheduler.restore({ current: saved?.lastShape || "magazine" });

  let mutationNote = null;
  if (generation >= 2) {
    mutate(genome, Math.min(0.22, 0.1 + generation * 0.02));
    const best = scheduler.fitnesses()[0];
    if (best.id !== scheduler.current) {
      scheduler.force(best.id, "return-visit");
      mutationNote = `It's been here before — the genome mutated while you were away. The site now opens as ${PARADIGMS[best.id].name.toUpperCase()}.`;
    } else {
      mutationNote = `Generation ${String(generation).padStart(2, "0")} — it remembers you, and pushed further.`;
    }
  }

  /* ---------------- DOM scaffold ---------------- */
  const chromeHost = document.getElementById("chrome");
  const navHost = document.getElementById("nav-host");
  const mainHost = document.getElementById("main-host");
  const frame = document.getElementById("frame");
  const bannerHost = document.getElementById("banner-host");
  const liveRegion = document.getElementById("live-region");
  const heroHost = document.getElementById("hero-host");
  const jumpEl = document.getElementById("jump");
  const jumpInput = document.getElementById("jump-input");
  const jumpResults = document.getElementById("jump-results");

  const cards = new Map();
  for (const id of UNIT_IDS) {
    cards.set(id, createCard(id, { act }));
  }

  const chrome = buildChrome(chromeHost, { toggleBrain });
  chrome.setGeneration(generation);

  const brain = buildBrain(document.body, {
    toggleBrain,
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
    return (
      (state.affinity.get(id) || 0) * 2.1 +
      (state.pins.has(id) ? 1.1 : 0) +
      (state.seen.has(id) ? -0.3 : 0.8) +
      hash01(id + ":" + generation) * 0.2
    );
  }
  function bumpAffinity(id, amount) {
    if (!id) return;
    state.affinity.set(id, (state.affinity.get(id) || 0) + amount);
  }

  /* ---------------- shapes ---------------- */
  function resetCardStyles() {
    for (const el of cards.values()) {
      el.style.cssText = "";
      el.classList.remove("is-hub", "is-satellite", "is-dimmed", "is-span2", "is-star", "is-deck-card", "is-swipe-keep", "is-swipe-skip");
      el.removeAttribute("aria-hidden");
    }
    refreshAllCards(cards, state, state.promoted);
  }

  function renderShape() {
    const id = scheduler.current;
    const factory = FACTORIES[id];
    if (!factory) return;
    resetCardStyles();
    state.shape = id;
    const view = factory({
      state,
      genome,
      affinity: state.affinity,
      promoted: state.promoted,
      cards,
      act,
      ranked: rankedUnits(),
      recentEvents: telemetry.events,
    });
    navHost.replaceChildren(view.nav);
    mainHost.replaceChildren(view.main);
    document.body.dataset.shape = id;
    frame.dataset.layout = view.layout;
    refreshAllCards(cards, state, state.promoted);
    chrome.setShape(PARADIGMS[id].glyph, PARADIGMS[id].name);
  }

  function restructure(decision, { silent = false } = {}) {
    chrome.pulse();
    flipMorph(renderShape);
    const to = PARADIGMS[decision.to];
    const from = PARADIGMS[decision.from];
    announce(`The site rebuilt itself: ${from?.name || ""} → ${to.name}. ${to.blurb}.`);
    if (!silent) {
      showBanner(
        {
          glyph: to.glyph,
          kicker: decision.reason === "manual" ? "YOU CHOSE THIS" : "THE SITE IS REBUILDING ITSELF",
          headline: to.explain,
          sub: `structure: ${from?.name || "…"} → ${to.name} · ${to.blurb}`,
        },
        bannerHost
      );
    }
    if (document.getElementById("brain-btn")) chrome.setShape(to.glyph, to.name);
  }

  function announce(msg) {
    liveRegion.textContent = msg;
  }

  /* ---------------- jump palette (always-on escape hatch) ---------------- */
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
      b.innerHTML = `<span class="r-title">${u.title}</span><span class="r-meta">${u.kind} · ${u.stack}</span>`;
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

  function toggleBrain(v) {
    const open = v === undefined ? !brain.isOpen() : v;
    brain.open(open);
  }

  /* ---------------- focus ---------------- */
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
        telemetry.recordOpen(unitId, payload.via || "open");
        applyEvent(genome, { type: "open", via: payload.via || "open" });
        if (state.focusId !== unitId) telemetry.recordTransition(state.focusId, unitId, payload.via || "open");
        state.expanded.add(unitId);
        setFocus(unitId);
        bumpAffinity(unitId, 0.45);
        requestAnimationFrame(() => cards.get(unitId)?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
        break;
      }
      case "jump": {
        telemetry.recordJump(unitId, "jump");
        applyEvent(genome, { type: "jump" });
        telemetry.recordTransition(state.focusId, unitId, "jump");
        state.expanded.add(unitId);
        setFocus(unitId);
        bumpAffinity(unitId, 0.4);
        requestAnimationFrame(() => cards.get(unitId)?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
        break;
      }
      case "rel": {
        telemetry.recordOpen(unitId, "relation");
        applyEvent(genome, { type: "open", via: "relation" });
        telemetry.recordTransition(payload.from || state.focusId, unitId, "relation");
        state.expanded.add(unitId);
        setFocus(unitId);
        bumpAffinity(unitId, 0.55);
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
        const nextId = order[type === "next" ? Math.min(order.length - 1, idx + 1) : Math.max(0, idx - 1)];
        telemetry.recordOpen(nextId, type);
        applyEvent(genome, { type: "open", via: type });
        telemetry.recordTransition(state.focusId, nextId, type);
        state.expanded.add(nextId);
        setFocus(nextId);
        bumpAffinity(nextId, 0.3);
        requestAnimationFrame(() => cards.get(nextId)?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
        break;
      }
      case "keep":
      case "skip":
      case "open-card": {
        const order = rankedUnits();
        const currentId = order[state.deck.index];
        if (type === "keep" && currentId) {
          state.deck.kept.add(currentId);
          state.pins.add(currentId);
          telemetry.recordAction("triage", { unitId: currentId, verdict: "keep" });
          applyEvent(genome, { type: "triage", verdict: "keep" });
          bumpAffinity(currentId, 0.6);
          state.deck.index += 1;
        } else if (type === "skip" && currentId) {
          state.deck.skipped.add(currentId);
          telemetry.recordAction("triage", { unitId: currentId, verdict: "skip" });
          applyEvent(genome, { type: "triage", verdict: "skip" });
          bumpAffinity(currentId, -0.2);
          state.deck.index += 1;
        } else if (currentId) {
          state.expanded.add(currentId);
          setFocus(currentId);
          telemetry.recordOpen(currentId, "triage");
          applyEvent(genome, { type: "open", via: "triage" });
          state.deck.index += 1;
        }
        break;
      }
      case "reshuffle": {
        state.deck.index = 0;
        state.deck.skipped.clear();
        telemetry.recordAction("reshuffle", {});
        break;
      }
      case "filter-tag": {
        state.tagFilter = state.tagFilter === payload.tag ? null : payload.tag;
        telemetry.recordAction("filter-tag", { tag: state.tagFilter });
        break;
      }
      default:
        telemetry.recordAction(type, payload);
        reRender = false;
    }

    const decision = scheduler.onAction();
    if (decision) {
      restructure(decision);
      save();
      return;
    }
    if (reRender) flipMorph(renderShape);
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
      lastShape: scheduler.current,
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

  /* ---------------- keys ---------------- */
  addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || "");
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openJump(true);
      return;
    }
    if (e.key === "Escape") {
      if (!jumpEl.hidden) openJump(false);
      return;
    }
    if (typing) return;
    if (e.key === "/") {
      e.preventDefault();
      openJump(true);
      return;
    }
    if (e.key.toLowerCase() === "b" && !e.metaKey && !e.ctrlKey) {
      toggleBrain();
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
  timers.add(
    setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTick) / 1000;
      lastTick = now;
      const snap = telemetry.snapshot();
      if (snap.lastGapMs < 20000) {
        decay(genome, dt * 1000);
        for (const [id, v] of state.affinity) state.affinity.set(id, v * 0.997);
        const decision = scheduler.onTick(dt);
        if (decision) {
          restructure(decision);
          save();
          return;
        }
        brain.render({
          genome,
          fitnesses: scheduler.fitnesses(),
          current: scheduler.current,
          events: telemetry.events,
        });
        saveThrottled();
      }
    }, 1000)
  );

  /* ---------------- resize ---------------- */
  let resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => renderShape(), 260);
  });

  /* ---------------- landing flow ---------------- */
  function startExperience({ skipped = false } = {}) {
    renderShape();
    brain.render({
      genome,
      fitnesses: scheduler.fitnesses(),
      current: scheduler.current,
      events: telemetry.events,
    });
    if (mutationNote) {
      showBanner(
        { glyph: "✦", kicker: "PROCEDURAL STATE", headline: mutationNote, sub: "it learned you last time" },
        bannerHost
      );
    } else if (!skipped) {
      // banner already shown by choice handler
    } else {
      showBanner(
        {
          glyph: "◈",
          kicker: "IT'S WATCHING NOW",
          headline: "Move around — the way you browse decides what this becomes.",
          sub: "slow reading → magazine · wild roaming → constellation · speed → swipe deck",
        },
        bannerHost
      );
    }
    announce(`Portfolio ready. Shape: ${PARADIGMS[scheduler.current].name}. Press B to see its brain.`);
  }

  const hero = mountHero(heroHost, {
    generation,
    onChoose(mode) {
      applyEvent(genome, { type: "prime", mode });
      telemetry.recordAction("choose-mode", { mode });
      const shape = MODE_TO_SHAPE[mode];
      hero.dismiss().then(() => {
        scheduler.force(shape, "choice"); // no-op if already there — the banner still matters
        renderShape();
        showBanner(
          {
            glyph: PARADIGMS[shape].glyph,
            kicker: "YOU ASKED FOR IT",
            headline: PARADIGMS[shape].explain.replace("You", "You said it yourself — you"),
            sub: `the genome took your word for it · ${PARADIGMS[shape].blurb}`,
          },
          bannerHost
        );
        announce(`The site is living in ${PARADIGMS[shape].name} mode — for now.`);
        save();
      });
    },
    onSkip() {
      hero.dismiss().then(() => startExperience({ skipped: true }));
    },
  });

  timers.add(setTimeout(() => {}, 0)); // keep timer set uniform

  return {
    stop() {
      for (const t of timers) clearInterval(t);
      timers.clear();
    },
  };
}
