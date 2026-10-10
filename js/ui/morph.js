/**
 * THE MORPH — FLIP structural morphing (the money shot)
 * Cards keep their DOM identity while their positions, sizes and
 * parents change underneath them — one organism rearranging its body.
 * Staggered springs + a crimson glow flash = cinema.
 */

const prefersReduced = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export function flipMorph(mutate, { duration = 700, fade = true, stagger = 45 } = {}) {
  const nodes = () => [...document.querySelectorAll("[data-flip]")];

  if (prefersReduced()) {
    mutate();
    return Promise.resolve();
  }

  const firstRects = new Map();
  for (const el of nodes()) firstRects.set(el, el.getBoundingClientRect());

  mutate();

  const anims = [];
  let i = 0;
  for (const el of nodes()) {
    const first = firstRects.get(el);
    const last = el.getBoundingClientRect();
    if (!first || last.width === 0) continue;

    const dx = first.left - last.left;
    const dy = first.top - last.top;
    const sx = first.width / Math.max(1, last.width);
    const sy = first.height / Math.max(1, last.height);
    const near = Math.abs(dx) < 2 && Math.abs(dy) < 2 && Math.abs(sx - 1) < 0.02 && Math.abs(sy - 1) < 0.02;
    if (near) continue;

    el.style.transformOrigin = "top left";
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    if (fade) el.style.opacity = first.width < 2 ? "0.4" : "1";
    i += 1;
  }

  void document.body.offsetHeight;

  let idx = 0;
  for (const el of nodes()) {
    if (!el.style.transform) continue;
    el.classList.add("is-flipping", "is-morph-flash");
    const anim = el.animate(
      [
        { transform: el.style.transform, opacity: el.style.opacity || 1 },
        { transform: "none", opacity: 1 },
      ],
      {
        duration,
        delay: idx * stagger,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)", // springy settle
        fill: "forwards",
      }
    );
    anims.push(anim);
    idx += 1;
  }

  return Promise.allSettled(anims.map((a) => a.finished)).then(() => {
    for (const el of nodes()) {
      el.style.transform = "";
      el.style.opacity = "";
      el.style.transformOrigin = "";
      el.classList.remove("is-flipping", "is-morph-flash");
    }
  });
}

/** Soft cascade for auxiliary panels. */
export function recompose(el) {
  el.classList.remove("recompose");
  void el.offsetWidth;
  el.classList.add("recompose");
  let i = 1;
  for (const child of el.children) {
    child.classList.add("recompose", `recompose-${Math.min(i, 4)}`);
    i += 1;
  }
}
