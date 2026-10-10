/**
 * PARADIGM · COMMAND — terminal surface
 * Structure: the interface is a command line; available actions are
 * re-ranked live by how often you use them; navigation history is
 * first-class UI. Hierarchy = usage frequency. Built for keys.
 */

import { searchUnits, UNIT_MAP, UNITS } from "../../content.js";

const COMMANDS = [
  { cmd: "open", hint: "open an idea by name", usage: 0 },
  { cmd: "next", hint: "open the next idea in your order", usage: 0 },
  { cmd: "pin", hint: "pin the focused idea", usage: 0 },
  { cmd: "rel", hint: "follow a thread of the focused idea", usage: 0 },
  { cmd: "random", hint: "wander somewhere new", usage: 0 },
  { cmd: "evolve", hint: "force a structural epoch now", usage: 0 },
  { cmd: "where", hint: "report the current structure", usage: 0 },
  { cmd: "help", hint: "list commands", usage: 0 },
  { cmd: "clear", hint: "clear this console", usage: 0 },
];

export function createCommand(ctx) {
  const { ranked, state, cards, act, promoted = {} } = ctx;

  const nav = document.createElement("aside");
  nav.className = "recompose";
  nav.innerHTML = `<div class="panel__label">action history</div>`;
  const hist = document.createElement("div");
  hist.className = "history-list";
  const events = ctx.recentEvents || [];
  for (const ev of events.slice(-14).reverse()) {
    const li = document.createElement("button");
    li.className = "history-item";
    const ago = Math.max(0, Math.round((Date.now() - ev.t) / 1000));
    li.innerHTML = `<span class="t">${ev.type}</span><span class="ago">${ago < 60 ? ago + "s" : Math.round(ago / 60) + "m"}</span>`;
    li.addEventListener("click", () => {
      if (ev.unitId) act("open", { unitId: ev.unitId, via: "command" });
    });
    hist.appendChild(li);
  }
  if (!events.length) {
    hist.innerHTML = `<div class="history-item">no actions yet — start typing</div>`;
  }
  nav.appendChild(hist);

  /* ---- terminal ---- */
  const main = document.createElement("div");
  main.innerHTML = `
    <div class="term">
      <div class="term__bar">
        <span class="term__dots"><i></i><i></i><i></i></span>
        lattice — command surface · ${UNITS.length} ideas indexed
      </div>
      <div class="term__input-row">
        <span class="term__prompt">λ</span>
        <input class="term__input" id="term-input" type="text" autocomplete="off" spellcheck="false"
               placeholder="type a command…  (try: open feedback)" aria-label="command input" />
      </div>
      <div class="term__out" id="term-out"></div>
    </div>
    <div class="command-cards"></div>
  `;

  const input = main.querySelector("#term-input");
  const out = main.querySelector("#term-out");
  const cardDock = main.querySelector(".command-cards");

  // suggestions ranked by live usage — the action set itself reorders
  function suggestions() {
    const rankedCmds = [...COMMANDS].sort(
      (a, b) => (promoted[b.cmd] || b.usage) - (promoted[a.cmd] || a.usage)
    );
    return rankedCmds;
  }

  function renderOut() {
    out.innerHTML = "";
    const q = input.value.trim();

    if (!q) {
      const line = document.createElement("div");
      line.className = "term__line is-dim";
      line.innerHTML = `<span class="k">ready</span><span class="d">actions ranked by your usage</span>`;
      out.appendChild(line);
      for (const c of suggestions().slice(0, 6)) {
        const b = document.createElement("button");
        b.className = "term__line";
        b.innerHTML = `<span class="k">${c.cmd}</span><span class="d">${c.hint}</span>
                       <span class="s">${promoted[c.cmd] ? (promoted[c.cmd]) + "× used" : ""}</span>`;
        b.addEventListener("click", () => {
          if (c.cmd === "open" || c.cmd === "help" || c.cmd === "where") {
            input.value = c.cmd + " ";
            input.focus();
            renderOut();
          } else {
            input.value = c.cmd;
            runCommand(c.cmd);
          }
        });
        out.appendChild(b);
      }
      return;
    }

    // fuzzy: command match or idea search
    const matches = searchUnits(q.replace(/^open\s+/i, ""), ctx.affinity).slice(0, 5);
    for (const u of matches) {
      const b = document.createElement("button");
      b.className = "term__line";
      b.innerHTML = `<span class="k">found</span><span class="d">${u.title}</span><span class="s">${u.minutes} min</span>`;
      b.addEventListener("click", () => runCommand(`open ${u.id}`));
      out.appendChild(b);
    }
    const help = document.createElement("div");
    help.className = "term__line is-dim";
    help.innerHTML = `<span class="k">enter</span><span class="d">run “${q}”</span>`;
    out.appendChild(help);
  }

  function runCommand(raw) {
    const q = raw.trim();
    const [verb, ...rest] = q.split(/\s+/);
    const arg = rest.join(" ");
    const log = (k, d) => {
      const line = document.createElement("div");
      line.className = "term__line";
      line.innerHTML = `<span class="k">${k}</span><span class="d">${d}</span>`;
      out.prepend(line);
    };

    switch (verb?.toLowerCase()) {
      case "open": {
        const found = searchUnits(arg, ctx.affinity)[0];
        if (found) {
          act("open", { unitId: found.id, via: "command" });
          log("open", found.title);
        } else log("err", `nothing matches “${arg}”`);
        break;
      }
      case "next": {
        act("next", {});
        log("next", "moved along your sequence");
        break;
      }
      case "pin": {
        const id = arg && UNIT_MAP.get(arg) ? arg : state.focusId;
        if (id) {
          act("pin", { unitId: id });
          log("pin", UNIT_MAP.get(id).title);
        } else log("err", "nothing focused");
        break;
      }
      case "rel": {
        const id = state.focusId;
        const u = id && UNIT_MAP.get(id);
        const target = u && (u.links.find((l) => !arg || l.includes(arg)) || u.links[0]);
        if (target) {
          act("rel", { unitId: target, from: id });
          log("rel", UNIT_MAP.get(target).title);
        } else log("err", "no threads on this idea");
        break;
      }
      case "random": {
        const u = ranked[Math.floor(Math.random() * ranked.length)];
        act("jump", { unitId: u, via: "command" });
        log("random", UNIT_MAP.get(u).title);
        break;
      }
      case "evolve": {
        act("evolve", {});
        log("evolve", "epoch forced — restructuring…");
        break;
      }
      case "where": {
        log("where", `structure: ${state.paradigmName || "…"} · focus: ${state.focusId || "none"}`);
        break;
      }
      case "clear":
        out.innerHTML = "";
        break;
      case "help":
      default: {
        log("help", "open · next · pin · rel · random · evolve · where · clear");
        if (verb && !["help"].includes(verb.toLowerCase())) {
          const found = searchUnits(q, ctx.affinity)[0];
          if (found) {
            act("open", { unitId: found.id, via: "command" });
            log("open", found.title);
          }
        }
        break;
      }
    }
    input.value = "";
    renderOut();
    setTimeout(() => input.focus(), 30);
  }

  input.addEventListener("input", renderOut);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runCommand(input.value);
    e.stopPropagation();
  });

  for (const id of ranked) {
    const el = cards.get(id);
    if (!el) continue;
    el.classList.remove("is-hub", "is-dimmed", "is-satellite");
    cardDock.appendChild(el);
  }

  renderOut();
  requestAnimationFrame(() => input.focus());

  return { id: "command", layout: "sidebar", nav, main };
}
