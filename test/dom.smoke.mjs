/**
 * LATTICE — DOM smoke test (jsdom)
 * Boots the real controller against a real DOM and walks through
 * interaction → restructure paths for several paradigms.
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

  // browser APIs jsdom does not implement
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.Element.prototype.animate = function animate() {
    return { finished: Promise.resolve(), cancel() {}, play() {} };
  };
  window.Element.prototype.scrollIntoView = function scrollIntoView() {};

  // expose browser globals to the ES modules
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

test("boot: chrome, cards and a paradigm render", async (t) => {
  const { window, document, teardown } = await bootDom();
  t.after(teardown);
  assert.ok(document.querySelector(".brand__name"), "chrome built");
  assert.equal(document.querySelectorAll("[data-flip^='unit:']").length, 10, "ten persistent cards");
  assert.equal(document.body.dataset.paradigm, "linear", "starts in Editorial");
  assert.ok(document.querySelector(".linear-rail"), "chapter rail mounted");
  assert.equal(document.querySelectorAll(".linear-chapter").length, 10);
});

test("interaction: read expands a card and survives re-render", async (t) => {
  const { window, document, teardown } = await bootDom();
  t.after(teardown);
  const card = document.querySelector("[data-id='feedback']");
  card.querySelector("[data-act='open']").click();
  const after = document.querySelector("[data-id='feedback']");
  assert.ok(after.classList.contains("is-expanded"), "expanded after click");
  assert.equal(after.querySelector(".card__body").hidden, false, "body revealed");
});

test("force: manual override restructures to Orbital with hub", async (t) => {
  const { window, document, teardown } = await bootDom();
  t.after(teardown);
  const buttons = [...document.querySelectorAll(".force-chip")];
  const orbital = buttons.find((b) => b.textContent.includes("Orbital"));
  orbital.click();
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(document.body.dataset.paradigm, "orbital", "paradigm switched");
  assert.equal(document.querySelectorAll(".card.is-hub").length, 1, "one hub");
  assert.ok(document.querySelectorAll(".card.is-satellite").length >= 5, "satellites orbit");
  const toast = document.querySelector(".toast");
  assert.ok(toast && /Orbital/.test(toast.textContent), "explains the change");
});

test("force: Terminal renders and runs commands", async (t) => {
  const { window, document, teardown } = await bootDom();
  t.after(teardown);
  const buttons = [...document.querySelectorAll(".force-chip")];
  buttons.find((b) => b.textContent.includes("Terminal")).click();
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(document.body.dataset.paradigm, "command");
  const input = document.querySelector("#term-input");
  assert.ok(input, "command input exists");
  input.value = "open swarm";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(document.querySelector("[data-id='swarm']").classList.contains("is-expanded"), true);
});

test("jump palette opens and filters", async (t) => {
  const { window, document, teardown } = await bootDom();
  t.after(teardown);
  window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  const jump = document.getElementById("jump");
  assert.equal(jump.hidden, false, "jump overlay open");
  const input = document.getElementById("jump-input");
  input.value = "swarm";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  const results = document.querySelectorAll("#jump-results button");
  assert.ok(results.length >= 1);
  assert.match(results[0].textContent, /Swarm/);
});

test("deck: keep/skip advances the queue", async (t) => {
  const { window, document, teardown } = await bootDom();
  t.after(teardown);
  [...document.querySelectorAll(".force-chip")].find((b) => b.textContent.includes("Triage")).click();
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(document.body.dataset.paradigm, "deck");
  const keep = document.querySelector("[data-deck='keep']");
  keep.click();
  await new Promise((r) => setTimeout(r, 30));
  const stats = document.querySelectorAll(".deck-stat strong");
  assert.equal(stats[0].textContent, "1", "one kept");
  assert.equal(stats[2].textContent, "9", "nine remaining");
});
