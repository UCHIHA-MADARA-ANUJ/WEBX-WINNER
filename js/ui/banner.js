/**
 * THE BANNER — every restructure explained in plain English
 * Drama, but never mystery. The golden rule: intelligence, not chaos.
 */

export function showBanner({ kicker, headline, sub, glyph = "✦" }, host) {
  const old = host.querySelector(".banner");
  if (old) old.remove();

  const el = document.createElement("div");
  el.className = "banner";
  el.setAttribute("role", "status");
  el.innerHTML = `
    <div class="banner__glyph">${glyph}</div>
    <div class="banner__text">
      <div class="banner__kicker">${kicker}</div>
      <div class="banner__headline"><span class="banner__type"></span><span class="banner__caret"></span></div>
      ${sub ? `<div class="banner__sub">${sub}</div>` : ""}
    </div>
    <div class="banner__wave" aria-hidden="true"></div>
  `;
  host.appendChild(el);

  // the headline types itself in — drama, not mystery
  const target = el.querySelector(".banner__type");
  const caret = el.querySelector(".banner__caret");
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  if (reduced) {
    target.textContent = headline;
    caret.remove();
  } else {
    let i = 0;
    const tick = () => {
      i += 1;
      target.textContent = headline.slice(0, i);
      if (i < headline.length) setTimeout(tick, 12);
      else caret.remove();
    };
    tick();
  }

  setTimeout(() => {
    el.classList.add("is-out");
    setTimeout(() => el.remove(), 500);
  }, 5600);
  return el;
}
