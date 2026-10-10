// The command grammar shared by the Terminal structure and the palette.
import { SECTIONS, SECTION_BY_ID, findNode } from './content.js';

const HELP = [
  'ls                    list sections and entries',
  'cat <name>            read a section or entry',
  'open <id>             open an entry in a window',
  'goto <section>        move focus to a section',
  'mode <name>           rebuild the interface: chronicle | atlas | terminal | index | deck',
  'whoami                what the engine has learned about you',
  'contact               how to reach the lab',
  'clear                 clear the output',
];

const plain = (text, cls = '') => ({ text, cls });
const lines = (arr, cls = '') => arr.map((t) => plain(t, cls));

/** Resolve a user-typed name (section label, id, or entry id/title fragment). */
function resolve(name) {
  if (!name) return null;
  const n = name.toLowerCase().trim();
  const sec = SECTIONS.find((s) => s.id === n || s.label.toLowerCase() === n);
  if (sec) return { node: sec, section: sec, kind: 'section' };
  const direct = findNode(n);
  if (direct) return direct;
  for (const s of SECTIONS) {
    const item = (s.items || []).find((i) => i.title.toLowerCase().includes(n));
    if (item) return { node: item, section: s, kind: 'item' };
  }
  return null;
}

/**
 * Run one command. `ctx` provides: goto, openNode, setMode, describe, focus, emit.
 * Returns { lines: [{text, cls}], clear?: boolean }.
 */
export function run(input, ctx) {
  const [cmdRaw = '', ...rest] = input.trim().split(/\s+/);
  const cmd = cmdRaw.toLowerCase();
  const arg = rest.join(' ');
  switch (cmd) {
    case '': return { lines: [] };
    case 'help': return { lines: lines(HELP) };
    case 'ls':
      return {
        lines: SECTIONS.flatMap((s) => [
          plain(`${s.id.padEnd(10)} ${s.title}`, 'hi'),
          ...(s.items || []).map((i) => plain(`  └ ${i.id.padEnd(9)} ${i.title}`, 'dim')),
        ]),
      };
    case 'cat': {
      const hit = resolve(arg);
      if (!hit) return { lines: lines([`cat: ${arg || '(nothing)'}: no such section or entry`], 'err') };
      const out = [plain(hit.node.title, 'hi')];
      if (hit.node.lede) out.push(plain(hit.node.lede, 'dim'));
      out.push(...hit.node.body.map((t) => plain(t)));
      if (hit.node.steps) out.push(...hit.node.steps.map((s) => plain(`  • ${s.title}: ${s.text}`)));
      if (hit.node.items) out.push(...hit.node.items.map((i) => plain(`  └ ${i.id}  ${i.title}`, 'dim')));
      return { lines: out };
    }
    case 'open': {
      const hit = resolve(arg);
      if (!hit) return { lines: lines([`open: ${arg || '(nothing)'}: not found`], 'err') };
      ctx.openNode(hit.node.id);
      return { lines: lines([`opened ${hit.node.title}`], 'ok') };
    }
    case 'goto': {
      const hit = resolve(arg);
      if (!hit || hit.kind !== 'section') return { lines: lines([`goto: "${arg}" is not a section`], 'err') };
      ctx.goto(hit.section.id, 'cmd');
      return { lines: lines([`focus → ${hit.section.label}`], 'ok') };
    }
    case 'mode': {
      const target = arg.toLowerCase();
      if (!ctx.modes.includes(target)) return { lines: lines([`mode: unknown structure "${arg}"`, `available: ${ctx.modes.join(', ')}`], 'err') };
      ctx.setMode(target, { manual: true });
      return { lines: lines([`rebuilding as ${target}… auto-evolve paused (re-enable in the dock)`], 'ok') };
    }
    case 'whoami': return { lines: ctx.describe() };
    case 'contact': return { lines: lines([SECTION_BY_ID.contact.body[0]]) };
    case 'clear': return { lines: [], clear: true };
    default: return { lines: lines([`${cmd}: command not found. Try "help".`], 'err') };
  }
}
