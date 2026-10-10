/**
 * REVEALS — scroll choreography
 * Nothing just "appears". Elements arrive: up, soft, in rhythm.
 * One-shot per element: a card that has arrived never re-hides —
 * structure may morph, but the page must never twitch.
 */

export function observeReveals(root = document) {
  const els = [...root.querySelectorAll("[data-reveal]")];
  if (!els.length) return;

  // graceful degradation: no IO → everything is simply present
  if (typeof IntersectionObserver === "undefined") {
    for (const el of els) {
      el.dataset.revealed = "1";
      el.classList.add("is-in");
    }
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.dataset.revealed = "1";
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
  );

  for (const el of els) {
    if (el.dataset.revealed === "1") {
      el.classList.add("is-in");
      continue;
    }
    if (!el.style.getPropertyValue("--reveal-delay")) {
      el.style.setProperty("--reveal-delay", `${Math.floor(Math.random() * 5) * 70}ms`);
    }
    io.observe(el);
  }
}
