// The orchestrator. Captures behaviour, runs the engine, and rebuilds the
// interface when the engine decides the visitor's structure should change.
import { SECTIONS, SECTION_BY_ID, findNode } from './content.js';
import { SECTION_IDS, MODES, reduce, evaluate, metrics, markEvolution } from './engine/profile.js';
import { loadProfile, saveProfile, resetProfile } from './engine/store.js';
import { h } from './dom.js';
import { createConsole } from './console.js';
import * as chronicle from './views/chronicle.js';
import * as atlas from './views/atlas.js';
import * as terminal from './views/terminal.js';
import * as indexView from './views/index-grid.js';
import * as deck from './views/deck.js';

const VIEWS = { chronicle, atlas, terminal, index: indexView, deck };
const META = {
  chronicle: ['Chronicle', 'Linear editorial. Read in order.'],
  atlas: ['Atlas', 'Spatial constellation. Jump freely.'],
  terminal: ['Terminal', 'A shell. Everything is a command away.'],
  index: ['Index', 'Dense catalogue. Skim it all.'],
  deck: ['Deck', 'One section in focus. Step through.'],
};
const SIGNAL_LABELS = {
  linearity: 'Sequential moves', erratic: 'Non-sequential moves', avgDwell: 'Avg dwell / section',
  speed: 'Scroll speed (px/s)', dominance: 'Interest concentration', hesitation: 'Hesitation ratio',
  cmdRatio: 'Command ratio', diversity: 'Sections touched',
};

const $ = (sel) => document.querySelector(sel);
const stage = $('#stage');
const profile = loadProfile();
const returning = profile.visits > 0;
profile.visits += 1;

let mode = returning && MODES.includes(profile.lastMode) ? profile.lastMode : 'chronicle';
let focus = returning && SECTION_IDS.includes(profile.lastFocus) ? profile.lastFocus : 'manifesto';
let view = null;
let transition = Promise.resolve();
let pendingRebuilds = 0;
let programmaticUntil = 0;   // ignore scroll events caused by our own smooth scrolling
let saveTimer = null;
let frozen = false;          // set during a "forget me" reset so nothing writes the old profile back

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const isTyping = (el) => el?.matches?.('input, textarea, [contenteditable]');
const sectionFor = (id) => findNode(id)?.section.id ?? id;

// ---------- observation -------------------------------------------------------

function emit(ev) {
  reduce(profile, ev);
  scheduleSave();
  if (ev.t !== 'scroll') maybeEvolve();
  if (!$('#observer').hidden) renderObserver();
}

function persist() { if (!frozen) saveProfile(profile); }

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { persist(); saveTimer = null; }, 400);
}

function maybeEvolve() {
  if (paletteOpen() || pendingRebuilds > 0) return;
  const r = evaluate(profile, mode);
  if (r.shouldEvolve) setMode(r.mode, { auto: true, reason: r.reasons[0] });
}

// ---------- navigation --------------------------------------------------------

function goto(id, source = 'click') {
  if (!SECTION_IDS.includes(id)) return;
  if (id !== focus) {
    focus = id;
    emit({ t: 'nav', to: id, source });
    updateChips();
  }
  if (source !== 'scroll') {
    programmaticUntil = performance.now() + 900;
    view?.sync(focus);
  }
}

function stepFocus(dir, source) {
  const i = SECTION_IDS.indexOf(focus);
  const j = Math.max(0, Math.min(SECTION_IDS.length - 1, i + dir));
  if (j !== i) goto(SECTION_IDS[j], source);
}

function openNode(id) {
  const hit = findNode(id);
  if (!hit) return;
  emit({ t: 'click', topic: hit.section.id });
  goto(hit.section.id, 'click');
  showDetail(hit);
}

// ---------- structural transitions -------------------------------------------

function setMode(next, { manual = false, auto = false, reason = '' } = {}) {
  if (!MODES.includes(next)) return;
  if (manual) { profile.pinned = true; syncAutoToggle(); }
  if (next === mode && pendingRebuilds === 0) return;
  pendingRebuilds += 1;
  transition = transition
    .then(() => rebuild(next, { auto, reason }))
    .catch((err) => console.error('[webx] rebuild failed', err))
    .finally(() => { pendingRebuilds -= 1; });
}

async function rebuild(next, { auto, reason }) {
  if (next === mode) return;
  const prev = mode;
  const veil = $('#veil');
  veil.querySelector('.veil-text').textContent = `Rebuilding structure · ${META[next][0]}`;
  veil.classList.add('is-on');
  await wait(auto ? 520 : 320);
  view?.destroy();
  stage.innerHTML = '';
  mode = next;
  view = VIEWS[mode].mount(stage, ctx);
  window.scrollTo({ top: 0 });
  markEvolution(profile, mode, reason, auto);
  persist();
  document.body.dataset.mode = mode;
  updateDock();
  await wait(60);
  veil.classList.remove('is-on');
  if (auto) showEvolution(prev, next, reason);
  if (!auto) toast(`Structure set to ${META[next][0]}`, 'Auto-evolve is paused. Re-enable it in the dock.');
}

// ---------- the context handed to every structure ------------------------------

const ctx = {
  content: SECTIONS,
  modes: MODES,
  get focus() { return focus; },
  get mode() { return mode; },
  goto,
  openNode,
  setMode,
  emit,
  describe,
};

function describe() {
  const m = metrics(profile);
  const r = evaluate(profile, mode);
  const pct = (x) => (x == null ? 'not enough data' : `${Math.round(x * 100)}%`);
  return [
    { text: `Structure: ${META[mode][0]} · generation ${profile.generation} · visit ${profile.visits}`, cls: 'hi' },
    { text: `Sequential moves: ${pct(m.linearity)} · non-sequential: ${pct(m.erratic)}` },
    { text: `Average dwell: ${m.avgDwell ? (m.avgDwell / 1000).toFixed(1) + 's' : 'n/a'} · speed: ${m.speed ? Math.round(m.speed) + ' px/s' : 'n/a'}` },
    { text: `Top interest: ${m.topic ? SECTION_BY_ID[m.topic].label : 'none yet'} (${pct(m.dominance)})` },
    { text: `The engine would choose: ${META[r.mode][0]} — ${r.reasons[0]}`, cls: r.mode === mode ? 'ok' : 'dim' },
  ];
}

// ---------- detail window --------------------------------------------------------

function showDetail(hit) {
  const dlg = $('#detail');
  const body = $('#detail-body');
  body.innerHTML = '';
  if (hit.kind === 'item') {
    body.append(
      h('div', { class: 'kicker' }, `${hit.section.label} · ${hit.node.meta}`),
      h('h2', {}, hit.node.title),
      h('p', { class: 'lede' }, hit.node.blurb),
      hit.node.body.map((t) => h('p', {}, t)),
      h('button', { class: 'ghost', type: 'button', onclick: () => goto(hit.section.id, 'click') }, `Back to ${hit.section.label} →`),
    );
  } else {
    body.append(h('div', { class: 'kicker' }, hit.node.kicker), h('h2', {}, hit.node.title));
    if (hit.node.lede) body.append(h('p', { class: 'lede' }, hit.node.lede));
    body.append(hit.node.body.map((t) => h('p', {}, t)));
    if (hit.node.items) body.append(h('div', { class: 'cards' }, hit.node.items.map((i) =>
      h('button', { class: 'card', type: 'button', dataset: { open: i.id, topic: hit.node.id } },
        h('span', { class: 'meta' }, i.meta), h('span', { class: 'card-title' }, i.title)))));
  }
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
}

// ---------- palette ----------------------------------------------------------------

let paletteCon = null;
const paletteOpen = () => $('#palette').open;

function openPalette() {
  const dlg = $('#palette');
  if (!paletteCon) {
    const host = $('#palette-body');
    paletteCon = createConsole(host, ctx, {
      compact: true,
      banner: [{ text: 'Command palette. Anything you can do here, the Terminal structure can do too.', cls: 'dim' }],
    });
  }
  if (!dlg.open) dlg.showModal();
  paletteCon.focus();
}

// ---------- evolution banner & observer -------------------------------------------

function showEvolution(prev, next, reason) {
  toast(`Interface evolved · ${META[prev][0]} → ${META[next][0]}`, `Because ${reason || 'your behaviour changed'}. Generation ${profile.generation}.`, [
    h('button', { type: 'button', class: 'ghost', onclick: () => { setMode(prev, { manual: true }); closeToast(); } }, 'Revert'),
    h('button', { type: 'button', class: 'ghost', onclick: () => closeToast() }, 'Keep'),
  ], 9000);
}

let toastTimer = null;
function toast(title, body, actions = [], ttl = 5000) {
  const t = $('#toast');
  t.innerHTML = '';
  t.append(h('div', { class: 'toast-kicker' }, 'Evolution Engine'), h('div', { class: 'toast-title' }, title), h('p', {}, body));
  if (actions.length) t.append(h('div', { class: 'toast-actions' }, actions));
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(closeToast, ttl);
}
function closeToast() { $('#toast').classList.remove('is-on'); }

function renderObserver() {
  const m = metrics(profile);
  const r = evaluate(profile, mode);
  const el = $('#observer-body');
  const fmt = (k, v) => {
    if (v == null) return 'n/a';
    if (k === 'avgDwell') return `${(v / 1000).toFixed(1)} s`;
    if (k === 'speed') return `${Math.round(v)} px/s`;
    if (k === 'diversity') return `${Math.round(v * 5)} / 5`;
    return `${Math.round(v * 100)}%`;
  };
  el.innerHTML = '';
  el.append(
    h('section', { class: 'obs-block' },
      h('div', { class: 'panel-tag' }, 'Current structure'),
      h('div', { class: 'obs-big' }, META[mode][0]),
      h('p', { class: 'dim' }, `Generation ${profile.generation} · visit ${profile.visits} · ${profile.pinned ? 'auto-evolve paused' : 'auto-evolve on'}`)),
    h('section', { class: 'obs-block' },
      h('div', { class: 'panel-tag' }, 'Signals'),
      h('dl', { class: 'obs-dl' }, Object.entries(SIGNAL_LABELS).flatMap(([k, label]) => [
        h('dt', {}, label), h('dd', {}, fmt(k, m[k])),
      ]))),
    h('section', { class: 'obs-block' },
      h('div', { class: 'panel-tag' }, 'Structure scores'),
      Object.keys(r.adjusted).map((k) => {
        const v = Math.max(0, Math.min(1, r.raw[k]));
        return h('div', { class: `bar${k === r.mode ? ' is-win' : ''}` },
          h('span', { class: 'bar-label' }, META[k][0]),
          h('span', { class: 'bar-track' }, h('span', { class: 'bar-fill', style: { width: `${Math.round(v * 100)}%` } })),
          h('span', { class: 'bar-val' }, v.toFixed(2)));
      }),
      h('p', { class: 'dim small' }, r.evidence
        ? `The engine leans ${META[r.mode][0]}: ${r.reasons[0]}.`
        : 'Not enough evidence yet. Navigate a little more.')),
    h('section', { class: 'obs-block' },
      h('div', { class: 'panel-tag' }, 'Evolution history'),
      profile.modeHistory.length
        ? h('ol', { class: 'obs-hist' }, profile.modeHistory.slice(-6).reverse().map((x) =>
          h('li', {}, `${META[x.mode][0]} ${x.auto ? '· auto' : '· manual'}${x.reason ? ` — ${x.reason}` : ''}`)))
        : h('p', { class: 'dim small' }, 'No transformations yet.')),
    h('section', { class: 'obs-block' },
      h('div', { class: 'panel-tag' }, 'Recent events'),
      h('ol', { class: 'obs-log' }, profile.events.slice(-10).reverse().map((e) =>
        h('li', {}, `${e.t}${e.to ? ` → ${e.to}` : ''}${e.topic ? ` · ${e.topic}` : ''}${e.source ? ` (${e.source})` : ''}`)))),
    h('button', { type: 'button', class: 'ghost danger', onclick: () => {
      frozen = true;
      resetProfile();
      location.reload();
    } }, 'Forget me — reset memory'),
  );
}

function toggleObserver(force) {
  const panel = $('#observer');
  panel.hidden = force ?? !panel.hidden;
  if (!panel.hidden) renderObserver();
}

// ---------- dock & header -----------------------------------------------------------

function updateChips() {
  document.querySelectorAll('[data-goto]').forEach((b) => {
    if (b.closest('.header')) b.setAttribute('aria-current', b.dataset.goto === focus ? 'true' : 'false');
  });
}

function updateDock() {
  document.querySelectorAll('.dock-modes [data-mode]').forEach((b) => b.classList.toggle('is-on', b.dataset.mode === mode));
  $('#gen').textContent = `Gen ${profile.generation}`;
  $('#mode-name').textContent = META[mode][0];
  $('#mode-blurb').textContent = META[mode][1];
  updateChips();
  syncAutoToggle();
}

function syncAutoToggle() {
  const b = $('#auto');
  b.setAttribute('aria-pressed', String(!profile.pinned));
  b.textContent = profile.pinned ? 'Auto-evolve: paused' : 'Auto-evolve: on';
}

// ---------- global listeners -----------------------------------------------------------

document.addEventListener('click', (e) => {
  const t = e.target;
  const open = t.closest('[data-open]');
  if (open) return openNode(open.dataset.open);
  const go = t.closest('[data-goto]');
  if (go) {
    emit({ t: 'click', topic: go.dataset.goto });
    return goto(go.dataset.goto, 'click');
  }
  const step = t.closest('[data-step]');
  if (step) return stepFocus(Number(step.dataset.step), 'click');
  const mb = t.closest('.dock-modes [data-mode]');
  if (mb) return setMode(mb.dataset.mode, { manual: true });
  if (t.closest('[data-palette]')) return openPalette();
  if (t.closest('[data-observer]')) return toggleObserver();
  if (t.closest('[data-close-observer]')) return toggleObserver(false);
  if (t.closest('[data-auto]')) {
    profile.pinned = !profile.pinned;
    syncAutoToggle();
    if (!profile.pinned) maybeEvolve();
    persist();
    if (!$('#observer').hidden) renderObserver();
    return;
  }
  if (t.closest('[data-close-detail]')) return $('#detail').close();
  if (t.closest('[data-close-palette]')) return $('#palette').close();
  if (t.closest('[data-toast-close]')) return closeToast();
  // clicking the backdrop of a dialog closes it
  if (t.matches('dialog')) t.close();
});

// Hover hesitation: lingering over an entry for 1.2s without committing.
let hoverTimer = null, hoverTarget = null;
document.addEventListener('pointerover', (e) => {
  const t = e.target.closest?.('[data-open]');
  if (!t || t === hoverTarget) return;
  clearTimeout(hoverTimer);
  hoverTarget = t;
  hoverTimer = setTimeout(() => emit({ t: 'hover', topic: sectionFor(t.dataset.open), ms: 1200 }), 1200);
});
document.addEventListener('pointerout', (e) => {
  const t = e.target.closest?.('[data-open]');
  if (t && t === hoverTarget && !t.contains(e.relatedTarget)) {
    clearTimeout(hoverTimer);
    hoverTarget = null;
  }
});

// Scroll pace: smoothed px/s, sampled at most every 400ms.
let lastY = window.scrollY, lastT = performance.now(), lastEmit = 0, ema = 0;
window.addEventListener('scroll', () => {
  const now = performance.now();
  const bar = $('#progress');
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  if (now < programmaticUntil) { lastY = window.scrollY; lastT = now; return; }
  const dt = Math.max(16, now - lastT);
  const v = (Math.abs(window.scrollY - lastY) / dt) * 1000;
  lastY = window.scrollY; lastT = now;
  ema = ema * 0.7 + v * 0.3;
  if (now - lastEmit > 400 && ema > 0) { lastEmit = now; emit({ t: 'scroll', v: Math.round(ema) }); }
}, { passive: true });

document.addEventListener('keydown', (e) => {
  if (isTyping(e.target)) return;
  if (e.key === '/' && !paletteOpen()) { e.preventDefault(); openPalette(); return; }
  if (mode === 'deck' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    e.preventDefault();
    stepFocus(e.key === 'ArrowRight' ? 1 : -1, 'key');
  }
});

window.addEventListener('pagehide', persist);

// ---------- boot -------------------------------------------------------------------------

document.body.dataset.mode = mode;
view = VIEWS[mode].mount(stage, ctx);
updateDock();
persist();
if (returning) {
  toast(`Welcome back · generation ${profile.generation}`,
    `The interface remembers you and opened as ${META[mode][0]}. Keep moving; it will keep adapting.`, [], 7000);
}
window.__webx = { profile, metrics, evaluate, get mode() { return mode; } };
