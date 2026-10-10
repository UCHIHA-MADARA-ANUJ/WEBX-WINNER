// STRUCTURE 5 · DECK — one section held in focus at a time. For deep readers.
import { h, sectionBlock } from '../dom.js';
import { SECTIONS, SECTION_BY_ID } from '../content.js';

export function mount(el, ctx) {
  const wrap = h('div', { class: 'deck' });
  el.append(wrap);
  render();

  function render() {
    wrap.innerHTML = '';
    const i = SECTIONS.findIndex((s) => s.id === ctx.focus);
    const cur = SECTION_BY_ID[ctx.focus];
    const dots = h('nav', { class: 'deck-dots', 'aria-label': 'Sections' }, SECTIONS.map((s, k) =>
      h('button', {
        type: 'button', class: `dot${k === i ? ' is-on' : ''}`, dataset: { goto: s.id, topic: s.id },
        'aria-label': s.label, title: s.label,
      }, h('span', {}, s.label))));
    const card = h('article', { class: 'deck-card', 'aria-live': 'polite' }, sectionBlock(cur));
    const prev = h('button', { type: 'button', class: 'deck-step', dataset: { step: -1 }, disabled: i <= 0 }, '← Previous');
    const next = h('button', { type: 'button', class: 'deck-step', dataset: { step: 1 }, disabled: i >= SECTIONS.length - 1 }, 'Next →');
    wrap.append(dots, card, h('div', { class: 'deck-foot' }, prev, h('span', { class: 'dim' }, `${i + 1} / ${SECTIONS.length}`), next));
    card.scrollTop = 0;
  }

  return { sync() { render(); }, destroy() { el.innerHTML = ''; } };
}
