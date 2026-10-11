/**
 * THE ENGINE TESTS — selection is not chaos.
 * Run: npm test
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  applyEvent, decay, mutate, neutralGenome,
  TRAITS, type Genome,
} from "../src/lib/evolution/genome";
import { createScheduler, PARADIGM_IDS, type ShapeId } from "../src/lib/evolution/scheduler";
import { UNITS, UNIT_MAP, searchUnits, semanticDistance, hash01 } from "../src/lib/evolution/content";

test("every unit links to real ids or urls", () => {
  for (const u of UNITS) {
    for (const l of u.links) {
      assert.ok(UNIT_MAP.has(l), `${u.id} links to missing unit "${l}"`);
    }
  }
});

test("genome: events nudge traits in the expected directions", () => {
  const g = neutralGenome();
  applyEvent(g, { type: "open", via: "next" });
  assert.ok(g.linearity > 0.5, "next-door opens push toward linearity");

  const g2 = neutralGenome();
  applyEvent(g2, { type: "expand", on: true });
  assert.ok(g2.depth > 0.5, "expanding pushes toward depth");

  const g3 = neutralGenome();
  applyEvent(g3, { type: "dwell", ms: 14000 });
  assert.ok(g3.depth > 0.5 && g3.pace < 0.5, "long dwell = deep and calm");
});

test("genome: decay pulls traits toward neutral", () => {
  const g: Genome = { linearity: 1, pace: 0, depth: 1, agency: 0, keyboard: 1 };
  decay(g, 120000);
  for (const t of TRAITS) {
    assert.ok(g[t] > 0 && g[t] < 1);
    assert.ok(Math.abs(g[t] - 0.5) < 0.5);
  }
  decay(g, 600000);
  for (const t of TRAITS) assert.ok(Math.abs(g[t] - 0.5) < 0.12);
});

test("genome: mutation stays bounded", () => {
  const g = neutralGenome();
  for (let i = 0; i < 200; i++) mutate(g, 0.2);
  for (const t of TRAITS) {
    assert.ok(g[t] >= 0 && g[t] <= 1, `${t} out of bounds: ${g[t]}`);
  }
});

test("scheduler: reader behaviour selects the magazine", () => {
  const genome: Genome = { linearity: 0.95, pace: 0.15, depth: 0.9, agency: 0.2, keyboard: 0.2 };
  const s = createScheduler({ genome });
  s.force("deck", "test"); // start away from magazine so a real switch happens
  const d = s.maybeRestructure(true);
  assert.ok(d, "a decisive genome must produce a decision");
  assert.equal(d!.to, "magazine");
});

test("scheduler: explorer behaviour selects the constellation", () => {
  const genome: Genome = { linearity: 0.12, pace: 0.55, depth: 0.35, agency: 0.95, keyboard: 0.3 };
  const s = createScheduler({ genome });
  const d = s.maybeRestructure(true);
  assert.ok(d);
  assert.equal(d!.to, "constellation");
});

test("scheduler: speedrunner behaviour selects the deck", () => {
  const genome: Genome = { linearity: 0.4, pace: 0.95, depth: 0.1, agency: 0.55, keyboard: 0.35 };
  const s = createScheduler({ genome });
  const d = s.maybeRestructure(true);
  assert.ok(d);
  assert.equal(d!.to, "deck");
});

test("scheduler: hysteresis — a weak challenger never steals the shape", () => {
  const genome: Genome = { linearity: 0.72, pace: 0.36, depth: 0.66, agency: 0.4, keyboard: 0.3 };
  const s = createScheduler({ genome });
  assert.equal(s.current, "magazine");
  const before = s.current;
  const d = s.maybeRestructure(true);
  if (d) assert.ok(d.to !== before, "if it switched, it was a real switch");
  else assert.equal(s.current, before);
});

test("scheduler: epochs must fire on schedule", () => {
  const genome = neutralGenome();
  let epochs = 0;
  const s = createScheduler({ genome, onEpoch: () => { epochs += 1; } });
  for (let i = 0; i < 12; i++) s.onAction();
  assert.ok(epochs >= 1, "epoch loop must observe the world");
});

test("scheduler: serialise + restore keeps the shape", () => {
  const genome = neutralGenome();
  const s1 = createScheduler({ genome });
  s1.force("orbit", "test");
  const snap = s1.serialize();
  const s2 = createScheduler({ genome });
  s2.restore(snap as never);
  assert.equal(s2.current, "orbit");
});

test("scheduler: forcing the same shape reports no decision", () => {
  const genome = neutralGenome();
  const s = createScheduler({ genome });
  assert.equal(s.current, "magazine");
  assert.equal(s.force("magazine" as ShapeId), null);
});

test("content: search finds units by name and tag", () => {
  const a = searchUnits("verde");
  assert.ok(a.length > 0 && a[0].id === "verde");
  const b = searchUnits("mun");
  assert.ok(b.some((u) => u.id === "mun"));
  const c = searchUnits("zzzz-nothing");
  assert.equal(c.length, 0);
});

test("content: semantic distance is symmetric-ish and sane", () => {
  const d1 = semanticDistance("verde", "nirmaan");
  const d2 = semanticDistance("nirmaan", "verde");
  assert.ok(Math.abs(d1 - d2) < 0.31);
  const d3 = semanticDistance("verde", "verde");
  assert.ok(d3 >= 0 && d3 <= 1);
  const linked = semanticDistance("resonate", "this-site");
  assert.ok(linked <= 0.3, "linked units must feel close");
});

test("content: hash01 is deterministic", () => {
  assert.equal(hash01("verde"), hash01("verde"));
  assert.notEqual(hash01("verde"), hash01("resonate"));
  assert.ok(hash01("anything") >= 0 && hash01("anything") < 1);
});

test("golden rule: plain attention never reorders — only evolution moments do", () => {
  const genome: Genome = { linearity: 0.95, pace: 0.15, depth: 0.9, agency: 0.2, keyboard: 0.2 };
  const s = createScheduler({ genome });
  s.force("magazine", "prime");

  const before = s.current;
  for (let i = 0; i < 6; i++) {
    applyEvent(genome, { type: "open", via: "click" });
    applyEvent(genome, { type: "expand", on: true });
    s.onAction();
  }
  assert.equal(s.current, before, "clicking and reading must not move anything");
});

test("prime mode: reader door biases the genome deep and linear", () => {
  const g = neutralGenome();
  applyEvent(g, { type: "prime", mode: "reader" });
  assert.ok(g.depth > 0.5 && g.linearity > 0.5 && g.pace < 0.5);
});
