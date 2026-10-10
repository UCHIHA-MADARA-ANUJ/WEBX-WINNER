// STRUCTURE 1 · CHRONICLE — a linear editorial scroll. Reading order is the map.
import { h, sectionBlock } from '../dom.js';
import { SECTIONS } from '../content.js';

export function mount(el, ctx) {
  const wrap = h('div', { class: 'chronicle' }, SECTIONS.map((s) => sectionBlock(s)));
  el.append(wrap);

  // Reading progress is observed, not declared: whichever section crosses the
  // middle band of the viewport becomes the focus (a "scroll" navigation).
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) ctx.goto(en.target.dataset.section, 'scroll');
  }, { rootMargin: '-40% 0px -55% 0px' });
  wrap.querySelectorAll('.sec').forEach((s) => io.observe(s));

  return {
    sync(id) {
      wrap.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    destroy() { io.disconnect(); el.innerHTML = ''; },
  };
}
