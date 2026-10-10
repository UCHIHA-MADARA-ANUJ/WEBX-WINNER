/**
 * Cards — one persistent DOM node per piece of Anuj's story.
 * Shapes re-parent and re-dress these; morph.js flies them.
 * The content survives every structural revolution.
 */

import { UNIT_MAP, PROFILE } from "../content.js";

export function createCard(unitId, ctx) {
  const unit = UNIT_MAP.get(unitId);
  const el = document.createElement("article");
  el.className = "card";
  el.dataset.flip = `unit:${unitId}`;
  el.dataset.id = unitId;
  el.tabIndex = 0;
  el.setAttribute("aria-label", unit.title);

  const tags = unit.tags
    .map((t) => `<span class="card__tag">${t}</span>`)
    .join("");

  const rels = unit.links
    .map((id) => {
      const u = UNIT_MAP.get(id);
      return u ? `<button data-rel="${id}" tabindex="-1">${u.title}</button>` : "";
    })
    .join("");

  const bodyHtml = unit.body
    .map((b) =>
      b.type === "lead"
        ? `<p class="lead">${b.text}</p>`
        : b.type === "aside"
          ? `<p class="aside">${b.text}</p>`
          : `<p>${b.text}</p>`
    )
    .join("");

  const hrefBtn = unit.href
    ? `<a class="act act--live" href="${unit.href}" target="_blank" rel="noopener" data-live>See it live ↗</a>`
    : "";

  el.innerHTML = `
    <div class="card__visual" aria-hidden="true">
      ${unit.image ? `<img class="card__img" src="${unit.image}" alt="" loading="lazy" />` : `<div class="card__sigil">${(unit.title[0] || "A")}</div>`}
      <div class="card__visual-fade"></div>
    </div>
    <div class="card__content">
      <header class="card__head">
        <div class="card__kicker">${unit.kicker}</div>
        <h3 class="card__title">${unit.title}</h3>
        <div class="card__subtitle">${unit.subtitle || ""}</div>
      </header>
      <div class="card__meta">${tags}<span class="card__stack">${unit.stack}</span></div>
      <p class="card__summary">${unit.summary}</p>
      <div class="card__body" hidden>${bodyHtml}</div>
      <div class="card__rel"><span>threads</span>${rels}</div>
      <footer class="card__actions">
        <button class="act" data-act="open">Read</button>
        <button class="act" data-act="pin">Pin</button>
        <button class="act" data-act="orbit">Centre</button>
        ${hrefBtn}
      </footer>
    </div>
  `;

  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-live]")) {
      // live links are real navigation — still recorded as deep interest
      ctx.act("focus", { unitId });
      return;
    }
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

  // cinematic tilt-on-hover for pointer users
  el.addEventListener("pointermove", (e) => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia?.("(hover: none)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--tilt-x", `${(-y * 5).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${(x * 6).toFixed(2)}deg`);
  });
  el.addEventListener("pointerleave", () => {
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  });

  return el;
}

/** Push live state (expanded / pinned / promotion) onto a card. */
export function updateCard(el, state, promoted = {}) {
  const id = el.dataset.id;
  el.classList.toggle("is-expanded", state.expanded.has(id));
  el.classList.toggle("is-pinned", state.pins.has(id));

  const body = el.querySelector(".card__body");
  if (body) body.hidden = !state.expanded.has(id);

  const pinBtn = el.querySelector('[data-act="pin"]');
  if (pinBtn) {
    pinBtn.classList.toggle("is-on", state.pins.has(id));
    pinBtn.textContent = state.pins.has(id) ? "Pinned ✦" : "Pin";
    const p = promoted.pin || 0;
    if (p >= 4) pinBtn.dataset.promoted = "1";
    else if (p >= 2) pinBtn.dataset.promoted = "2";
    else delete pinBtn.dataset.promoted;
  }

  const openBtn = el.querySelector('[data-act="open"]');
  if (openBtn) {
    openBtn.textContent = state.expanded.has(id) ? "Collapse" : "Read";
    if ((promoted.open || 0) >= 6) openBtn.dataset.promoted = "1";
    else delete openBtn.dataset.promoted;
  }
}

export function refreshAllCards(cards, state, promoted) {
  for (const el of cards.values()) updateCard(el, state, promoted);
}
