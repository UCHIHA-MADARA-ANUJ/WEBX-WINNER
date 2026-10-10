/**
 * SHAPE · MAGAZINE 📖 — editorial spread
 * For the calm reader. One story per spread, big cinematic type,
 * a chapter index with progress. Hierarchy = the reading sequence.
 */

import { UNIT_MAP, PROFILE } from "../../content.js";

export function createMagazine(ctx) {
  const { ranked, state, cards, act } = ctx;

  const nav = document.createElement("aside");
  nav.className = "mag-rail recompose";
  const done = ranked.filter((id) => state.seen.has(id)).length;

  nav.innerHTML = `
    <div class="rail-label">the magazine</div>
    <div class="mag-rail__title">A portfolio<br/>that reads with you</div>
    <div class="mag-rail__sub">${done} / ${ranked.length} stories explored</div>
    <div class="mag-progress"><div class="mag-progress__fill" style="width:${(done / ranked.length) * 100}%"></div></div>
    <div class="mag-index"></div>
    <div class="mag-nav-btns">
      <button class="act" data-nav="prev">← Back</button>
      <button class="act act--hot" data-nav="next">Next story →</button>
    </div>
    <div class="mag-quote">“${PROFILE.creed}”</div>
  `;

  const index = nav.querySelector(".mag-index");
  ranked.forEach((id, i) => {
    const u = UNIT_MAP.get(id);
    const btn = document.createElement("button");
    btn.className = "mag-chapter" + (state.seen.has(id) ? " is-done" : "") + (state.focusId === id ? " is-current" : "");
    btn.innerHTML = `<span class="mag-chapter__n">${String(i + 1).padStart(2, "0")}</span>
                     <span class="mag-chapter__t">${u.title}</span>`;
    btn.addEventListener("click", () => act("open", { unitId: id, via: "chapter" }));
    index.appendChild(btn);
  });

  nav.querySelectorAll("[data-nav]").forEach((b) => {
    b.addEventListener("click", () => act(b.dataset.nav, {}));
  });

  const main = document.createElement("div");
  main.className = "mag-doc";

  const masthead = document.createElement("header");
  masthead.className = "mag-masthead recompose";
  masthead.innerHTML = `
    <div class="mag-masthead__kicker">ANUJ PHULERA · PORTFOLIO · EDITION ${String(state.generation || 1).padStart(2, "0")}</div>
    <h1 class="mag-masthead__title">Wake up to <em>reality</em>.</h1>
    <p class="mag-masthead__sub">Builder, designer, and full-stack developer from Delhi — this edition of my story has been re-sequenced for the way you read.</p>
  `;
  main.appendChild(masthead);

  for (const id of ranked) {
    const el = cards.get(id);
    if (!el) continue;
    el.classList.remove("is-span2", "is-hub", "is-dimmed", "is-satellite", "is-deck-card");
    main.appendChild(el);
  }

  return { id: "magazine", layout: "sidebar", nav, main };
}
