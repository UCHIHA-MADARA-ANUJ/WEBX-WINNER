/**
 * DOM smoke tests (jsdom)
 * Boots the real controller against a real DOM: hero → choice →
 * morph → interactions, across the living shapes.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

async function bootDom() {
  const dom = new JSDOM(html, {
    url: "https://lattice.test/",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.Element.prototype.animate = function animate() {
    return { finished: Promise.resolve(), cancel() {}, play() {} };
  };
  window.Element.prototype.scrollIntoView = function scrollIntoView() {};
  window.HTMLImageElement.prototype.decode = () => Promise.resolve();

  for (const key of [
    "window", "document", "localStorage", "requestAnimationFrame",
    "getComputedStyle", "Node", "Element", "HTMLElement", "Event",
  ]) {
    if (window[key] !== undefined) globalThis[key] = window[key];
  }
  globalThis.addEventListener = window.addEventListener.bind(window);
  globalThis.removeEventListener = window.removeEventListener.bind(window);
  Object.defineProperty(globalThis, "scrollY", { get: () => window.scrollY, configurable: true });

  const { boot } = await import("../js/controller.js");
  const handle = boot();
  return {
    window,
    document: window.document,
    teardown() {
      handle.stop();
      window.close();
    },
  };
}

const settle = (ms = 60) => new Promise((r) => setTimeout(r, ms));

test("landing: cinematic hero with three doors and a skip", async (t) => {
  const { window, document, teardown } = await bootDom();
  t.after(teardown);
  assert.ok(document.querySelector(".hero"), "hero mounted");
  assert.equal(document.querySelectorAll(".door").length, 3, "three doors");
  assert.match(document.querySelector(".hero__name").textContent, /ANUJ/);
  assert.ok(document.querySelector(".hero__skip"), "skip escape hatch");
});

test("door: 'read carefully' morphs the site into the Magazine", async (t) => {
  const { window, document, teardown } = await bootDom();
  t.after(teardown);
  document.querySelector('[data-mode="reader"]').click();
  await settle(800);
  assert.equal(document.body.dataset.shape, "magazine");
  assert.ok(document.querySelector(".mag-doc"), "magazine mounted");
  assert.equal(document.querySelectorAll("[data-flip^='unit:']").length, 12, "twelve persistent cards");
  const banner = document.querySelector(".banner");
  assert.ok(banner && /magazine/i.test(banner.textContent), "explains the rebuild");
});

test("door: 'explore wildly' morphs the site into the Constellation", async (t) => {
  const { window, document, teardown } = await bootDom();
  t.after(teardown);
  document.querySelector('[data-mode="explorer"]').click();
  await settle(800);
  assert.equal(document.body.dataset.shape, "map");
  assert.ok(document.querySelector(".map-field"), "map mounted");
  assert.ok(document.querySelectorAll(".map-field .card.is-star").length >= 10, "stars placed");
});

test("door: 'speedrun' morphs the site into the Swipe Deck; keep advances", async (t) => {
  const { window, document, teardown } = await bootDom();
  t.after(teardown);
  document.querySelector('[data-mode="speedrunner"]').click();
  await settle(800);
  assert.equal(document.body.dataset.shape, "deck");
  document.querySelector("[data-deck='keep']").click();
  await settle(300);
  const kept = document.querySelector(".deck-stat strong");
  assert.equal(kept.textContent, "1", "one kept");
});

test("brain: 'see its brain' opens and explains in human words", async (t) => {
  const { window, document, teardown } = await bootDom();
  t.after(teardown);
  document.querySelector("#brain-btn").click();
  await settle(50);
  const brain = document.querySelector(".brain");
  assert.ok(brain.classList.contains("is-open"), "brain panel open");
  assert.match(brain.textContent, /what it thinks of you/i);
  assert.match(brain.textContent, /evolution, never chaos/i);
  assert.equal(document.querySelectorAll(".brain-trait").length, 5, "five traits");
  assert.equal(document.querySelectorAll(".brain-fit").length, 4, "four competing shapes");
});

test("jump: ⌘K palette opens and filters projects", async (t) => {
  const { window, document, teardown } = await bootDom();
  t.after(teardown);
  window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  const jump = document.getElementById("jump");
  assert.equal(jump.hidden, false, "jump overlay open");
  const input = document.getElementById("jump-input");
  input.value = "resonate";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  const results = document.querySelectorAll("#jump-results button");
  assert.ok(results.length >= 1);
  assert.match(results[0].textContent, /RESONATE/);
});

test("memory: actions persist and shapes stay reachable", async (t) => {
  const { window, document, teardown } = await bootDom();
  t.after(teardown);
  document.querySelector('[data-mode="reader"]').click();
  await settle(800);
  const card = document.querySelector("[data-id='verde']");
  card.querySelector('[data-act="open"]').click();
  await settle(300);
  assert.ok(document.querySelector("[data-id='verde']").classList.contains("is-expanded"), "card expands");
  const raw = window.localStorage.getItem("lattice.genome.v1");
  assert.ok(raw && JSON.parse(raw).generation === 1, "genome persisted");
});
