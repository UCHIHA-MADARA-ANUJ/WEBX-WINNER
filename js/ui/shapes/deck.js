/**
 * SHAPE · SWIPE DECK 💳 — decision speed
 * For the speedrunner. One full-screen card at a time with real
 * swipe physics: KEEP (pin it), SKIP (move on), OPEN (dive in).
 * Hierarchy = the live queue.
 */

import { UNIT_MAP } from "../../content.js";

export function createDeck(ctx) {
  const { ranked, state, cards, act } = ctx;
  const deck = state.deck;

  /* queue rail */
  const nav = document.createElement("aside");
  nav.className = "deck-rail recompose";
  nav.innerHTML = `
    <div class="rail-label">the deck</div>
    <div class="deck-title">Decide fast.<br/>Keep what matters.</div>
    <div class="deck-stats">
      <div class="deck-stat"><span>kept</span><strong>${deck.kept.size}</strong></div>
      <div class="deck-stat"><span>skipped</span><strong>${deck.skipped.size}</strong></div>
      <div class="deck-stat"><span>left</span><strong>${Math.max(0, ranked.length - deck.index)}</strong></div>
    </div>
    <div class="rail-label" style="margin-top:18px">up next</div>
    <div class="deck-queue"></div>
    <button class="mini-btn" data-reshuffle style="margin-top:16px">re-shuffle the deck</button>
    <div class="deck-keys">← skip · → keep · ↑ open</div>
  `;
  const q = nav.querySelector(".deck-queue");
  ranked.slice(deck.index, deck.index + 5).forEach((id, i) => {
    const u = UNIT_MAP.get(id);
    if (!u) return;
    const li = document.createElement("button");
    li.className = "deck-queue__item" + (i === 0 ? " is-next" : "");
    li.innerHTML = `<span>${u.title}</span><span class="deck-queue__k">${u.kicker.split(" ")[0]}</span>`;
    li.addEventListener("click", () => act("open", { unitId: id, via: "triage" }));
    q.appendChild(li);
  });
  nav.querySelector("[data-reshuffle]").addEventListener("click", () => act("reshuffle", {}));

  /* stage */
  const main = document.createElement("div");
  main.className = "deck-stage";
  const slot = document.createElement("div");
  slot.className = "deck-slot";
  main.appendChild(slot);

  const visible = ranked.slice(deck.index, deck.index + 3);
  visible.forEach((id, i) => {
    const el = cards.get(id);
    if (!el) return;
    el.classList.remove("is-hub", "is-span2", "is-dimmed", "is-satellite", "is-star");
    el.classList.add("is-deck-card");
    el.style.left = "";
    el.style.top = "";
    el.style.position = "absolute";
    el.style.inset = "0";
    el.style.transform = `translateY(${i * 14}px) rotate(${(i - 1) * 2.2}deg) scale(${1 - i * 0.05})`;
    el.style.zIndex = String(30 - i);
    el.style.opacity = i === 0 ? "1" : String(0.8 - i * 0.25);
    if (i > 0) el.setAttribute("aria-hidden", "true");
    else el.removeAttribute("aria-hidden");
    slot.appendChild(el);
  });

  const controls = document.createElement("div");
  controls.className = "deck-controls";
  controls.innerHTML = `
    <button class="act act--skip" data-deck="skip">← Skip</button>
    <button class="act" data-deck="open-card">Open</button>
    <button class="act act--keep act--hot" data-deck="keep">Keep →</button>
  `;
  controls.querySelectorAll("[data-deck]").forEach((b) => {
    b.addEventListener("click", () => act(b.dataset.deck, {}));
  });
  main.appendChild(controls);

  if (!visible.length) {
    const done = document.createElement("div");
    done.className = "deck-done recompose";
    done.innerHTML = `
      <div class="deck-done__glyph">✦</div>
      <h2 class="deck-done__title">The deck is clear.</h2>
      <p class="deck-done__sub">You've judged every card. Re-shuffle and the engine will deal a new order — built from what you kept.</p>
      <button class="act act--hot" data-reshuffle>Re-shuffle the deck</button>
    `;
    done.querySelector("[data-reshuffle]").addEventListener("click", () => act("reshuffle", {}));
    main.appendChild(done);
  }

  return { id: "deck", layout: "wide", nav, main };
}
