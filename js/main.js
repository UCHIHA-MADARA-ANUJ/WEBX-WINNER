/**
 * LATTICE — entry point
 */
import { boot } from "./controller.js";

if (document.readyState === "loading") {
  addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
