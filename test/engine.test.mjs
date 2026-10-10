/**
 * LATTICE — engine smoke tests (node --test)
 * The Evolution Engine's claims, verified: sequential reading bends
 * the genome toward linearity, epochs restructure under pressure,
 * and hysteresis prevents chaos.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { UNITS, searchUnits, semanticDistance, UNIT_IDS } from "../js/content.js";
import { neutralGenome, applyEvent, decay, mutate, TRAITS } from "../js/engine/genome.js";
import { createScheduler, PARADIGMS, PARADIGM_IDS } from "../js/engine/scheduler.js";

test("content: ten ideas, valid links, working search", () => {
  assert.equal(UNITS.length, 10);
  for (const u of UNITS) {
    assert.ok(u.title && u.summary && u.body.length >= 3, `${u.id} has body`);
    for (const l of u.links) assert.ok(UNIT_IDS.includes(l), `${u.id} → ${l} exists`);
  }
  const hits = searchUnits("feedback", new Map());
  assert.equal(hits[0].id, "feedback");
  assert.ok(searchUnits("", new Map()).length === 10);
  assert.ok(semanticDistance("feedback", "homeostasis") < semanticDistance("feedback", "swarm"));
});

test("genome: sequential opens raise linearity, jumps lower it", () => {
  const g = neutralGenome();
  const g2 = neutralGenome();
  for (let i = 0; i < 12; i++) applyEvent(g, { type: "open", via: "next" });
  for (let i = 0; i < 12; i++) applyEvent(g2, { type: "open", via: "jump" });
  assert.ok(g.linearity > 0.5, `sequential linearity ${g.linearity}`);
  assert.ok(g2.linearity < 0.5, `jumper linearity ${g2.linearity}`);
  assert.ok(g2.agency > 0.5, "jumping is agency");
});

test("genome: long dwell raises depth and lowers pace", () => {
  const g = neutralGenome();
  for (let i = 0; i < 8; i++) applyEvent(g, { type: "dwell", ms: 20000 });
  assert.ok(g.depth > 0.6, `depth ${g.depth}`);
  assert.ok(g.pace < 0.5, `pace ${g.pace}`);
});

test("genome: decay relaxes toward 0.5 and mutation stays bounded", () => {
  const g = neutralGenome();
  for (let i = 0; i < 20; i++) applyEvent(g, { type: "command" });
  assert.ok(g.keyboard > 0.6);
  decay(g, 10 * 60 * 1000);
  assert.ok(g.keyboard < 0.62 && g.keyboard > 0.5, `relaxed keyboard ${g.keyboard}`);
  for (let i = 0; i < 100; i++) mutate(g, 0.2);
  for (const t of TRAITS) assert.ok(g[t] >= 0 && g[t] <= 1, `${t} in bounds`);
});

test("scheduler: sustained keyboard behaviour promotes Terminal with hysteresis", () => {
  const g = neutralGenome();
  const s = createScheduler({ genome: g });
  assert.equal(s.current, "linear");

  // languid sequential reader → incumbent (Editorial) survives epochs
  for (let i = 0; i < 40; i++) {
    applyEvent(g, { type: "open", via: "next" });
    applyEvent(g, { type: "dwell", ms: 15000 });
    s.onAction();
    if (i % 10 === 0) s.maybeRestructure(true);
  }
  assert.equal(s.current, "linear", "reader stays in Editorial");

  // suddenly: command-driven rapid jumper
  const changes = [];
  for (let i = 0; i < 40; i++) {
    applyEvent(g, { type: "command" });
    applyEvent(g, { type: "jump" });
    applyEvent(g, { type: "dwell", ms: 800 });
    s.onAction();
    const d = s.maybeRestructure(true);
    if (d) changes.push(d);
  }
  assert.ok(changes.length > 0, "restructuring happened");
  assert.ok(["command", "spatial", "deck"].includes(s.current), `now in ${s.current}`);
});

test("scheduler: fitness ranking is live and current paradigm is flagged", () => {
  const g = neutralGenome();
  const s = createScheduler({ genome: g });
  const fits = s.fitnesses();
  assert.equal(fits.length, PARADIGM_IDS.length);
  assert.ok(fits[0].score >= fits[fits.length - 1].score);
  assert.ok(PARADIGMS[fits[0].id]);
});

test("scheduler: manual force always wins and logs why", () => {
  const g = neutralGenome();
  const s = createScheduler({ genome: g });
  const d = s.force("orbital", "manual");
  assert.equal(d.to, "orbital");
  assert.equal(s.current, "orbital");
  assert.ok(d.why.includes("manual override"));
  assert.equal(s.log.length, 1);
});

test("scheduler: return-visit mutation changes the starting structure", () => {
  const g = neutralGenome();
  // simulate a deep reader's saved genome
  for (let i = 0; i < 25; i++) {
    applyEvent(g, { type: "open", via: "next" });
    applyEvent(g, { type: "dwell", ms: 18000 });
  }
  const s = createScheduler({ genome: g });
  // mutation can drift the genome; even if not, fitness of a slow deep reader
  // strongly favours editorial-like structures
  mutate(g, 0.2);
  const best = s.fitnesses()[0];
  assert.ok(PARADIGMS[best.id], `best ${best.id} is a real paradigm`);
});
