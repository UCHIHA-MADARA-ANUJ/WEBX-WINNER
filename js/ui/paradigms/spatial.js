/**
 * PARADIGM · SPATIAL — constellation
 * Structure: a 2D field. Ideas are nodes, semantic kinship draws the
 * edges, proximity encodes affinity. Navigation = wandering; hierarchy
 * = position. The engine seeds the field from your behaviour.
 */

import { UNIT_MAP, semanticDistance, hash01 } from "../../content.js";

export function createSpatial(ctx) {
  const { ranked, state, cards, act, affinity } = ctx;

  const nav = document.createElement("aside");
  nav.className = "spatial-legend recompose";

  const tags = new Set();
  for (const id of ranked) for (const t of UNIT_MAP.get(id).tags) tags.add(t);
  const activeTag = state.tagFilter;

  nav.innerHTML = `
    <div class="panel__label">field legend</div>
    <div class="spatial-hint">Ideas are placed by affinity and kinship — nodes you return to drift inward, strangers orbit the rim.</div>
  `;

  const tagWrap = document.createElement("div");
  tagWrap.style.cssText = "display:flex;flex-direction:column;gap:4px;";
  for (const tag of tags) {
    const b = document.createElement("button");
    b.className = "spatial-tag" + (activeTag === tag ? " is-on" : "");
    const hue = 140 + Math.floor(hash01(tag) * 140);
    b.innerHTML = `<span class="spatial-tag__swatch" style="background:hsl(${hue} 80% 62%)"></span>${tag}`;
    b.addEventListener("click", () => act("filter-tag", { tag }));
    tagWrap.appendChild(b);
  }
  nav.appendChild(tagWrap);

  const reset = document.createElement("button");
  reset.className = "mini-btn";
  reset.textContent = "clear filter";
  reset.addEventListener("click", () => act("filter-tag", { tag: null }));
  nav.appendChild(reset);

  /* ---- the field ---- */
  const main = document.createElement("div");
  main.className = "spatial-field";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "spatial-svg");
  main.appendChild(svg);

  // deterministic layout seeded by identity + live affinity
  const cx = 50, cy = 50;
  const placed = ranked.map((id, i) => {
    const angle = hash01(id + ":a") * Math.PI * 2;
    const aff = (affinity.get(id) || 0) / 6;
    const radius = 34 - Math.min(16, aff * 16) + hash01(id + ":r") * 8;
    const wob = state.focusId === id ? -4 : 0;
    return {
      id,
      x: cx + Math.cos(angle) * (radius + wob) + (i % 3) * 1.5,
      y: cy + Math.sin(angle) * (radius * 0.82 + wob),
    };
  });

  const pos = new Map(placed.map((p) => [p.id, p]));

  for (const p of placed) {
    const el = cards.get(p.id);
    if (!el) continue;
    el.classList.remove("is-hub", "is-span2");
    const unit = UNIT_MAP.get(p.id);
    el.classList.toggle("is-dimmed", !!activeTag && !unit.tags.includes(activeTag));
    el.style.left = `${Math.min(78, Math.max(4, p.x))}%`;
    el.style.top = `${Math.min(80, Math.max(3, p.y))}%`;
    main.appendChild(el);
  }

  // semantic edges — drawn after layout so they track the nodes
  requestAnimationFrame(() => {
    const w = main.clientWidth || 1;
    const h = main.clientHeight || 1;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const drawn = new Set();
    for (const p of placed) {
      const unit = UNIT_MAP.get(p.id);
      for (const rel of unit.links) {
        const q = pos.get(rel);
        if (!q) continue;
        const key = [p.id, rel].sort().join(">");
        if (drawn.has(key)) continue;
        drawn.add(key);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", (Math.min(78, Math.max(4, p.x)) / 100) * w);
        line.setAttribute("y1", (Math.min(80, Math.max(3, p.y)) / 100) * h);
        line.setAttribute("x2", (Math.min(78, Math.max(4, q.x)) / 100) * w);
        line.setAttribute("y2", (Math.min(80, Math.max(3, q.y)) / 100) * h);
        if (state.focusId === p.id || state.focusId === rel) line.classList.add("is-hot");
        svg.appendChild(line);
      }
    }
  });

  return { id: "spatial", layout: "wide", nav, main };
}
