// The boot sequence: a dead-quiet black screen, a terminal that diagnoses the
// static web, then the wave field "initialises". Skippable at any point.
import { h } from './dom.js';
import { mountHero } from './hero.js';

const LINES = [
  ['> Scanning the open web…', 'dim', 300],
  ['> TARGET: static-website.exe', 'hi', 1100],
  ['> STATUS: fixed layout detected. Fixed layouts ignore people. ENFORCING CHANGE.', 'shock', 2100],
  ['> Behaviour model: EMPTY. Learning starts on first contact.', 'dim', 3300],
  ['> Structures loaded: chronicle · atlas · terminal · index · deck', 'dim', 4300],
  ['> Structure selected: CHRONICLE. It will not stay that way for long.', 'hi', 5300],
  ['> True connection: ESTABLISHED.', 'reso', 6200],
];
const FINISH_AT = 6800;

export function runIntro(root, { onDone = () => {} } = {}) {
  const term = root.querySelector('.intro-term');
  const btn = root.querySelector('.intro-enter');
  const canvas = root.querySelector('canvas');
  const hero = mountHero(canvas, { interactive: false });
  const timers = [];
  let finished = false;
  let exited = false;

  const line = ([text, cls]) => term.append(h('div', { class: `intro-line ${cls}` }, text));

  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    term.innerHTML = '';
    LINES.forEach(line);
    btn.hidden = false;
    btn.focus({ preventScroll: true });
  }

  function exit() {
    if (exited) return;
    exited = true;
    timers.forEach(clearTimeout);
    root.classList.add('is-leaving');
    setTimeout(() => { hero.destroy(); root.remove(); onDone(); }, 950);
  }

  LINES.forEach((l) => timers.push(setTimeout(() => line(l), l[2])));
  timers.push(setTimeout(finish, FINISH_AT));

  root.addEventListener('click', (e) => {
    if (e.target === btn) return exit();
    finish();
  });
  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (finished) { window.removeEventListener('keydown', onKey); exit(); } else finish();
    }
  };
  window.addEventListener('keydown', onKey);
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) finish();
  return { finish, exit };
}
