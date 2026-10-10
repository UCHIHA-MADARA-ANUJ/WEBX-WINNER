/**
 * PARADIGM · ORBITAL — hub & spoke
 * Structure: one idea at the centre of gravity; its semantic kin
 * orbit it in proportion to relatedness. Clicking a satellite
 * re-centres the system — the orbit re-forms around the new idea.
 * Hierarchy = radius. Navigation = association.
 */

import { UNIT_MAP, semanticDistance } from "../../content.js";

export function createOrbital(ctx) {
  const { ranked, state, cards, act, affinity } = ctx;
  const hubId = state.focusId && UNIT_MAP.get(state.focusId) ? state.focusId : ranked[0];
  const hubUnit = UNIT_MAP.get(hubId);

  /* ---- trail rail ---- */
  const nav = document.createElement("aside");
  nav.className = "recompose";
  nav.innerHTML = `<div class="panel__label">orbit trail</div>`;
  const trail = document.createElement("div");
  trail.className = "orbit-trail";
  const history = [...state.trail.slice(-7)];
  if (!history.includes(hubId)) history.push(hubId);
  history.forEach((id, i) => {
    const u = UNIT_MAP.get(id);
    if (!u) return;
    const b = document.createElement("button");
    b.className = "orbit-trail__step" + (id === hubId ? " is-current" : "");
    b.innerHTML = `<span class="k">${i === history.length - 1 ? "now" : "was"}</span><span>${u.title}</span>`;
    b.addEventListener("click", () => act("orbit", { unitId: id }));
    trail.appendChild(b);
  });
  nav.appendChild(trail);

  const threads = document.createElement("div");
  threads.style.marginTop = "18px";
  threads.innerHTML = `<div class="panel__label">threads of the centre</div>`;
  const threadWrap = document.createElement("div");
  threadWrap.className = "orbit-trail";
  for (const rel of hubUnit.links) {
    const u = UNIT_MAP.get(rel);
    if (!u) continue;
    const b = document.createElement("button");
    b.className = "orbit-trail__step";
    b.innerHTML = `<span class="k">↳</span><span>${u.title}</span>`;
    b.addEventListener("click", () => act("rel", { unitId: rel, from: hubId }));
    threadWrap.appendChild(b);
  }
  threads.appendChild(threadWrap);
  nav.appendChild(threads);

  /* ---- stage ---- */
  const main = document.createElement("div");
  main.className = "orbit-stage";

  const rings = document.createElement("div");
  rings.className = "orbit-rings";
  for (const size of ["72%", "48%", "26%"]) {
    const r = document.createElement("div");
    r.className = "orbit-ring";
    r.style.width = size;
    r.style.height = size;
    rings.appendChild(r);
  }
  main.appendChild(rings);

  // satellites: declared kin first, then nearest ideas by semantic distance
  const candidates = ranked.filter((id) => id !== hubId);
  candidates.sort((a, b) => {
    const linkBoost = (id) => (hubUnit.links.includes(id) ? -1 : 0);
    return (
      linkBoost(a) - linkBoost(b) ||
      semanticDistance(hubId, a) - semanticDistance(hubId, b) ||
      (affinity.get(b) || 0) - (affinity.get(a) || 0)
    );
  });
  const satellites = candidates.slice(0, 7);

  satellites.forEach((id, i) => {
    const el = cards.get(id);
    if (!el) return;
    el.classList.remove("is-hub", "is-span2", "is-dimmed");
    el.classList.add("is-satellite");
    const dist = semanticDistance(hubId, id);
    const ringR = 30 + dist * 16; // % of stage
    const angle = -Math.PI / 2 + (i / satellites.length) * Math.PI * 2;
    el.style.left = `${50 + Math.cos(angle) * ringR * 1.28}%`;
    el.style.top = `${48 + Math.sin(angle) * ringR * 0.92}%`;
    el.style.transform = "translate(-50%, -50%)";
    main.appendChild(el);
  });

  const hub = cards.get(hubId);
  if (hub) {
    hub.classList.add("is-hub");
    hub.classList.remove("is-dimmed", "is-satellite");
    hub.style.left = "";
    hub.style.top = "";
    hub.style.transform = "";
    main.appendChild(hub);
  }

  return { id: "orbital", layout: "wide", nav, main };
}
