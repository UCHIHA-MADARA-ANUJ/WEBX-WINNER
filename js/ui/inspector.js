/**
 * LATTICE — engine inspector (the glass box)
 * Everything the organism believes about you, live and legible.
 * Trust through transparency: the interface explains its own
 * restructuring instead of demanding blind faith in it.
 */

import { TRAITS, TRAIT_LABELS } from "../engine/genome.js";
import { PARADIGMS, PARADIGM_IDS } from "../engine/scheduler.js";

export function buildInspector(host, ctx) {
  const el = document.createElement("aside");
  el.className = "inspector";
  el.id = "inspector";
  el.setAttribute("aria-label", "Engine inspector");
  el.innerHTML = `
    <div class="inspector__head">
      <div class="inspector__title">evolution engine</div>
      <div class="chrome__spacer"></div>
      <button class="mini-btn" data-close>close</button>
    </div>
    <div class="inspector__body">
      <section>
        <div class="panel__label">behavioural genome</div>
        <div class="traits"></div>
      </section>
      <section>
        <div class="panel__label">paradigm fitness</div>
        <div class="fits"></div>
      </section>
      <section>
        <div class="panel__label">force structure</div>
        <div class="inspector__forces"></div>
      </section>
      <section>
        <div class="panel__label">event stream</div>
        <div class="event-log"></div>
      </section>
      <section>
        <button class="mini-btn inspector__reset" data-reset>erase memory &amp; reset genome</button>
      </section>
    </div>
  `;
  host.appendChild(el);

  el.querySelector("[data-close]").addEventListener("click", () => ctx.toggleInspector(false));
  el.querySelector("[data-reset]").addEventListener("click", () => ctx.reset());

  const traitsEl = el.querySelector(".traits");
  const fitsEl = el.querySelector(".fits");
  const forcesEl = el.querySelector(".inspector__forces");
  const logEl = el.querySelector(".event-log");

  const traitRows = new Map();
  for (const t of TRAITS) {
    const row = document.createElement("div");
    row.className = "trait-row";
    row.innerHTML = `
      <div class="trait-row__head">
        <span>${t} · ${TRAIT_LABELS[t][0]} ←→ ${TRAIT_LABELS[t][1]}</span>
        <b>0.50</b>
      </div>
      <div class="trait-row__bar"><div class="trait-row__fill" style="width:50%"></div></div>
    `;
    traitsEl.appendChild(row);
    traitRows.set(t, row);
  }

  const fitRows = new Map();
  for (const id of PARADIGM_IDS) {
    const row = document.createElement("div");
    row.className = "fit-row";
    row.innerHTML = `
      <div class="fit-row__head"><b>${PARADIGMS[id].glyph} ${PARADIGMS[id].name}</b><span>0.00</span></div>
      <div class="fit-row__bar"><div class="fit-row__fill" style="width:0%"></div></div>
    `;
    fitsEl.appendChild(row);
    fitRows.set(id, row);
  }

  const forceBtns = new Map();
  for (const id of PARADIGM_IDS) {
    const b = document.createElement("button");
    b.className = "force-chip";
    b.textContent = `${PARADIGMS[id].glyph} ${PARADIGMS[id].name}`;
    b.addEventListener("click", () => ctx.forceParadigm(id));
    forcesEl.appendChild(b);
    forceBtns.set(id, b);
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
        row.querySelector("b").textContent = v.toFixed(2);
        row.querySelector(".trait-row__fill").style.width = `${v * 100}%`;
      }
      for (const f of fitnesses) {
        const row = fitRows.get(f.id);
        row.classList.toggle("is-current", f.id === current);
        row.querySelector("span").textContent =
          `${f.score.toFixed(3)}${f.novelty > 0.001 ? " +" + f.novelty.toFixed(2) + "✦" : ""}`;
        row.querySelector(".fit-row__fill").style.width = `${Math.min(100, f.score * 100)}%`;
      }
      for (const [id, b] of forceBtns) b.classList.toggle("is-on", id === current);

      logEl.innerHTML = "";
      for (const ev of events.slice(-14).reverse()) {
        const line = document.createElement("div");
        line.className = "event-log__line";
        line.innerHTML = `<span class="t">${ev.type}</span><span class="p">${
          ev.unitId || ev.via || ev.tag || ev.q || ""
        }</span>`;
        logEl.appendChild(line);
      }
    },
  };
}
