/**
 * PARADIGM · LINEAR — editorial sequence
 * Structure: chapter rail (progress + ordered chapters) beside a
 * single long document. Hierarchy = the sequence itself, which the
 * engine re-orders around your affinities. Prev/Next is the spine.
 */

import { UNIT_MAP } from "../../content.js";

export function createLinear(ctx) {
  const { ranked, state, cards, act } = ctx;

  const nav = document.createElement("aside");
  nav.className = "linear-rail recompose";

  const done = ranked.filter((id) => state.seen.has(id)).length;

  nav.innerHTML = `
    <div class="linear-rail__head">
      <div class="rail-title">your sequence</div>
      <div class="linear-rail__title">A Field Guide to<br/>Adaptive Systems</div>
      <div class="linear-rail__sub">${done} of ${ranked.length} ideas · order rewritten by you</div>
    </div>
    <div class="linear-progress"><div class="linear-progress__fill" style="width:${(done / ranked.length) * 100}%"></div></div>
    <div class="linear-chapters"></div>
    <div class="linear-nav-btns">
      <button class="act" data-nav="prev">← Prev</button>
      <button class="act" data-nav="next" data-promoted="1">Next →</button>
    </div>
  `;

  const chapters = nav.querySelector(".linear-chapters");
  ranked.forEach((id, i) => {
    const card = cards.get(id);
    const btn = document.createElement("button");
    btn.className = "linear-chapter";
    if (state.seen.has(id)) btn.classList.add("is-done");
    if (state.focusId === id) btn.classList.add("is-current");
    btn.innerHTML = `<span class="linear-chapter__n">${String(i + 1).padStart(2, "0")}</span>
                     <span class="linear-chapter__t">${UNIT_MAP.get(id).title}</span>`;
    btn.addEventListener("click", () => act("open", { unitId: id, via: "chapter" }));
    chapters.appendChild(btn);
  });

  nav.querySelectorAll("[data-nav]").forEach((b) => {
    b.addEventListener("click", () => act(b.dataset.nav, {}));
  });

  const main = document.createElement("div");
  main.className = "linear-doc";

  for (const id of ranked) {
    const el = cards.get(id);
    if (!el) continue;
    el.classList.remove("is-span2", "is-hub", "is-dimmed");
    main.appendChild(el);
  }

  return { id: "linear", layout: "sidebar", nav, main };
}
