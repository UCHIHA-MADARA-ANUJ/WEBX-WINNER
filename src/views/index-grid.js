// STRUCTURE 4 · INDEX — a dense, filterable catalogue for people who skim.
import { h } from '../dom.js';
import { SECTIONS, SECTION_BY_ID } from '../content.js';
import { entryCard } from '../dom.js';

export function mount(el, ctx) {
  let filter = 'all';
  const wrap = h('div', { class: 'index-view' });
  el.append(wrap);

  function render() {
    wrap.innerHTML = '';
    const total = SECTIONS.length + SECTIONS.reduce((n, s) => n + (s.items?.length || 0), 0);
    const chips = h('div', { class: 'chips' }, ['all', ...SECTIONS.map((s) => s.id)].map((id) =>
      h('button', {
        type: 'button', class: `chip${filter === id ? ' is-on' : ''}`,
        onclick: () => { filter = id; render(); },
      }, id === 'all' ? 'All' : SECTION_BY_ID[id].label)));
    const cards = [];
    for (const s of SECTIONS) {
      if (filter !== 'all' && filter !== s.id) continue;
      cards.push(h('button', { class: 'card card-section', type: 'button', dataset: { open: s.id, topic: s.id } },
        h('span', { class: 'meta' }, s.kicker),
        h('span', { class: 'card-title' }, s.title),
        h('span', { class: 'card-blurb' }, s.lede || s.body[0])));
      for (const it of s.items || []) cards.push(entryCard(it, s));
    }
    wrap.append(
      h('div', { class: 'index-head' },
        h('div', { class: 'panel-tag' }, 'Index structure'),
        h('p', { class: 'dim' }, `${total} entries, one tap each. Filter by section, or open anything in a window.`),
        chips),
      h('div', { class: 'index-grid' }, cards),
    );
  }
  render();
  return { sync() {}, destroy() { el.innerHTML = ''; } };
}
