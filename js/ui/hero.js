/**
 * THE LANDING — cinematic hero
 * Five seconds to understand the concept, then three glowing doors.
 * Each door declares an intent — the genome listens, and the first
 * dramatic morph happens before you finish clicking.
 */

import { PROFILE } from "../content.js";

export function mountHero(host, { generation, onChoose, onSkip }) {
  const el = document.createElement("section");
  el.className = "hero";
  el.setAttribute("aria-label", "Welcome");
  el.innerHTML = `
    <div class="hero__bg" aria-hidden="true">
      <img src="assets/hero.jpg" alt="" />
      <div class="hero__fade"></div>
    </div>
    <div class="hero__inner">
      <div class="hero__kicker reveal r1">${generation >= 2 ? `RETURNING · GENERATION ${String(generation).padStart(2, "0")}` : "WEBX · THE IMPOSSIBLE INTERFACE"}</div>
      <h1 class="hero__name reveal r2">ANUJ<br/>PHULERA</h1>
      <p class="hero__role reveal r3">${PROFILE.role} — ${PROFILE.place}</p>
      <p class="hero__creed reveal r4">“${PROFILE.creed}”</p>
      <p class="hero__pitch reveal r5">
        This website has <em>no fixed layout</em>. It watches how you move — then
        <em>physically rebuilds itself</em> around you. Choose how you'd like to begin…
      </p>
      <div class="hero__doors reveal r6">
        <button class="door" data-mode="reader">
          <span class="door__glyph">📖</span>
          <span class="door__title">READ<br/>CAREFULLY</span>
          <span class="door__sub">become a magazine</span>
        </button>
        <button class="door" data-mode="explorer">
          <span class="door__glyph">🗺️</span>
          <span class="door__title">EXPLORE<br/>WILDLY</span>
          <span class="door__sub">become a constellation</span>
        </button>
        <button class="door" data-mode="speedrunner">
          <span class="door__glyph">💳</span>
          <span class="door__title">SPEED-<br/>RUN</span>
          <span class="door__sub">become a swipe deck</span>
        </button>
      </div>
      <button class="hero__skip reveal r7">or just start — let it figure me out</button>
      ${generation >= 2 ? `<div class="hero__memory reveal r7">✦ the genome remembers you from last time</div>` : ""}
    </div>
  `;

  el.querySelectorAll(".door").forEach((b) => {
    b.addEventListener("click", () => onChoose(b.dataset.mode));
  });
  el.querySelector(".hero__skip").addEventListener("click", () => onSkip());

  host.appendChild(el);

  return {
    dismiss() {
      return new Promise((resolve) => {
        el.classList.add("is-leaving");
        setTimeout(() => {
          el.remove();
          resolve();
        }, 640);
      });
    },
  };
}
