// STRUCTURE 3 · TERMINAL — the site is a shell. Every page is a command away.
import { createConsole } from '../console.js';
import { h } from '../dom.js';

export function mount(el, ctx) {
  const wrap = h('div', { class: 'terminal-view' },
    h('div', { class: 'panel-tag' }, 'Terminal structure · type "help" to begin'),
  );
  el.append(wrap);
  const con = createConsole(wrap, ctx, {
    banner: [
      { text: 'WEBX Evolution Shell v1.0 — every section is reachable from here.', cls: 'hi' },
      { text: 'Try: ls · cat work · open p-lattice · goto method · whoami · mode atlas', cls: 'dim' },
    ],
  });
  return {
    // Navigation from elsewhere must not wipe the scrollback of a live shell.
    sync() {},
    destroy() { el.innerHTML = ''; },
    focus: con.focus,
  };
}
