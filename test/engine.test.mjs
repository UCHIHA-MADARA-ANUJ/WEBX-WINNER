/**
 * Engine smoke tests (node --test)
 * The Evolution Engine's claims, verified.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { UNITS, searchUnits, semanticDistance, UNIT_IDS, PROFILE } from "../js/content.js";
import { neutralGenome, applyEvent, decay, mutate, TRAITS } from "../js/engine/genome.js";
import { createScheduler, PARADIGMS, PARADIGM_IDS } from "../js/engine/scheduler.js";

test("content: twelve units, valid links, working search, real profile", () => {
  assert.equal(UNITS.length, 12);
  assert.match(PROFILE.name, /Anuj/);
  for (const u of UNITS) {
    assert.ok(u.title && u.summary && u.body.length >= 2, `${u.id} has body`);
    for (const l of u.links) assert.ok(UNIT_IDS.includes(l), `${u.id} → ${l} exists`);
  }
  const hits = searchUnits("verde", new Map());
  assert.equal(hits[0].id, "verde");
  assert.ok(searchUnits("", new Map()).length === 12);
  assert.ok(semanticDistance("verde", "nirmaan") < semanticDistance("verde", "contact"));
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

test("genome: the three hero doors prime distinct genomes", () => {
  const reader = neutralGenome();
  const explorer = neutralGenome();
  const speed = neutralGenome();
  applyEvent(reader, { type: "prime", mode: "reader" });
  applyEvent(explorer, { type: "prime", mode: "explorer" });
  applyEvent(speed, { type: "prime", mode: "speedrunner" });
  assert.ok(reader.depth > 0.6 && reader.pace < 0.4, "reader is deep and calm");
  assert.ok(explorer.agency > 0.6 && explorer.linearity < 0.4, "explorer roams");
  assert.ok(speed.pace > 0.6 && speed.depth < 0.4, "speedrunner is fast");
});

test("genome: decay relaxes toward 0.5 and mutation stays bounded", () => {
  const g = neutralGenome();
  for (let i = 0; i < 20; i++) applyEvent(g, { type: "command" });
  decay(g, 10 * 60 * 1000);
  assert.ok(g.keyboard < 0.62 && g.keyboard > 0.5, `relaxed keyboard ${g.keyboard}`);
  for (let i = 0; i < 100; i++) mutate(g, 0.2);
  for (const t of TRAITS) assert.ok(g[t] >= 0 && g[t] <= 1, `${t} in bounds`);
});

test("scheduler: calm reader stays in Magazine; speedrunner morphs away", () => {
  const g = neutralGenome();
  const s = createScheduler({ genome: g });
  assert.equal(s.current, "magazine");

  for (let i = 0; i < 40; i++) {
    applyEvent(g, { type: "open", via: "next" });
    applyEvent(g, { type: "dwell", ms: 15000 });
    s.onAction();
    if (i % 10 === 0) s.maybeRestructure(true);
  }
  assert.equal(s.current, "magazine", "reader stays in Magazine");

  const changes = [];
  for (let i = 0; i < 40; i++) {
    applyEvent(g, { type: "triage", verdict: "keep" });
    applyEvent(g, { type: "dwell", ms: 700 });
    s.onAction();
    const d = s.maybeRestructure(true);
    if (d) changes.push(d);
  }
  assert.ok(changes.length > 0, "restructuring happened");
  assert.ok(["deck", "map"].includes(s.current), `now in ${s.current}`);
});

test("scheduler: fitness ranking is live and current shape is ranked", () => {
  const g = neutralGenome();
  const s = createScheduler({ genome: g });
  const fits = s.fitnesses();
  assert.equal(fits.length, PARADIGM_IDS.length);
  assert.equal(PARADIGM_IDS.length, 4);
  assert.ok(fits[0].score >= fits[fits.length - 1].score);
});

test("scheduler: manual force always wins and explains itself", () => {
  const g = neutralGenome();
  const s = createScheduler({ genome: g });
  const d = s.force("orbit", "manual");
  assert.equal(d.to, "orbit");
  assert.equal(s.current, "orbit");
  assert.match(d.why, /chose/i);
  assert.equal(s.log.length, 1);
});
