/**
 * SHAPE · CONSTELLATION 🗺️ — star-map of work
 * For the wild explorer. Projects float on a dark field, semantic
 * threads connect them, tags filter the sky. Hierarchy = position.
 */

import { UNIT_MAP, hash01 } from "../../content.js";

export function createMap(ctx) {
  const { ranked, state, cards, act, affinity } = ctx;

  /* legend rail */
  const nav = document.createElement("aside");
  nav.className = "map-legend recompose";
  nav.innerHTML = `
    <div class="rail-label">the constellation</div>
    <p class="map-hint">Every star is a piece of my work. Threads show how they connect. The ones you keep touching drift toward the centre.</p>
    <div class="map-tags"></div>
    <button class="mini-btn" data-clear>clear filter</button>
    <div class="map-quote">“${UNIT_MAP.get("philosophy").summary}”</div>
  `;
  const tagWrap = nav.querySelector(".map-tags");
  const tags = new Set();
  for (const id of ranked) for (const t of UNIT_MAP.get(id).tags) tags.add(t);
  for (const tag of tags) {
    const b = document.createElement("button");
    b.className = "map-tag" + (state.tagFilter === tag ? " is-on" : "");
    const hue = 340 + Math.floor(hash01(tag) * 40); // crimson family
    b.innerHTML = `<span class="map-tag__swatch" style="background:hsl(${hue} 85% 60%)"></span>${tag}`;
    b.addEventListener("click", () => act("filter-tag", { tag }));
    tagWrap.appendChild(b);
  }
  nav.querySelector("[data-clear]").addEventListener("click", () => act("filter-tag", { tag: null }));

  /* the sky */
  const main = document.createElement("div");
  main.className = "map-field";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "map-svg");
  main.appendChild(svg);

  const placed = ranked.map((id) => {
    const angle = hash01(id + ":a") * Math.PI * 2;
    const aff = (affinity.get(id) || 0) / 6;
    const radius = 33 - Math.min(15, aff * 15) + hash01(id + ":r") * 9;
    return {
      id,
      x: 50 + Math.cos(angle) * radius * 1.35,
      y: 50 + Math.sin(angle) * radius * 0.95,
    };
  });
  const pos = new Map(placed.map((p) => [p.id, p]));

  for (const p of placed) {
    const el = cards.get(p.id);
    if (!el) continue;
    el.classList.remove("is-hub", "is-span2", "is-deck-card");
    const unit = UNIT_MAP.get(p.id);
    el.classList.toggle("is-dimmed", !!state.tagFilter && !unit.tags.includes(state.tagFilter));
    el.classList.add("is-star");
    el.style.left = `${Math.min(74, Math.max(3, p.x))}%`;
    el.style.top = `${Math.min(76, Math.max(3, p.y))}%`;
    main.appendChild(el);
  }

  requestAnimationFrame(() => {
    const w = main.clientWidth || 1;
    const h = main.clientHeight || 1;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const drawn = new Set();
    for (const p of placed) {
      for (const rel of UNIT_MAP.get(p.id).links) {
        const q = pos.get(rel);
        if (!q) continue;
        const key = [p.id, rel].sort().join(">");
        if (drawn.has(key)) continue;
        drawn.add(key);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", (Math.min(74, Math.max(3, p.x)) / 100) * w);
        line.setAttribute("y1", (Math.min(76, Math.max(3, p.y)) / 100) * h);
        line.setAttribute("x2", (Math.min(74, Math.max(3, q.x)) / 100) * w);
        line.setAttribute("y2", (Math.min(76, Math.max(3, q.y)) / 100) * h);
        svg.appendChild(line);
      }
    }
  });

  return { id: "map", layout: "wide", nav, main };
}
