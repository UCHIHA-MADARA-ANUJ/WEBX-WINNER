/**
 * SEE ITS BRAIN — the glass box, in human words
 * What the site believes about you, why each shape is winning,
 * and what it just saw you do. Trust through transparency.
 */

import { TRAITS } from "../engine/genome.js";
import { PARADIGMS, PARADIGM_IDS } from "../engine/scheduler.js";

const HUMAN = {
  linearity: ["journey", "straight line", "free roam"],
  pace: ["tempo", "calm", "rapid"],
  depth: ["reading", "grazing", "diving"],
  agency: ["control", "follows", "drives"],
  keyboard: ["input", "pointer", "keys"],
};

const EVENT_WORDS = {
  open: (e) => `opened “${e.unitId || "something"}” via ${e.via || "click"}`,
  expand: (e) => (e.on ? `expanded a card to read it fully` : `collapsed a card`),
  dwell: (e) => `lingered ${(e.ms / 1000).toFixed(0)}s on “${e.unitId || "…"}”`,
  pin: (e) => (e.on ? `pinned a card` : `unpinned a card`),
  jump: (e) => `jumped straight to “${e.unitId || "…"}”`,
  search: (e) => `searched for “${e.q || "…"}”`,
  navigate: (e) => `moved via ${e.via || "…"}`,
  triage: (e) => `judged a card: ${e.verdict || "…"}`,
  command: () => `used a keyboard command`,
  orbit: (e) => `re-centred the orbit on “${e.unitId || "…"}”`,
  "force-paradigm": () => `forced a shape manually`,
  "grid-group": (e) => `switched group to ${e.group || "…"}`,
  reshuffle: () => `reshuffled the deck`,
  evolve: () => `forced an evolution epoch`,
};

export function buildBrain(host, ctx) {
  const el = document.createElement("aside");
  el.className = "brain";
  el.setAttribute("aria-label", "See its brain");
  el.innerHTML = `
    <div class="brain__head">
      <div class="brain__title">🧠 see its brain</div>
      <button class="mini-btn" data-close>close</button>
    </div>
    <div class="brain__body">
      <section>
        <div class="brain__section">what it thinks of you</div>
        <div class="brain__core" aria-hidden="true"><div class="brain__core-orb"></div></div>
        <div class="brain__traits"></div>
      </section>
      <section>
        <div class="brain__section">the four shapes, competing right now</div>
        <div class="brain__fits"></div>
      </section>
      <section>
        <div class="brain__section">what it just saw you do</div>
        <div class="brain__events"></div>
      </section>
      <section>
        <div class="brain__footnote">
          Every action nudges 5 behavioural traits. They decay toward neutral,
          so only patterns — not single clicks — reshape the site. Shapes compete
          on fitness; a new shape must beat the current one before the site
          dares to rebuild. <b>Evolution, never chaos.</b>
        </div>
        <button class="mini-btn brain__reset" data-reset>erase its memory of me</button>
      </section>
    </div>
  `;
  host.appendChild(el);
  el.querySelector("[data-close]").addEventListener("click", () => ctx.toggleBrain(false));
  el.querySelector("[data-reset]").addEventListener("click", () => ctx.reset());

  const traitsEl = el.querySelector(".brain__traits");
  const fitsEl = el.querySelector(".brain__fits");
  const eventsEl = el.querySelector(".brain__events");

  const traitRows = new Map();
  for (const t of TRAITS) {
    const [label, lo, hi] = HUMAN[t];
    const row = document.createElement("div");
    row.className = "brain-trait";
    row.innerHTML = `
      <div class="brain-trait__head"><span>${label}</span><b>—</b></div>
      <div class="brain-trait__bar"><div class="brain-trait__fill"></div></div>
      <div class="brain-trait__poles"><span>${lo}</span><span>${hi}</span></div>
    `;
    traitsEl.appendChild(row);
    traitRows.set(t, row);
  }

  const fitRows = new Map();
  for (const id of PARADIGM_IDS) {
    const row = document.createElement("div");
    row.className = "brain-fit";
    row.innerHTML = `
      <div class="brain-fit__head"><b>${PARADIGMS[id].glyph} ${PARADIGMS[id].name}</b><span>—</span></div>
      <div class="brain-fit__bar"><div class="brain-fit__fill"></div></div>
    `;
    fitsEl.appendChild(row);
    fitRows.set(id, row);
  }

  return {
    el,
    open(v = true) {
      el.classList.toggle("is-open", v);
    },
    isOpen: () => el.classList.contains("is-open"),

    render({ genome, fitnesses, current, events }) {
      for (const t of TRAITS) {
        const row = traitRows.get(t);
        const v = genome[t];
        row.querySelector("b").textContent =
          v < 0.38 ? HUMAN[t][1] : v > 0.62 ? HUMAN[t][2] : `mixed`;
        row.querySelector(".brain-trait__fill").style.width = `${8 + v * 92}%`;
      }
      // the core orb breathes with the genome
      const core = el.querySelector(".brain__core-orb");
      const energy = (genome.pace + genome.agency) / 2;
      core.style.setProperty("--energy", energy.toFixed(2));
      core.style.transform = `scale(${(0.85 + energy * 0.45).toFixed(2)})`;

      for (const f of fitnesses) {
        const row = fitRows.get(f.id);
        row.classList.toggle("is-current", f.id === current);
        row.querySelector("span").textContent = f.score.toFixed(2);
        row.querySelector(".brain-fit__fill").style.width = `${Math.min(100, f.score * 100)}%`;
      }

      eventsEl.innerHTML = "";
      for (const ev of events.slice(-10).reverse()) {
        const line = document.createElement("div");
        line.className = "brain-event";
        const say = EVENT_WORDS[ev.type];
        line.innerHTML = `<span class="brain-event__t">${ev.type}</span><span>${say ? say(ev) : JSON.stringify(ev).slice(0, 60)}</span>`;
        eventsEl.appendChild(line);
      }
    },
  };
}
