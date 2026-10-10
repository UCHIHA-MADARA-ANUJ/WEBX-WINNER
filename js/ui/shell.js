/**
 * Chrome — the one thing that never morphs.
 * Name, current shape, generation, brain button. Nothing else.
 */

export function buildChrome(host, ctx) {
  host.innerHTML = `
    <div class="brand">
      <div class="brand__mark" id="brand-mark" aria-hidden="true">AP</div>
      <div class="brand__text">
        <div class="brand__name">ANUJ PHULERA</div>
        <div class="brand__tag">the impossible interface</div>
      </div>
    </div>

    <div class="chrome__spacer"></div>

    <div class="shape-badge" id="shape-badge">
      <span class="shape-badge__glyph" id="shape-glyph">📖</span>
      <span class="shape-badge__name" id="shape-name">MAGAZINE</span>
    </div>

    <div class="gen-badge" id="gen-badge" title="how many visits this genome has lived">
      GEN <b id="gen-num">01</b>
    </div>

    <button class="chrome__btn chrome__btn--brain" id="brain-btn">
      <span class="chrome__btn-dot"></span> see its brain
    </button>
  `;

  host.querySelector("#brain-btn").addEventListener("click", () => ctx.toggleBrain());

  return {
    setShape(glyph, name) {
      const g = host.querySelector("#shape-glyph");
      const n = host.querySelector("#shape-name");
      g.textContent = glyph;
      n.textContent = name.toUpperCase();
      const badge = host.querySelector("#shape-badge");
      badge.classList.remove("is-shift");
      void badge.offsetWidth;
      badge.classList.add("is-shift");
    },
    setGeneration(gen) {
      host.querySelector("#gen-num").textContent = String(gen).padStart(2, "0");
    },
    pulse() {
      const mark = host.querySelector("#brand-mark");
      mark.classList.remove("brand__mark--pulse");
      void mark.offsetWidth;
      mark.classList.add("brand__mark--pulse");
    },
  };
}
