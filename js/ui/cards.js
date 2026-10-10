/**
 * LATTICE — shared card anatomy
 * One persistent DOM node per idea (`data-flip="unit:<id>"`).
 * Paradigms re-parent and re-dress these; morph.js flies them.
 * That is what makes the restructuring physical rather than a
 * page reload: the same ideas survive every structural revolution.
 */

import { UNIT_MAP } from "../content.js";

const GLYPHS = {
  loops: "↻", cybernetics: "⚙", perception: "◉", design: "✂",
  growth: "⌁", form: "◇", stability: "⌸", change: "∿",
  emergence: "∴", collective: "⁂", representation: "▤", models: "⬡",
  traces: "⋱", adaptation: "△", evolution: "⟲", repurposing: "⇢",
  cycles: "◌",
};

export function createCard(unitId, ctx) {
  const unit = UNIT_MAP.get(unitId);
  const el = document.createElement("article");
  el.className = "card";
  el.dataset.flip = `unit:${unitId}`;
  el.dataset.id = unitId;
  el.tabIndex = 0;
  el.setAttribute("aria-label", unit.title);

  const tags = unit.tags
    .map((t) => `<span class="card__tag">${GLYPHS[t] || "·"} ${t}</span>`)
    .join("");

  const rels = unit.links
    .map((id) => {
      const u = UNIT_MAP.get(id);
      return u ? `<button data-rel="${id}" tabindex="-1">→ ${u.title}</button>` : "";
    })
    .join("");

  el.innerHTML = `
    <header class="card__head">
      <div class="card__index">idea ${String(unitId.length * 7 + 3).padStart(2, "0")} · ${unit.minutes} min</div>
      <h3 class="card__title">${unit.title}</h3>
    </header>
    <div class="card__meta">${tags}</div>
    <p class="card__summary">${unit.summary}</p>
    <div class="card__body" hidden>
      ${unit.body
        .map((b) =>
          b.type === "lead"
            ? `<p class="lead">${b.text}</p>`
            : b.type === "aside"
              ? `<p class="aside">${b.text}</p>`
              : `<p>${b.text}</p>`
        )
        .join("")}
    </div>
    <div class="card__rel"><span>threads</span>${rels}</div>
    <footer class="card__actions">
      <button class="act" data-act="open">Read</button>
      <button class="act" data-act="pin">Pin</button>
      <button class="act" data-act="orbit">Centre</button>
    </footer>
  `;

  // event wiring lives on the card so re-parenting never breaks it
  el.addEventListener("click", (e) => {
    const relBtn = e.target.closest("[data-rel]");
    if (relBtn) {
      e.stopPropagation();
      ctx.act("rel", { unitId: relBtn.dataset.rel, from: unitId });
      return;
    }
    const actBtn = e.target.closest("[data-act]");
    if (actBtn) {
      e.stopPropagation();
      const act = actBtn.dataset.act;
      if (act === "open") ctx.act("toggle", { unitId });
      else if (act === "pin") ctx.act("pin", { unitId });
      else if (act === "orbit") ctx.act("orbit", { unitId });
      return;
    }
    // clicking the card body itself = focus/read intent
    ctx.act("focus", { unitId });
  });

  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      if (e.target === el) {
        e.preventDefault();
        ctx.act("toggle", { unitId });
      }
    }
  });

  return el;
}

/** Push state (expanded / pinned / promotion / fade) onto a card. */
export function updateCard(el, state, promoted = {}) {
  const id = el.dataset.id;
  el.classList.toggle("is-expanded", state.expanded.has(id));
  el.classList.toggle("is-pinned", state.pins.has(id));

  const body = el.querySelector(".card__body");
  if (body) body.hidden = !state.expanded.has(id);

  const pinBtn = el.querySelector('[data-act="pin"]');
  if (pinBtn) {
    pinBtn.classList.toggle("is-on", state.pins.has(id));
    pinBtn.textContent = state.pins.has(id) ? "Pinned" : "Pin";
    // affordance promotion — the engine rewrites action weights live
    const p = promoted.pin || 0;
    if (p >= 4) pinBtn.dataset.promoted = "1";
    else if (p >= 2) pinBtn.dataset.promoted = "2";
    else delete pinBtn.dataset.promoted;
    if ((promoted.orbit || 0) < 1 && state.pins.size > 2) pinBtn.dataset.demoted = "1";
    else delete pinBtn.dataset.demoted;
  }

  const openBtn = el.querySelector('[data-act="open"]');
  if (openBtn) {
    openBtn.textContent = state.expanded.has(id) ? "Collapse" : "Read";
    const p = promoted.open || 0;
    if (p >= 6) openBtn.dataset.promoted = "1";
    else delete openBtn.dataset.promoted;
  }
}

export function refreshAllCards(cards, state, promoted) {
  for (const el of cards.values()) updateCard(el, state, promoted);
}
