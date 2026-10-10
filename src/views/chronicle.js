// STRUCTURE 1 · CHRONICLE — a linear editorial scroll. Reading order is the map.
import { h, sectionBlock } from '../dom.js';
import { SECTIONS } from '../content.js';
import { mountHero } from '../hero.js';

export function mount(el, ctx) {
  const canvas = h('canvas', { class: 'hero-canvas', 'aria-hidden': 'true' });
  const readout = h('div', { class: 'hero-readout', 'aria-hidden': 'true' });
  const hero = h('section', { class: 'hero' },
    canvas,
    h('div', { class: 'hud', 'aria-hidden': 'true' },
      h('div', { class: 'hud-row' },
        h('span', {}, 'SYS.', h('span', { class: 'live' }, ' OPERATIONAL')),
        h('span', { class: 'hide-sm' }, 'LAT 28.6139° N'),
      ),
      h('div', { class: 'hud-row' },
        h('span', { class: 'hide-sm' }, 'LON 77.2090° E · DELHI'),
        h('span', { class: 'shock' }, 'ENGINE: LEARNING'),
      ),
    ),
    h('div', { class: 'hero-copy' },
      h('div', { class: 'kicker' }, 'WEBX · the evolution engine'),
      h('h1', {}, 'Two visitors.', h('br'), h('em', {}, 'Two websites.')),
      h('p', { class: 'hero-sub' }, 'This page is rebuilt around how you move. Read, jump, skim, or type — the engine is watching and will change shape.'),
      h('div', { class: 'hero-cue' }, 'scroll to begin ↓'),
    ),
    readout,
  );
  const wrap = h('div', { class: 'chronicle' }, SECTIONS.map((s, i) => {
    const block = sectionBlock(s);
    block.dataset.num = String(i + 1).padStart(2, '0');
    block.querySelectorAll(':scope > header, :scope > p, :scope > ol, :scope > .cards').forEach((n) => n.classList.add('reveal'));
    return block;
  }));
  el.append(hero, wrap);
  const field = mountHero(canvas, { getSpeed: () => ctx.signal().speed });
  const tick = setInterval(() => {
    const s = ctx.signal();
    readout.textContent = `PACE ${Math.round(s.speed)} PX/S   ·   MOVES ${s.navs}   ·   STRUCTURE ${s.mode.toUpperCase()}   ·   GEN ${s.generation}`;
  }, 250);

  // Reading progress is observed, not declared: whichever section crosses the
  // middle band of the viewport becomes the focus (a "scroll" navigation).
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) ctx.goto(en.target.dataset.section, 'scroll');
  }, { rootMargin: '-40% 0px -55% 0px' });
  wrap.querySelectorAll('.sec').forEach((s) => io.observe(s));
  // scroll-triggered reveal, separate from focus tracking
  const reveal = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('is-in'); reveal.unobserve(en.target); }
  }, { rootMargin: '0px 0px -12% 0px' });
  wrap.querySelectorAll('.sec').forEach((s) => reveal.observe(s));

  return {
    sync(id) {
      wrap.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    destroy() { clearInterval(tick); field.destroy(); io.disconnect(); reveal.disconnect(); el.innerHTML = ''; },
  };
}
