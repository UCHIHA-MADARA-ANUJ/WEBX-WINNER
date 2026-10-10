/**
 * PARADIGM · DECK — triage stack
 * Structure: one decision at a time. A stack of ideas presents
 * itself; Keep pins, Skip discards, Open dives. Hierarchy = the
 * queue, which re-seeds from what you keep. Built for velocity.
 */

import { UNIT_MAP } from "../../content.js";

export function createDeck(ctx) {
  const { ranked, state, cards, act } = ctx;
  const deck = state.deck;
  const queue = ranked.filter((id) => !deck.skipped.has(id) || deck.index < ranked.length);
  const upcoming = ranked.slice(deck.index, deck.index + 6);

  /* ---- queue rail ---- */
  const nav = document.createElement("aside");
  nav.className = "recompose";
  nav.innerHTML = `
    <div class="panel__label">triage queue</div>
    <div class="deck-stats">
      <div class="deck-stat"><span>kept</span><strong>${deck.kept.size}</strong></div>
      <div class="deck-stat"><span>skipped</span><strong>${deck.skipped.size}</strong></div>
      <div class="deck-stat"><span>remaining</span><strong>${Math.max(0, ranked.length - deck.index)}</strong></div>
    </div>
    <div class="panel__label" style="margin-top:18px">up next</div>
    <div class="deck-queue"></div>
    <button class="mini-btn" data-reshuffle style="margin-top:16px">re-seed queue</button>
  `;
  const q = nav.querySelector(".deck-queue");
  upcoming.forEach((id, i) => {
    const u = UNIT_MAP.get(id);
    if (!u) return;
    const li = document.createElement("button");
    li.className = "deck-queue__item" + (i === 0 ? " is-next" : "");
    li.innerHTML = `<span>${u.title}</span>
      <span class="deck-queue__pips"><i class="${u.minutes <= 4 ? "is-on" : ""}"></i>
      <i class="${u.minutes <= 5 ? "is-on" : ""}"></i><i class="${u.minutes <= 6 ? "is-on" : ""}"></i></span>`;
    li.addEventListener("click", () => act("open", { unitId: id, via: "triage" }));
    q.appendChild(li);
  });
  nav.querySelector("[data-reshuffle]").addEventListener("click", () => act("reshuffle", {}));

  /* ---- stage ---- */
  const main = document.createElement("div");
  main.className = "deck-stage";
  const slot = document.createElement("div");
  slot.className = "deck-slot";
  main.appendChild(slot);

  const visible = ranked.slice(deck.index, deck.index + 3);
  visible.forEach((id, i) => {
    const el = cards.get(id);
    if (!el) return;
    el.classList.remove("is-hub", "is-span2", "is-dimmed", "is-satellite");
    el.style.left = "";
    el.style.top = "";
    el.style.position = "absolute";
    el.style.inset = "0";
    el.style.transform = `translateY(${i * 10}px) rotate(${(i - 1) * 1.6}deg) scale(${1 - i * 0.045})`;
    el.style.zIndex = String(10 - i);
    el.style.opacity = i === 0 ? "1" : String(0.75 - i * 0.2);
    if (i > 0) el.setAttribute("aria-hidden", "true");
    else el.removeAttribute("aria-hidden");
    slot.appendChild(el);
  });

  const controls = document.createElement("div");
  controls.className = "deck-controls";
  controls.innerHTML = `
    <button class="act act--skip" data-deck="skip">← Skip</button>
    <button class="act" data-deck="open" data-promoted="2">Open</button>
    <button class="act act--keep" data-deck="keep" data-promoted="1">Keep →</button>
  `;
  controls.querySelectorAll("[data-deck]").forEach((b) => {
    b.addEventListener("click", () => act(b.dataset.deck === "open" ? "open-card" : b.dataset.deck, {}));
  });
  main.appendChild(controls);

  if (!visible.length) {
    const done = document.createElement("div");
    done.className = "panel recompose";
    done.style.cssText = "text-align:center;padding:60px 30px;position:relative;";
    done.innerHTML = `
      <div class="rail-title">queue exhausted</div>
      <h3 class="card__title" style="margin:14px 0 10px">The stack is clear.</h3>
      <p class="card__summary" style="max-width:420px;margin:0 auto 20px">
        Everything has been triaged. Re-seed the queue and the engine will
        surface what your choices have made most relevant.</p>
      <button class="act" data-reshuffle data-promoted="1">Re-seed queue</button>
    `;
    done.querySelector("[data-reshuffle]").addEventListener("click", () => act("reshuffle", {}));
    main.appendChild(done);
  }

  return { id: "deck", layout: "wide", nav, main };
}
