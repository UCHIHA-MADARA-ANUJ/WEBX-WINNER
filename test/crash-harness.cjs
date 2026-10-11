/**
 * Client-crash harness — loads the built site in jsdom against the live
 * local server, lets the boot auto-advance into the hero, and reports
 * every uncaught exception / rejection.
 */
const { JSDOM, VirtualConsole } = require("jsdom");

const URL_BASE = "http://127.0.0.1:4173/";

const errors = [];
const logs = [];

const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (e) => {
  errors.push("[jsdomError] " + (e.stack || e.message));
});
virtualConsole.on("error", (...args) => logs.push("[console.error] " + args.join(" ")));
virtualConsole.on("warn", (...args) => logs.push("[console.warn] " + args.join(" ")));

async function main() {
  const dom = await JSDOM.fromURL(URL_BASE, {
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      window.addEventListener("error", (e) => {
        errors.push("[window.error] " + (e.error?.stack || e.message));
      });
      window.addEventListener("unhandledrejection", (e) => {
        errors.push("[unhandledrejection] " + (e.reason?.stack || String(e.reason)));
      });
      // jsdom has no WebGL — mimic a browser/iframe where WebGL is BLOCKED
      const origGetContext = window.HTMLCanvasElement.prototype.getContext;
      window.HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") {
          logs.push("[harness] WebGL request DENIED (like a blocked iframe)");
          return null;
        }
        try {
          return origGetContext.call(this, type, ...rest);
        } catch {
          return null;
        }
      };
      // matchMedia stub (framer-motion needs it)
      window.matchMedia = window.matchMedia || ((q) => ({
        matches: false, media: q, addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
      }));
    },
  });

  const window = dom.window;

  // wait through boot (~3.5s) + hero mount + dynamic chunk load
  await new Promise((r) => setTimeout(r, 7000));

  // try to click "just start" to reach the experience phase too
  try {
    const btns = [...window.document.querySelectorAll("button")];
    const skip = btns.find((b) => /just start/i.test(b.textContent || ""));
    if (skip) {
      logs.push("[harness] clicking 'just start'");
      skip.click();
      await new Promise((r) => setTimeout(r, 3000));
    } else {
      logs.push("[harness] no 'just start' button found; buttons: " + btns.map((b) => (b.textContent || "").trim().slice(0, 30)).join(" | "));
    }
  } catch (e) {
    errors.push("[harness click] " + e.stack);
  }

  console.log("=== ERRORS (" + errors.length + ") ===");
  errors.forEach((e) => console.log(e.slice(0, 1400) + "\n---"));
  console.log("=== LOGS ===");
  logs.slice(0, 40).forEach((l) => console.log(l.slice(0, 400)));
  process.exit(errors.length ? 1 : 0);
}

main().catch((e) => {
  console.error("harness failed:", e);
  process.exit(2);
});
