/**
 * SHAPE · ORBIT 🌀 — associative gravity
 * For the thread-follower. One idea at the centre of gravity,
 * related work revolving around it in proportion to kinship.
 * Click a satellite and the whole system re-centres.
 */

import { UNIT_MAP, semanticDistance, PROFILE } from "../../content.js";

export function createOrbit(ctx) {
  const { ranked, state, cards, act, affinity } = ctx;
  const hubId = state.focusId && UNIT_MAP.get(state.focusId) ? state.focusId : ranked[0];
  const hubUnit = UNIT_MAP.get(hubId);

  /* trail rail */
  const nav = document.createElement("aside");
  nav.className = "orbit-rail recompose";
  nav.innerHTML = `<div class="rail-label">orbit trail</div>`;
  const trail = document.createElement("div");
  trail.className = "orbit-trail";
  const history = [...state.trail.slice(-7)];
  if (!history.includes(hubId)) history.push(hubId);
  history.forEach((id, i) => {
    const u = UNIT_MAP.get(id);
    if (!u) return;
    const b = document.createElement("button");
    b.className = "orbit-trail__step" + (id === hubId ? " is-current" : "");
    b.innerHTML = `<span class="k">${i === history.length - 1 ? "★ now" : "was"}</span><span>${u.title}</span>`;
    b.addEventListener("click", () => act("orbit", { unitId: id }));
    trail.appendChild(b);
  });
  nav.appendChild(trail);

  const threads = document.createElement("div");
  threads.style.marginTop = "20px";
  threads.innerHTML = `<div class="rail-label">threads of this idea</div>`;
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

  /* stage */
  const main = document.createElement("div");
  main.className = "orbit-stage";

  const rings = document.createElement("div");
  rings.className = "orbit-rings";
  for (const size of ["78%", "52%", "28%"]) {
    const r = document.createElement("div");
    r.className = "orbit-ring";
    r.style.width = size;
    r.style.height = size;
    rings.appendChild(r);
  }
  main.appendChild(rings);

  const candidates = ranked.filter((id) => id !== hubId);
  candidates.sort((a, b) => {
    const linkBoost = (id) => (hubUnit.links.includes(id) ? -1 : 0);
    return (
      linkBoost(a) - linkBoost(b) ||
      semanticDistance(hubId, a) - semanticDistance(hubId, b) ||
      (affinity.get(b) || 0) - (affinity.get(a) || 0)
    );
  });
  const satellites = candidates.slice(0, 6);

  satellites.forEach((id, i) => {
    const el = cards.get(id);
    if (!el) return;
    el.classList.remove("is-hub", "is-span2", "is-dimmed", "is-star", "is-deck-card");
    el.classList.add("is-satellite");
    const dist = semanticDistance(hubId, id);
    const ringR = 30 + dist * 15;
    const angle = -Math.PI / 2 + (i / satellites.length) * Math.PI * 2;
    el.style.left = `${50 + Math.cos(angle) * ringR * 1.3}%`;
    el.style.top = `${48 + Math.sin(angle) * ringR * 0.95}%`;
    el.style.transform = "translate(-50%, -50%)";
    el.style.animationDelay = `${i * 0.28}s`;
    main.appendChild(el);
  });

  const hub = cards.get(hubId);
  if (hub) {
    hub.classList.add("is-hub");
    hub.classList.remove("is-dimmed", "is-satellite", "is-star", "is-deck-card");
    hub.style.left = "";
    hub.style.top = "";
    hub.style.transform = "";
    main.appendChild(hub);
  }

  return { id: "orbit", layout: "wide", nav, main };
}
