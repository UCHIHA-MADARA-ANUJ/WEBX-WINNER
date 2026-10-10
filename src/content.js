// One content model, shared by every structural paradigm. Only the
// arrangement changes between modes, never the facts or the reachability.

export const SECTIONS = [
  {
    id: 'manifesto',
    label: 'Manifesto',
    kicker: '01 · Premise',
    title: 'A website that is still deciding what it is.',
    lede: 'Most sites hand every visitor the same map. This one redraws the map around the person holding it.',
    body: [
      'Navigation, hierarchy, and available actions are not fixed here. The layout is a hypothesis that gets tested against your behaviour: how you read, how fast you scroll, what you return to, and what you type.',
      'Every structure on this site presents the same five sections and the same entries. Nothing is hidden, nothing is lost, and you can always move to any section from the header. The rules of the building change; the rooms do not.',
    ],
  },
  {
    id: 'work',
    label: 'Work',
    kicker: '02 · Work',
    title: 'Selected experiments',
    lede: 'Three prototypes that explore interfaces which change shape.',
    body: ['Each experiment is a different answer to the same question: what should a page become once it knows how you read it?'],
    items: [
      {
        id: 'p-lattice',
        title: 'Lattice Layout',
        meta: '2026 · layout solver',
        blurb: 'A constraint solver that arranges content into the shape your reading pattern prefers.',
        body: [
          'Lattice treats the page as a graph of sections with weighted edges. Edge weights grow with each transition you make, so the layout tightens around the paths you actually walk.',
          'The result is a page whose geometry is a record of your habits.',
        ],
      },
      {
        id: 'p-ghost',
        title: 'Ghost Navigation',
        meta: '2025 · interaction study',
        blurb: 'Menus that surface only where your hesitation points, and dissolve once you commit.',
        body: [
          'Ghost Navigation measures pauses over an element without a click. A pause longer than a second is treated as a question, and the answer appears beside the hesitation.',
          'Commit to a path and the scaffolding fades back out.',
        ],
      },
      {
        id: 'p-drift',
        title: 'Drift Index',
        meta: '2026 · live instrument',
        blurb: 'A readout of how one page diverges across visitors, shown as a set of structural states.',
        body: [
          'Drift Index compares the structural state reached by different visitors and reports how far apart they have drifted.',
          'It makes the invisible claim visible: two people, one address, two different websites.',
        ],
      },
    ],
  },
  {
    id: 'method',
    label: 'Method',
    kicker: '03 · Method',
    title: 'How the Evolution Engine decides',
    lede: 'Five signals, one decision, no personal data leaves your browser.',
    body: [
      'The engine keeps a sliding window of your last 120 interactions in local storage. It is recency-weighted, so it forgets old habits as new ones form. Scores decide the structure; a margin and a cooldown stop it from flickering.',
    ],
    steps: [
      { title: 'Sequence', text: 'Do you move in order, or jump? Share of sequential moves versus backtracks and skips.' },
      { title: 'Pace', text: 'How quickly you scroll (px/s) and how long you dwell on each section.' },
      { title: 'Interest', text: 'Which topic draws your clicks, and how concentrated that attention is.' },
      { title: 'Hesitation', text: 'Pauses over an entry without committing. Lingering is a signal too.' },
      { title: 'Command', text: 'Whether you reach for the shell and typed commands instead of pointing.' },
    ],
  },
  {
    id: 'journal',
    label: 'Journal',
    kicker: '04 · Journal',
    title: 'Field notes',
    lede: 'Short entries on building interfaces that the visitor, not the designer, decides.',
    body: ['New entries appear as the lab learns more. Older ones stay exactly where you left them.'],
    items: [
      {
        id: 'j-1',
        title: 'Why fixed navigation is a habit, not a law',
        meta: '14 Aug 2026 · essay',
        blurb: 'The header bar is one of a hundred possible answers. Most sites never ask whether it fits.',
        body: [
          'A fixed header is cheap to build and easy to learn, which is why it survived. It is a sensible default, not a conclusion.',
          'The question worth asking is what the header would look like if it were rebuilt for each visitor.',
        ],
      },
      {
        id: 'j-2',
        title: 'Measuring hesitation without tracking anyone',
        meta: '30 Sep 2026 · note',
        blurb: 'Every signal in this engine stays on the device. The profile is a small JSON document you can reset at any time.',
        body: [
          'The Observer panel shows every metric and every score the engine uses. If you can read it, you can audit it.',
          'Reset the memory and the interface starts again from its first structure.',
        ],
      },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    kicker: '05 · Contact',
    title: 'Open a channel',
    lede: 'The lab is small and answers in person-sized batches.',
    body: [
      'Type `contact` in the terminal, or press / anywhere to open the command palette. Ideas, critiques, and strange requests all welcome.',
      'Try switching structures on purpose: pick a mode in the dock, then use the Observer to see how the engine responds.',
    ],
  },
];

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

/** Find any navigable node (section or entry) and the section it belongs to. */
export function findNode(id) {
  const section = SECTION_BY_ID[id];
  if (section) return { node: section, section, kind: 'section' };
  for (const s of SECTIONS) {
    const item = (s.items || []).find((i) => i.id === id);
    if (item) return { node: item, section: s, kind: 'item' };
  }
  return null;
}
