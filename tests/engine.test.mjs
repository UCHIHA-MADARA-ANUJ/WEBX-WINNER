import test from 'node:test';
import assert from 'node:assert/strict';
import { createProfile, reduce, metrics, evaluate, markEvolution } from '../src/engine/profile.js';

// helpers to drive the engine with synthetic behaviour
const SECTIONS = ['manifesto', 'work', 'method', 'journal', 'contact'];
function run(events, p = createProfile()) {
  let t = 1_000_000;
  for (const e of events) reduce(p, { ...e, at: (t += e.gap ?? 4000) });
  return p;
}
const nav = (to, gap, source = 'scroll') => ({ t: 'nav', to, source, gap });

test('a linear reader is classified as Chronicle', () => {
  const evs = SECTIONS.map((s) => nav(s, 9000));
  evs.push({ t: 'scroll', v: 300, gap: 500 }, { t: 'scroll', v: 350, gap: 500 });
  const r = evaluate(run(evs), 'atlas');
  assert.equal(r.mode, 'chronicle');
  assert.ok(metrics(run(evs)).linearity === 1);
});

test('an erratic jumper is classified as Atlas', () => {
  const order = ['contact', 'manifesto', 'journal', 'work', 'contact', 'method', 'manifesto', 'journal'];
  const evs = order.map((s) => nav(s, 3000, 'click'));
  const r = evaluate(run(evs), 'chronicle');
  assert.equal(r.mode, 'atlas');
  assert.equal(r.shouldEvolve, true);
});

test('a fast skimmer is classified as Index', () => {
  const evs = [];
  for (const s of SECTIONS) evs.push(nav(s, 1500, 'click'));
  for (let i = 0; i < 6; i++) evs.push({ t: 'scroll', v: 2600, gap: 300 });
  const r = evaluate(run(evs), 'chronicle');
  assert.equal(r.mode, 'index');
});

test('a topic-focused slow reader is classified as Deck', () => {
  const evs = [];
  for (let i = 0; i < 6; i++) {
    evs.push({ t: 'click', topic: 'work', gap: 20000 });
    evs.push({ t: 'nav', to: 'work', source: 'click', gap: 20000 });
    evs.push({ t: 'nav', to: 'method', source: 'click', gap: 20000 });
  }
  const r = evaluate(run(evs), 'chronicle');
  assert.equal(r.mode, 'deck');
  assert.match(r.reasons[0], /work/);
});

test('command-heavy visitors are classified as Terminal', () => {
  const evs = [
    { t: 'cmd', cmd: 'ls', gap: 2000 }, { t: 'cmd', cmd: 'cat work', gap: 2000 },
    { t: 'cmd', cmd: 'open p-lattice', gap: 2000 }, nav('work', 2000, 'cmd'),
    nav('method', 2000, 'cmd'), nav('journal', 2000, 'cmd'),
  ];
  assert.equal(evaluate(run(evs), 'chronicle').mode, 'terminal');
});

test('no evidence means no evolution', () => {
  const r = evaluate(run([nav('work', 1000)]), 'chronicle');
  assert.equal(r.evidence, false);
  assert.equal(r.shouldEvolve, false);
});

test('pinned profiles never auto-evolve', () => {
  const p = run(['contact', 'manifesto', 'journal', 'work', 'contact', 'method'].map((s) => nav(s, 3000, 'click')));
  p.pinned = true;
  assert.equal(evaluate(p, 'chronicle').shouldEvolve, false);
});

test('cooldown: a fresh evolution waits for enough new navigation', () => {
  const p = run(['contact', 'manifesto', 'journal', 'work', 'contact', 'method'].map((s) => nav(s, 3000, 'click')));
  assert.equal(evaluate(p, 'chronicle').shouldEvolve, true);
  markEvolution(p, 'atlas', 'test', true);
  assert.equal(evaluate(p, 'atlas').shouldEvolve, false);
  assert.equal(p.generation, 1);
});

test('repeated same-section navigation is ignored; dwell is capped', () => {
  const p = run([nav('work', 1000), nav('work', 1000), { t: 'nav', to: 'method', source: 'click', gap: 10_000_000 }]);
  const navs = p.events.filter((e) => e.t === 'nav');
  assert.equal(navs.length, 2);
  assert.equal(navs[1].dwell, 120000);
});

test('profiles survive a JSON round trip (cross-visit memory)', () => {
  const p = run(SECTIONS.map((s) => nav(s, 4000)));
  const back = JSON.parse(JSON.stringify(p));
  assert.deepEqual(metrics(back), metrics(p));
});
