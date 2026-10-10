/**
 * PARADIGM · GRID — dashboard workspace
 * Structure: modular widgets. Pinned and focused ideas span wider;
 * the digest widget surfaces the engine's live model of you.
 * Hierarchy = pins and spans. Navigation = tabs and groups.
 */

import { UNIT_MAP, TAGS } from "../../content.js";

export function createGrid(ctx) {
  const { ranked, state, cards, act, genome, telemetryStats } = ctx;

  /* ---- group rail ---- */
  const nav = document.createElement("aside");
  nav.className = "recompose";
  nav.innerHTML = `
    <div class="panel__label">groups</div>
    <div class="grid-groups"></div>
    <button class="mini-btn" style="margin-top:16px" data-pin-first>pin top idea</button>
  `;
  const groups = nav.querySelector(".grid-groups");

  const groupDefs = [
    { id: "all", t: "Everything", c: ranked.length },
    { id: "pinned", t: "Pinned by you", c: state.pins.size },
    { id: "seen", t: "Already explored", c: state.seen.size },
    ...TAGS.map((tag) => ({ id: `tag:${tag}`, t: tag, c: ranked.filter((id) => UNIT_MAP.get(id).tags.includes(tag)).length })),
  ];

  for (const g of groupDefs) {
    const b = document.createElement("button");
    b.className = "grid-group-item" + (state.gridGroup === g.id ? " is-on" : "");
    b.innerHTML = `<span class="t">${g.t}</span><span class="c">${g.c} ideas</span>`;
    b.addEventListener("click", () => act("grid-group", { group: g.id }));
    groups.appendChild(b);
  }
  nav.querySelector("[data-pin-first]").addEventListener("click", () => {
    const id = ranked[0];
    if (id) act("pin", { unitId: id });
  });

  /* ---- board ---- */
  const main = document.createElement("div");
  const tabs = document.createElement("div");
  tabs.className = "grid-tabs recompose";
  for (const g of groupDefs.slice(0, 3)) {
    const b = document.createElement("button");
    b.className = "grid-tab" + (state.gridGroup === g.id ? " is-on" : "");
    b.textContent = g.t;
    b.addEventListener("click", () => act("grid-group", { group: g.id }));
    tabs.appendChild(b);
  }
  main.appendChild(tabs);

  const board = document.createElement("div");
  board.className = "grid-board";
  main.appendChild(board);

  // digest widget — the glass box, compacted
  const digest = document.createElement("div");
  digest.className = "card grid-digest";
  digest.dataset.flip = "digest";
  const s = telemetryStats || {};
  digest.innerHTML = `
    <div class="digest-cell"><div class="k">sequence</div><div class="v"><em>${genome.linearity.toFixed(2)}</em></div></div>
    <div class="digest-cell"><div class="k">pace</div><div class="v"><em>${genome.pace.toFixed(2)}</em></div></div>
    <div class="digest-cell"><div class="k">depth</div><div class="v"><em>${genome.depth.toFixed(2)}</em></div></div>
    <div class="digest-cell"><div class="k">agency</div><div class="v"><em>${genome.agency.toFixed(2)}</em></div></div>
    <div class="digest-cell"><div class="k">actions</div><div class="v">${s.actions ?? 0}</div></div>
    <div class="digest-cell"><div class="k">pinned</div><div class="v">${state.pins.size}</div></div>
  `;
  board.appendChild(digest);

  const filtered = ranked.filter((id) => {
    const g = state.gridGroup || "all";
    if (g === "all") return true;
    if (g === "pinned") return state.pins.has(id);
    if (g === "seen") return state.seen.has(id);
    if (g.startsWith("tag:")) return UNIT_MAP.get(id).tags.includes(g.slice(4));
    return true;
  });

  for (const id of filtered) {
    const el = cards.get(id);
    if (!el) continue;
    el.classList.remove("is-hub", "is-dimmed", "is-satellite");
    el.style.position = "";
    el.style.inset = "";
    el.style.left = "";
    el.style.top = "";
    el.style.transform = "";
    el.style.opacity = "";
    el.removeAttribute("aria-hidden");
    const wide = state.pins.has(id) || state.expanded.has(id);
    el.classList.toggle("is-span2", wide);
    board.appendChild(el);
  }

  return { id: "grid", layout: "sidebar", nav, main };
}
