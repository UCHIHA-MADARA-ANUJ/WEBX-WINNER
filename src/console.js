// A reusable command console: used as the Terminal structure and in the palette.
import { h } from './dom.js';
import { run } from './commands.js';

export function createConsole(root, ctx, { banner = [], compact = false } = {}) {
  const log = h('div', { class: 'con-log', role: 'log', 'aria-live': 'polite' });
  const input = h('input', { class: 'con-input', type: 'text', autocomplete: 'off', spellcheck: 'false', placeholder: 'type "help"', 'aria-label': 'Command' });
  const form = h('form', { class: 'con-form' }, h('span', { class: 'con-prompt' }, 'webx ~ $'), input);
  const history = [];
  let hIdx = -1;

  const print = (items) => {
    for (const it of items) log.append(h('div', { class: `con-line ${it.cls || ''}` }, it.text));
    log.scrollTop = log.scrollHeight;
  };

  const exec = (text) => {
    if (text.trim()) history.unshift(text);
    hIdx = -1;
    log.append(h('div', { class: 'con-line con-echo' }, `webx ~ $ ${text}`));
    ctx.emit({ t: 'cmd', cmd: text.trim().split(/\s+/)[0] || '' });
    const res = run(text, ctx);
    if (res.clear) log.innerHTML = '';
    else print(res.lines);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = '';
    exec(v);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && history.length) {
      hIdx = Math.min(hIdx + 1, history.length - 1);
      input.value = history[hIdx];
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      hIdx = Math.max(hIdx - 1, -1);
      input.value = hIdx >= 0 ? history[hIdx] : '';
      e.preventDefault();
    }
  });

  root.append(h('div', { class: `console${compact ? ' is-compact' : ''}` }, log, form));
  print(banner);
  return { focus: () => input.focus(), exec, print };
}
