/**
 * LATTICE — structural morphing (FLIP)
 *
 * First, Last, Invert, Play. Cards keep their DOM identity while
 * their positions, sizes and parents change underneath them — so a
 * paradigm shift looks like one organism reorganising its body,
 * not a webpage replacing another webpage.
 */

const prefersReduced = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/**
 * Run `mutate()` (which may re-parent/re-style cards) and fly
 * every [data-flip] element from its old rect to its new one.
 */
export function flipMorph(mutate, { duration = 520, fade = true } = {}) {
  const nodes = () => [...document.querySelectorAll("[data-flip]")];

  if (prefersReduced()) {
    mutate();
    return Promise.resolve();
  }

  const firstRects = new Map();
  for (const el of nodes()) firstRects.set(el, el.getBoundingClientRect());

  mutate();

  const anims = [];
  for (const el of nodes()) {
    const first = firstRects.get(el);
    const last = el.getBoundingClientRect();
    if (!first || last.width === 0) continue;

    const dx = first.left - last.left;
    const dy = first.top - last.top;
    const sx = first.width / Math.max(1, last.width);
    const sy = first.height / Math.max(1, last.height);

    // skip near-zero motion to keep the transition crisp
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2 && Math.abs(sx - 1) < 0.02 && Math.abs(sy - 1) < 0.02) {
      continue;
    }

    el.style.transformOrigin = "top left";
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    if (fade) {
      el.style.opacity = first.width < 2 ? "0.35" : "1";
    }
  }

  // force style flush, then play home
  void document.body.offsetHeight;

  for (const el of nodes()) {
    if (!el.style.transform) continue;
    el.classList.add("is-flipping");
    const anim = el.animate(
      [
        { transform: el.style.transform, opacity: el.style.opacity || 1 },
        { transform: "none", opacity: 1 },
      ],
      {
        duration,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      }
    );
    anims.push(anim);
  }

  return Promise.allSettled(anims.map((a) => a.finished)).then(() => {
    for (const el of nodes()) {
      el.style.transform = "";
      el.style.opacity = "";
      el.style.transformOrigin = "";
      el.classList.remove("is-flipping");
    }
  });
}

/** Soft fade-swap for auxiliary panels (nav rails, stages). */
export function recompose(el, cls = "") {
  el.classList.remove("recompose");
  void el.offsetWidth;
  el.classList.add("recompose");
  if (cls) {
    let i = 1;
    for (const child of el.children) {
      child.classList.add("recompose", `recompose-${Math.min(i, 4)}`);
      i += 1;
    }
  }
}
