/**
 * LATTICE — chrome shell
 * Persistent identity + the organism's live vital signs.
 * The one thing the visitor can always trust while the body
 * of the interface reorganises itself.
 */

export function buildChrome(host, ctx) {
  host.innerHTML = `
    <div class="brand">
      <div class="brand__mark" id="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M18 46 32 14l14 32M23 36h18" stroke="#7df9c9" stroke-width="5"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div>
        <div class="brand__name">Lattice</div>
        <div class="brand__tag">an interface that grows around you</div>
      </div>
    </div>

    <div class="chrome__spacer"></div>

    <div class="genome-strip" id="genome-strip" title="live behavioural genome"
         role="img" aria-label="behavioural genome bar">
    </div>

    <div class="badge badge--live" id="paradigm-badge">
      <span class="badge__dot"></span>
      <span>structure</span>
      <strong id="paradigm-name">editorial</strong>
    </div>

    <div class="badge" id="gen-badge" title="cross-visit generation">
      <span>gen</span><strong id="gen-num">01</strong>
    </div>

    <button class="chrome__btn" id="jump-btn" aria-label="Open quick jump">
      jump <kbd>⌘K</kbd>
    </button>
    <button class="chrome__btn" id="inspect-btn" aria-label="Open engine inspector">
      engine
    </button>
  `;

  const strip = host.querySelector("#genome-strip");
  const bars = [];
  for (let i = 0; i < 5; i++) {
    const b = document.createElement("div");
    b.className = "genome-strip__bar";
    strip.appendChild(b);
    bars.push(b);
  }

  host.querySelector("#jump-btn").addEventListener("click", () => ctx.openJump());
  host.querySelector("#inspect-btn").addEventListener("click", () => ctx.toggleInspector());

  return {
    setParadigm(name) {
      host.querySelector("#paradigm-name").textContent = name.toLowerCase();
    },
    setGeneration(gen) {
      host.querySelector("#gen-num").textContent = String(gen).padStart(2, "0");
    },
    pulseRestructure() {
      const badge = host.querySelector("#paradigm-badge");
      const mark = host.querySelector("#brand-mark");
      badge.classList.add("badge--restructure");
      mark.classList.remove("brand__mark--pulse");
      void mark.offsetWidth;
      mark.classList.add("brand__mark--pulse");
      setTimeout(() => badge.classList.remove("badge--restructure"), 1800);
    },
    setGenome(genome) {
      const order = ["linearity", "pace", "depth", "agency", "keyboard"];
      order.forEach((t, i) => {
        const v = genome[t];
        bars[i].style.height = `${4 + v * 22}px`;
        bars[i].title = `${t}: ${v.toFixed(2)}`;
      });
    },
  };
}
