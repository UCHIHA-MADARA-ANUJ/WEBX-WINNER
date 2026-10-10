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
      <div class="banner__headline">${headline}</div>
      ${sub ? `<div class="banner__sub">${sub}</div>` : ""}
    </div>
    <div class="banner__wave" aria-hidden="true"></div>
  `;
  host.appendChild(el);
  setTimeout(() => {
    el.classList.add("is-out");
    setTimeout(() => el.remove(), 500);
  }, 5000);
  return el;
}
