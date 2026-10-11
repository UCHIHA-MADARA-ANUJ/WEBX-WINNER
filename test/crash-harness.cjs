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
      // node has these; jsdom's window does not — Next's RSC client needs them
      const { ReadableStream, WritableStream, TransformStream } = require("stream/web");
      window.ReadableStream = window.ReadableStream || ReadableStream;
      window.WritableStream = window.WritableStream || WritableStream;
      window.TransformStream = window.TransformStream || TransformStream;
      window.TextEncoder = window.TextEncoder || require("util").TextEncoder;
      window.TextDecoder = window.TextDecoder || require("util").TextDecoder;
      window.MessageChannel = window.MessageChannel || require("worker_threads").MessageChannel;
      window.ResizeObserver = window.ResizeObserver || class {
        observe() {} unobserve() {} disconnect() {}
      };

      window.addEventListener("error", (e) => {
        errors.push("[window.error] " + (e.error?.stack || e.message));
      });
      window.addEventListener("unhandledrejection", (e) => {
        errors.push("[unhandledrejection] " + (e.reason?.stack || String(e.reason)));
      });
      // jsdom has no WebGL — mimic a browser/iframe where WebGL is BLOCKED
      // silent 2d mock so Canvas2DWave can run its loop without jsdom noise
      const mock2d = new Proxy({}, {
        get: (t, prop) => {
          if (prop === "createRadialGradient" || prop === "createLinearGradient")
            return () => ({ addColorStop() {} });
          return () => {};
        },
        set: () => true,
      });
      const origGetContext = window.HTMLCanvasElement.prototype.getContext;
      window.HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") {
          logs.push("[harness] WebGL request DENIED (like a blocked iframe)");
          return null;
        }
        if (type === "2d") return mock2d;
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
      const pill = () => [...window.document.querySelectorAll("span")]
        .map((s) => (s.textContent || "").trim())
        .filter((t) => ["MAGAZINE", "CONSTELLATION", "SWIPE DECK", "ORBIT"].includes(t))
        .join(",");
      logs.push("[harness] chrome pill after start: " + (pill() || "?"));
      // exercise keyboard paths: brain, jump, shape-cycle
      const key = (k) => window.dispatchEvent(new window.KeyboardEvent("keydown", { key: k, bubbles: true }));
      logs.push("[harness] pressing b (brain)");
      key("b");
      await new Promise((r) => setTimeout(r, 800));
      logs.push("[harness] pressing Escape");
      key("Escape");
      await new Promise((r) => setTimeout(r, 300));
      logs.push("[harness] pressing / (jump)");
      key("/");
      await new Promise((r) => setTimeout(r, 800));
      key("Escape");
      await new Promise((r) => setTimeout(r, 300));
      logs.push("[harness] pressing m (cycle shape)");
      if (window.document.activeElement && window.document.activeElement.blur) window.document.activeElement.blur();
      key("m");
      await new Promise((r) => setTimeout(r, 2000));
      const shapes = window.document.body.textContent || "";
      logs.push("[harness] chrome pill after m: " + (pill() || "?") + " | banner: " + (shapes.includes("You chose this") || shapes.includes("rebuilt itself")));
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
