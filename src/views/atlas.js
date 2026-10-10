// STRUCTURE 2 · ATLAS — a spatial constellation. Relationships are drawn, not listed.
import { h, sectionBlock } from '../dom.js';
import { SECTIONS, SECTION_BY_ID } from '../content.js';

// Hand-placed constellation coordinates in percent of the canvas.
const POS = {
  manifesto: [50, 47],
  work: [22, 24], method: [78, 24], journal: [24, 73], contact: [76, 73],
  'p-lattice': [9, 9], 'p-ghost': [38, 8], 'p-drift': [6, 44],
  'j-1': [10, 90], 'j-2': [42, 90],
};
const EDGES = [
  ['manifesto', 'work'], ['manifesto', 'method'], ['manifesto', 'journal'], ['manifesto', 'contact'],
  ['work', 'p-lattice'], ['work', 'p-ghost'], ['work', 'p-drift'],
  ['journal', 'j-1'], ['journal', 'j-2'],
];
const NODES = SECTIONS.flatMap((s) => [
  { id: s.id, section: s.id, kind: 'section', label: s.label },
  ...(s.items || []).map((i) => ({ id: i.id, section: s.id, kind: 'item', label: i.title })),
]);

export function mount(el, ctx) {
  const wrap = h('div', { class: 'atlas' });
  el.append(wrap);
  render();

  function render() {
    wrap.innerHTML = '';
    const focus = ctx.focus;
    const canvas = h('div', { class: 'atlas-canvas' });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('class', 'atlas-lines');
    for (const [a, b] of EDGES) {
      const [x1, y1] = POS[a], [x2, y2] = POS[b];
      const line = document.createElementNS(svg.namespaceURI, 'line');
      const lit = a === focus || b === focus || SECTION_BY_ID[focus]?.items?.some((i) => i.id === a || i.id === b);
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      line.setAttribute('class', lit ? 'edge is-lit' : 'edge');
      svg.append(line);
    }
    canvas.append(svg);
    for (const n of NODES) {
      const [x, y] = POS[n.id];
      const active = n.id === focus || (n.kind === 'item' && n.section === focus);
      const attrs = {
        class: `node ${n.kind === 'section' ? 'is-hub' : 'is-leaf'}${active ? ' is-active' : ''}`,
        style: { left: `${x}%`, top: `${y}%` },
        type: 'button',
        dataset: n.kind === 'section' ? { goto: n.id, topic: n.section } : { open: n.id, topic: n.section },
      };
      canvas.append(h('button', attrs, h('span', { class: 'node-dot' }), h('span', { class: 'node-label' }, n.label)));
    }
    const panel = h('aside', { class: 'atlas-panel' },
      h('div', { class: 'panel-tag' }, 'Focused region'),
      sectionBlock(SECTION_BY_ID[focus], { compact: true }),
    );
    wrap.append(canvas, panel);
  }

  return {
    sync() { render(); },
    destroy() { el.innerHTML = ''; },
  };
}
