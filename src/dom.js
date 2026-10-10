// Tiny DOM helpers. No framework, no build step.
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

/** A section as a reader sees it: heading, prose, steps, and entry cards. */
export function sectionBlock(section, { compact = false } = {}) {
  return h('section', { class: `sec${compact ? ' is-compact' : ''}`, id: `sec-${section.id}`, dataset: { section: section.id } },
    h('header', { class: 'sec-head' },
      h('div', { class: 'kicker' }, section.kicker),
      h('h2', {}, section.title),
      section.lede ? h('p', { class: 'lede' }, section.lede) : null,
    ),
    section.body.map((t) => h('p', {}, t)),
    section.steps ? h('ol', { class: 'steps' },
      section.steps.map((st) => h('li', { dataset: { topic: section.id } }, h('strong', {}, st.title), ' ', st.text))) : null,
    section.items ? h('div', { class: 'cards' }, section.items.map((it) => entryCard(it, section))) : null,
  );
}

export function entryCard(item, section) {
  return h('button', { class: 'card', type: 'button', dataset: { open: item.id, topic: section.id } },
    h('span', { class: 'meta' }, item.meta),
    h('span', { class: 'card-title' }, item.title),
    h('span', { class: 'card-blurb' }, item.blurb),
  );
}
