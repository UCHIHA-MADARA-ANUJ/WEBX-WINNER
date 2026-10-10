/**
 * LATTICE — content store
 * The ideas are the constant. Everything else evolves.
 * Each unit: id, title, tags, minutes, summary, body blocks, links.
 * `links` declare semantic kinship — the engine uses them to tell
 * sequential reading from erratic jumping.
 */

export const UNITS = [
  {
    id: "feedback",
    title: "Feedback Is a Verb",
    tags: ["cybernetics", "loops"],
    minutes: 4,
    summary: "Systems do not have feedback. They do feedback — continuously, and the doing changes both the system and what is being fed back.",
    body: [
      { type: "lead", text: "A thermostat is the cliché of cybernetics, and the cliché hides the strangest part: information becomes an actuator. A reading of the world changes the world that will be read next." },
      { type: "p", text: "Negative feedback stabilises; positive feedback amplifies. Neither is good or bad. A microphone howling through a speaker is positive feedback doing exactly what the math promises. A body sweating on a hot day is negative feedback keeping a variable inside a survivable band." },
      { type: "aside", text: "Try this: count how many feedback loops you pass through before lunch. Prices, queues, notifications, glances in a mirror." },
      { type: "p", text: "The moment you design any interface — or any institution — you are laying down loops. The question is never whether there is feedback. It is who gets to feel its consequences, and how fast." }
    ],
    links: ["homeostasis", "fitness", "attention"]
  },
  {
    id: "attention",
    title: "The Shape of Attention",
    tags: ["perception", "design"],
    minutes: 5,
    summary: "Attention is not a spotlight you point. It is a sculptor — and everything it touches keeps the marks.",
    body: [
      { type: "lead", text: "What you look at grows. Not metaphorically: measured populations of neurons, measured minutes of a life, measured columns of a database. Attention is an allocation engine with physical consequences." },
      { type: "p", text: "Designers have always known this, which is why layout is power. The order of a list is an argument. The default option is a law. The item placed at the centre of the orbit gets chosen, and then reinforced, and then it becomes the centre of the next orbit too." },
      { type: "aside", text: "This page is watching where your attention goes — and quietly rearranging itself around it. That is not surveillance. It is the subject matter." },
      { type: "p", text: "A humane system spends attention the way a good host spends your time: generously at the entrance, invisibly in service, and never asking twice for the same thing." }
    ],
    links: ["maps", "feedback", "exaptation"]
  },
  {
    id: "morphogenesis",
    title: "How Form Happens",
    tags: ["growth", "form"],
    minutes: 6,
    summary: "Nobody draws a shell. A shell is what happens when a simple rule refuses to stop.",
    body: [
      { type: "lead", text: "Turing's last paper asked how a blank sheet of tissue becomes a spotted animal. His answer: two chemicals, one activating and one inhibiting, diffusing at different rates. Form is a verb too." },
      { type: "p", text: "Morphogenesis teaches a lesson that software keeps forgetting: structure should be grown, not mandated. The genome does not carry a blueprint of the brain; it carries a recipe for folding one. Local rules, repeated relentlessly, produce global anatomy." },
      { type: "p", text: "Every interface you build could be a blueprint or a recipe. Blueprints break when the world shifts. Recipes are small, composable, and — crucially — able to reorganise themselves around whoever is cooking." },
      { type: "aside", text: "Ask of any system: where is the growth rule, and what does it do when the nutrients change?" }
    ],
    links: ["stigmergy", "swarm", "renewal"]
  },
  {
    id: "homeostasis",
    title: "Homeostasis & Drift",
    tags: ["stability", "change"],
    minutes: 4,
    summary: "The art of staying yourself while changing completely — and knowing when the balance point must move.",
    body: [
      { type: "lead", text: "Your body temperature is a lie told with great precision: 37°C is not a fact, it is a fight, won every second of your life so far." },
      { type: "p", text: "Homeostasis is stability with an engine running. Variables are held near setpoints by loops that never rest. But setpoints themselves must sometimes move — puberty, altitude, grief. Allostasis is the word: stability through change." },
      { type: "aside", text: "Interfaces have setpoints too: the default layout, the default order, the default you. The question is whether they can adapt — and how they decide to." },
      { type: "p", text: "A system that can only hold its setpoints is brittle. A system that lets them wander is lost. The living ones learn to distinguish weather from climate — noise from a genuine new terrain." }
    ],
    links: ["feedback", "fitness", "renewal"]
  },
  {
    id: "swarm",
    title: "Swarm Logic",
    tags: ["emergence", "collective"],
    minutes: 5,
    summary: "No leader, no plan, no blueprint — and yet the flock turns as if it were a single mind.",
    body: [
      { type: "lead", text: "A murmuration of starlings follows three rules: match the neighbours' speed, keep close, do not collide. Out of these, a shape-shifting silver cloud in the evening sky." },
      { type: "p", text: "Emergence is the universe's favourite trick: global behaviour arising from local rules that contain no hint of it. Ants find shortest paths by stigmergic scent. Markets price a million goods without a pricer. Sand piles find their angle of repose." },
      { type: "p", text: "The temptation is to reach for a conductor. But centrally commanded complexity collapses at scale; it cannot sense what its edges sense. The art of designing collectives is choosing local rules whose global consequences you can live with." },
      { type: "aside", text: "You are part of a swarm right now — every visitor to this site nudges its evolution. Your traces are the pheromones." }
    ],
    links: ["stigmergy", "morphogenesis", "maps"]
  },
  {
    id: "maps",
    title: "The Map Is Not the Territory",
    tags: ["representation", "models"],
    minutes: 4,
    summary: "Every model leaves things out on purpose. The art is in what you choose to lose.",
    body: [
      { type: "lead", text: "Korzybski's dictum has become wallpaper. Take it seriously for one minute and it detonates: the menu is not the meal, the dashboard is not the server, the persona is not the person." },
      { type: "p", text: "A useful map is aggressively lossy. The London Tube map is a masterpiece precisely because it lies about distance and tells the truth about connection. Every interface is such a compromise — a projection of a richer space onto what a human can hold in a glance." },
      { type: "aside", text: "The genome panel you can open on this page is a map of you. It is lossy. It is honest about being lossy." },
      { type: "p", text: "When a map gets mistaken for the territory, the territory eventually gets reshaped to match the map. Watch for it in bureaucracy, in metrics, in road networks shaped by old maps of trade." }
    ],
    links: ["attention", "fitness", "feedback"]
  },
  {
    id: "stigmergy",
    title: "Stigmergy",
    tags: ["collective", "traces"],
    minutes: 5,
    summary: "Coordination without conversation — leaving marks in the world that make the next action easier.",
    body: [
      { type: "lead", text: "Termites do not discuss cathedrals. Each one deposits a pellet of mud scented with a pheromone, and the scent says where the next pellet should go. The half-built nest is the message board." },
      { type: "p", text: "Grassé named it stigmergy: work that stimulates more work. Wikis do it. Git does it. Desire paths do it — the trail worn into the lawn is an instruction from past walkers to future ones, negotiated without a meeting." },
      { type: "p", text: "Digital systems are stigmergic machines and rarely admit it. Every click you make here is a pellet of scented mud. The interface reads the traces and lays its own next pellet where you are most likely to step." },
      { type: "aside", text: "The best coordination happens when the traces are legible and the conversation is unnecessary." }
    ],
    links: ["swarm", "morphogenesis", "renewal"]
  },
  {
    id: "fitness",
    title: "Fitness Landscapes",
    tags: ["adaptation", "evolution"],
    minutes: 6,
    summary: "Evolution wanders a terrain of possibility uphill in the dark — and the terrain itself keeps moving.",
    body: [
      { type: "lead", text: "Sewall Wright drew adaptation as a landscape: peaks of fitness, valleys of failure, populations crawling upward by variation and selection. The picture is simple. The implications are vertigo." },
      { type: "p", text: "Local peaks are traps. Climb to the top of one and every step down looks like damage — even when a far higher peak sits across the valley. Sometimes evolution must get worse to get better; sex, death, and drift are all ways of paying that toll." },
      { type: "p", text: "And the landscape is not fixed. Every adaptation by an organism changes the terrain for its neighbours. This is the Red Queen: run as fast as you can to stay where you are. Interactive design is exactly this — a landscape co-shaped by the people moving through it." },
      { type: "aside", text: "The engine behind this page is a little evolutionary system: traits, fitnesses, selection pressure, and occasional deliberate mutation." }
    ],
    links: ["exaptation", "homeostasis", "renewal"]
  },
  {
    id: "exaptation",
    title: "Exaptation",
    tags: ["evolution", "repurposing"],
    minutes: 4,
    summary: "Feathers were for warmth before they were for flight. Structures get recruited for jobs they were never designed to do.",
    body: [
      { type: "lead", text: "Gould and Vrba gave a name to one of evolution's quietest jokes: exaptation — a feature forged by one pressure, later commandeered by another. The swim bladder of a fish becomes the lung of everything that walks." },
      { type: "p", text: "Invention works the same way. The printing press was a wine screw's cousin. The internet was for surviving a nuclear command structure. Success is often a second career for a mechanism built for something else." },
      { type: "aside", text: "Nav bars, tabs, cards, swipes — every interface gesture is an exaptation of a physical one. Stacks of paper, docket trays, pushpins." },
      { type: "p", text: "Designers who ship 'finished' structures deny themselves second careers. The wise ones build looser parts — affordances wide enough to be misunderstood productively." }
    ],
    links: ["fitness", "attention", "morphogenesis"]
  },
  {
    id: "renewal",
    title: "Death & Renewal",
    tags: ["cycles", "change"],
    minutes: 4,
    summary: "A system that cannot dismantle anything will be dismantled. Renewal is a feature, not an apology.",
    body: [
      { type: "lead", text: "Apoptosis is programmed cell death: your body has a demolition crew that dismantles your fingers' webbing so you can have fingers. Suicide at the cellular level, written into the plan from the start." },
      { type: "p", text: "Forests need fire. Jungles need falls. Any ecosystem of ideas needs a way to retire old ones, or the new ones never get light. Hoarding structure is how systems die of their own success — clutter, then confusion, then irrelevance." },
      { type: "p", text: "So this interface lets go. It unpins what you ignore, demotes what you skip, and on your next visit it will mutate the parts of itself that failed you. What survives is what fits — and even that is provisional." },
      { type: "aside", text: "Nothing on this page is permanent except the ideas. The structure you are using now will not be here tomorrow." }
    ],
    links: ["morphogenesis", "fitness", "feedback"]
  }
];

/** Unit lookup + declared sequential order (the engine learns its own order). */
export const UNIT_MAP = new Map(UNITS.map((u) => [u.id, u]));
export const UNIT_IDS = UNITS.map((u) => u.id);

/** All tags, sorted by frequency, for legend/cluster UIs. */
export const TAGS = (() => {
  const counts = new Map();
  for (const u of UNITS) for (const t of u.tags) counts.set(t, (counts.get(t) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
})();

/** Deterministic pseudo-random in [0,1) from a string — stable layouts. */
export function hash01(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Semantic distance between two units: 0 = same idea-space, 1 = strangers.
 * Combines tag overlap with declared links.
 */
export function semanticDistance(aId, bId) {
  const a = UNIT_MAP.get(aId);
  const b = UNIT_MAP.get(bId);
  if (!a || !b) return 1;
  if (a.links.includes(bId) || b.links.includes(aId)) return 0.18;
  const shared = a.tags.filter((t) => b.tags.includes(t)).length;
  return Math.max(0.28, 1 - shared * 0.38);
}

/** Fuzzy title/summary search used by jump + command surfaces. */
export function searchUnits(query, affinity = new Map()) {
  const q = query.trim().toLowerCase();
  const scored = UNITS.map((u) => {
    let score = 0;
    const title = u.title.toLowerCase();
    const hay = `${title} ${u.summary.toLowerCase()} ${u.tags.join(" ")}`;
    if (!q) score = 0.4;
    else if (title.startsWith(q)) score += 3;
    else if (title.includes(q)) score += 2;
    else if (hay.includes(q)) score += 1;
    for (const w of q.split(/\s+/)) {
      if (w && hay.includes(w)) score += 0.5;
    }
    const aff = affinity.get(u.id) || 0;
    score += aff * 1.4;
    return { unit: u, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.unit);
}
