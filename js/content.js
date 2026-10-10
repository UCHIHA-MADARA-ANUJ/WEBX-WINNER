/**
 * ANUJ PHULERA — portfolio content
 * The truth never changes. The shape it's told in always does.
 * Every unit is one card the living interface reorganises.
 */

export const PROFILE = {
  name: "Anuj Phulera",
  role: "Builder · Designer · Full-stack developer",
  place: "Delhi, India",
  creed: "The world you desire is an illusion — wake up to reality.",
  email: "contact@anujphulera.dev", // ← swap in your real email in one line
  github: "https://github.com/UCHIHA-MADARA-ANUJ",
  githubHandle: "UCHIHA-MADARA-ANUJ",
};

export const UNITS = [
  {
    id: "verde",
    kind: "project",
    kicker: "PROJECT · 01",
    title: "Verde",
    subtitle: "Chlorophyll meets silicon",
    tags: ["product", "fullstack", "hardware"],
    stack: "TypeScript · Cloud · IoT",
    image: "assets/verde.jpg",
    href: "https://verde-main-portfolio.vercel.app",
    summary: "An autonomous, cloud-integrated regenerative ecosystem for high-tech vertical farming — food grown by machines that never sleep.",
    body: [
      { type: "lead", text: "Project Verde is a full-stack vision for farming that runs itself: sensor arrays, cloud brain, regenerative ecosystem. The plants get light, water and nutrients on schedule — humans get food." },
      { type: "p", text: "The stack spans TypeScript apps, live dashboards and hardware integrations — the whole pipeline from soil telemetry to the customer-facing surface." },
      { type: "aside", text: "Multiple production apps live under the Verde family: verde-main-portfolio.vercel.app · verde-cbse.vercel.app · verde-cbse-app.vercel.app" },
    ],
    links: ["nirmaan", "skillverse", "skills"],
  },
  {
    id: "resonate",
    kind: "project",
    kicker: "PROJECT · 02",
    title: "RESONATE",
    subtitle: "An algorithmic sanctuary",
    tags: ["design", "web", "experimental"],
    stack: "TypeScript · Cinematic UI",
    image: "assets/resonate.jpg",
    href: "https://resonate-preview.vercel.app",
    summary: "A cinematic dark-themed web platform for algorithmic empathy — where the interface itself is designed to feel you.",
    body: [
      { type: "lead", text: "RESONATE began with a heresy: what if software could sense your state and answer it — not with notifications, but with atmosphere?" },
      { type: "p", text: "Dark, slow, deliberate. Every motion on the platform is choreographed to land emotionally. It is the design piece in the arsenal — proof that engineering and feeling can share a repo." },
      { type: "aside", text: "The DNA of RESONATE lives in this very portfolio: an interface that reshapes itself around the person inside it." },
    ],
    links: ["this-site", "philosophy", "skills"],
  },
  {
    id: "skillverse",
    kind: "project",
    kicker: "PROJECT · 03",
    title: "SkillVerse",
    subtitle: "Skills as a universe",
    tags: ["edtech", "fullstack", "product"],
    stack: "TypeScript · Next · Vercel",
    image: "assets/skillverse.jpg",
    href: "https://skillverse-xi.vercel.app",
    summary: "A learning universe where skills are stars — track them, grow them, watch your constellation expand.",
    body: [
      { type: "lead", text: "SkillVerse treats learning like exploration. Progress is not a progress bar — it is a map filling with light." },
      { type: "p", text: "Built full-stack with live deployment at skillverse-xi.vercel.app, with the S2S companion surface growing beside it." },
    ],
    links: ["nirmaan", "education", "skills"],
  },
  {
    id: "nirmaan",
    kind: "project",
    kicker: "PROJECT · 04",
    title: "Nirmaan",
    subtitle: "Built for someone else",
    tags: ["client", "fullstack", "web"],
    stack: "TypeScript · React · Vercel",
    image: "assets/nirmaan.jpg",
    href: "https://nirmaan-portfolio-main.vercel.app",
    summary: "A commissioned build — a full application and portfolio delivered end-to-end for a real client. Design, code, deploy.",
    body: [
      { type: "lead", text: "Nirmaan means construction. This one was literal: take a client's idea, pour the foundation, raise the structure, hand them the keys." },
      { type: "p", text: "Live at nirmaan-portfolio-main.vercel.app — shipped, maintained, real users." },
    ],
    links: ["verde", "hire", "skills"],
  },
  {
    id: "mun",
    kind: "experience",
    kicker: "EXPERIENCE · 05",
    title: "The MUN Circuit",
    subtitle: "Diplomacy under pressure",
    tags: ["leadership", "speaking", "strategy"],
    stack: "IIT-Delhi MUN · Brahm-Dutt MUN · CCA MUN",
    image: "assets/mun.jpg",
    href: "",
    summary: "Delegate, organiser, strategist — Model United Nations across IIT-Delhi, Brahm-Dutt and CCA. Negotiation as a sport.",
    body: [
      { type: "lead", text: "Crisis committees teach you to think in ten directions while speaking in one. The MUN circuit built the soft architecture behind the hard engineering." },
      { type: "p", text: "Research, rhetoric, resolution-writing, and the art of folding your ego into a clause someone else will sign. MUN-SKILLS packages that toolkit as its own project." },
      { type: "aside", text: "Everything is negotiation — including this website, between you and it." },
    ],
    links: ["about", "philosophy", "hire"],
  },
  {
    id: "this-site",
    kind: "project",
    kicker: "PROJECT · 06",
    title: "This Very Website",
    subtitle: "The impossible interface",
    tags: ["meta", "ai", "experimental"],
    stack: "Vanilla JS · Evolutionary engine · FLIP morphing",
    image: "assets/hero.jpg",
    href: "",
    summary: "The page you are on right now has no fixed layout — it observes your behaviour and physically rebuilds itself around you.",
    body: [
      { type: "lead", text: "Built for the WEBX challenge: a web application with no fixed interface. Navigation, hierarchy and affordances evolve in real time from how you move." },
      { type: "p", text: "A five-trait behavioural genome, six competing structural paradigms, hysteresis-locked selection, and FLIP morphing that carries the same content between different kinds of website. No frameworks. No build step. Pure will." },
      { type: "aside", text: "Two people on this site end up in structurally different websites. Press the BRAIN button to watch it watch you." },
    ],
    links: ["resonate", "philosophy", "skills"],
  },
  {
    id: "about",
    kind: "about",
    kicker: "ABOUT",
    title: "Anuj Phulera",
    subtitle: "Student · builder · menace",
    tags: ["person", "story"],
    stack: "Delhi, India",
    image: "",
    href: "",
    summary: "I build things that feel alive — farming stacks, empathy engines, learning universes, and websites that rearrange themselves around strangers.",
    body: [
      { type: "lead", text: "Half engineer, half designer, fully obsessed with the moment a system starts to feel like it has a pulse." },
      { type: "p", text: "By day I ship TypeScript at scale — apps, dashboards, whole ecosystems like Verde. By night I chase heresies: can software empathise? Can a website think? Why does a portfolio have to be the same website for everyone?" },
      { type: "aside", text: "26 public repos and counting. The best ones are still classified." },
    ],
    links: ["philosophy", "mun", "hire"],
  },
  {
    id: "skills",
    kind: "skills",
    kicker: "SKILLS",
    title: "The Arsenal",
    subtitle: "Weapons of choice",
    tags: ["stack", "tools"],
    stack: "always learning",
    image: "",
    href: "",
    summary: "TypeScript across the stack · React & Next.js · Node & cloud integrations · cinematic UI engineering · rapid prototyping · speaking & strategy.",
    body: [
      { type: "lead", text: "The stack is TypeScript — end to end, apps to hardware bridges. But the real skill is learning a new one at 2am because the project demands it." },
      { type: "p", text: "Frontend: React, Next.js, Vercel, and hand-rolled animation systems (the one you're using). Backend: Node, cloud services, API design, IoT bridges. Process: fast prototypes, faster iteration." },
      { type: "aside", text: "Also: Model UN debate tactics, cricket, and the ability to survive on chai during deployments." },
    ],
    links: ["verde", "this-site", "education"],
  },
  {
    id: "philosophy",
    kind: "creed",
    kicker: "CREED",
    title: "Wake Up To Reality",
    subtitle: "Nothing ever goes as planned",
    tags: ["person", "mindset"],
    stack: "the operating system",
    image: "",
    href: "",
    summary: "The world you desire is an illusion. Build what's real — then build what shouldn't be possible yet.",
    body: [
      { type: "lead", text: "Madara said it best: nothing ever goes as planned in this accursed world. The moment you accept that, you stop wishing and start constructing." },
      { type: "p", text: "This portfolio is a small rebellion against static things. Résumés don't adapt. Websites don't listen. Portfolios lie about being finished. This one is alive, and it will be different tomorrow." },
    ],
    links: ["about", "resonate", "this-site"],
  },
  {
    id: "education",
    kind: "education",
    kicker: "EDUCATION",
    title: "The Training Arc",
    subtitle: "Student · Delhi",
    tags: ["person", "learning"],
    stack: "student · Delhi, India",
    image: "",
    href: "",
    summary: "Self-taught engineer with a school desk and a terminal open at the same time. Formal education by day, real-world builds by deadline.",
    body: [
      { type: "lead", text: "The classroom teaches theory. The deploy button teaches consequence. I take both seriously." },
      { type: "p", text: "Alongside studies: shipping real client work (Nirmaan), research-grade systems (Verde), design platforms (RESONATE), and running the MUN circuit across Delhi." },
      { type: "aside", text: "Tell me your school/college name and this section updates in one line of code." },
    ],
    links: ["skills", "mun", "about"],
  },
  {
    id: "hire",
    kind: "hire",
    kicker: "WORK WITH ME",
    title: "Open For Missions",
    subtitle: "Internships · freelance · collaborations",
    tags: ["contact", "cta"],
    stack: "response within 24h",
    image: "",
    href: "",
    summary: "Need someone who can design it, build it, ship it and make it feel alive? I'm available for internships, freelance builds and hackathon squads.",
    body: [
      { type: "lead", text: "What you get: full-stack execution with design taste, absurd speed, and the stubbornness of someone who treats 'impossible' as a spec sheet." },
      { type: "p", text: "Resume available on request — one email and it's in your inbox." },
    ],
    links: ["contact", "verde", "about"],
  },
  {
    id: "contact",
    kind: "contact",
    kicker: "CONTACT",
    title: "Summon Me",
    subtitle: "the scroll seals itself",
    tags: ["contact"],
    stack: "email · github",
    image: "",
    href: "",
    summary: "One message. It reaches me. This is the way.",
    body: [
      { type: "lead", text: "Email is the fastest ritual: contact@anujphulera.dev (swap for your real one — one line in js/content.js)." },
      { type: "p", text: "GitHub: UCHIHA-MADARA-ANUJ — 26 repos of evidence." },
    ],
    links: ["hire", "about", "this-site"],
  },
];

export const UNIT_MAP = new Map(UNITS.map((u) => [u.id, u]));
export const UNIT_IDS = UNITS.map((u) => u.id);

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

/** Semantic distance: 0 = same idea-space, 1 = strangers. */
export function semanticDistance(aId, bId) {
  const a = UNIT_MAP.get(aId);
  const b = UNIT_MAP.get(bId);
  if (!a || !b) return 1;
  if (a.links.includes(bId) || b.links.includes(aId)) return 0.18;
  const shared = a.tags.filter((t) => b.tags.includes(t)).length;
  return Math.max(0.28, 1 - shared * 0.38);
}

/** Fuzzy search used by jump + brain surfaces. */
export function searchUnits(query, affinity = new Map()) {
  const q = query.trim().toLowerCase();
  const scored = UNITS.map((u) => {
    let score = 0;
    const title = u.title.toLowerCase();
    const hay = `${title} ${u.subtitle.toLowerCase()} ${u.summary.toLowerCase()} ${u.tags.join(" ")} ${u.stack.toLowerCase()}`;
    if (!q) score = 0.4;
    else if (title.startsWith(q)) score += 3;
    else if (title.includes(q)) score += 2;
    else if (hay.includes(q)) score += 1;
    for (const w of q.split(/\s+/)) {
      if (w && hay.includes(w)) score += 0.5;
    }
    score += (affinity.get(u.id) || 0) * 1.4;
    return { unit: u, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.unit);
}
