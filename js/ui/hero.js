/**
 * THE LANDING — hero v3
 * Type as art. Three glowing doors. Five seconds to understand
 * everything, and a reason to remember the name.
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
      <div class="hero__kicker reveal r1">
        <span class="hero__kicker-dash"></span>
        ${generation >= 2 ? `RETURNING SOUL · GENERATION ${String(generation).padStart(2, "0")}` : "WEBX · THE IMPOSSIBLE INTERFACE"}
        <span class="hero__kicker-dash"></span>
      </div>

      <h1 class="hero__name reveal r2" aria-label="Anuj Phulera">
        <span class="hero__name-line hero__name-line--solid">ANUJ</span>
        <span class="hero__name-line hero__name-line--ghost">PHULERA</span>
      </h1>

      <div class="hero__role reveal r3">
        <span>BUILDER</span><i>✦</i><span>DESIGNER</span><i>✦</i><span>FULL-STACK</span><i>✦</i><span>DELHI</span>
      </div>

      <p class="hero__creed reveal r4"><span class="hero__creed-mark">「</span>${PROFILE.creed}<span class="hero__creed-mark">」</span></p>

      <p class="hero__pitch reveal r5">
        This website has <em>no fixed layout</em> — it watches how you move and
        <em>physically rebuilds itself</em> around you. Choose how your story begins.
      </p>

      <div class="hero__doors reveal r6">
        <button class="door door--read" data-mode="reader">
          <span class="door__glow" aria-hidden="true"></span>
          <span class="door__glyph">📖</span>
          <span class="door__title">READ<br/>CAREFULLY</span>
          <span class="door__sub">→ become a magazine</span>
        </button>
        <button class="door door--explore" data-mode="explorer">
          <span class="door__glow" aria-hidden="true"></span>
          <span class="door__glyph">🗺️</span>
          <span class="door__title">EXPLORE<br/>WILDLY</span>
          <span class="door__sub">→ become a constellation</span>
        </button>
        <button class="door door--speed" data-mode="speedrunner">
          <span class="door__glow" aria-hidden="true"></span>
          <span class="door__glyph">💳</span>
          <span class="door__title">SPEED-<br/>RUN</span>
          <span class="door__sub">→ become a swipe deck</span>
        </button>
      </div>

      <button class="hero__skip reveal r7">or just start — let it figure me out</button>

      <div class="hero__foot reveal r7">
        ${generation >= 2 ? `<span class="hero__memory">✦ the genome remembers you from last time</span>` : `<span class="hero__scroll">scroll of reality ↓ moves are being watched</span>`}
      </div>
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
