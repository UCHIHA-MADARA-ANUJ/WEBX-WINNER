"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Lenis from "lenis";
import { BootSequence } from "./boot";
import { Hero, type Mode } from "./hero";
import { Chrome, Ticker } from "./chrome";
import { Banner, type BannerData } from "./banner";
import { Brain } from "./brain";
import { Jump } from "./jump";
import { Magazine, type ShapeCtx } from "./shapes/magazine";
import { Constellation } from "./shapes/constellation";
import { Deck } from "./shapes/deck";
import { Orbit } from "./shapes/orbit";
import {
  UNITS, UNIT_MAP, UNIT_IDS, PROFILE,
  semanticDistance, type Unit,
} from "@/lib/evolution/content";
import {
  applyEvent, decay, mutate, neutralGenome, TRAITS,
  type Genome,
} from "@/lib/evolution/genome";
import {
  createScheduler, PARADIGMS, PARADIGM_IDS,
  type Decision, type ShapeId,
} from "@/lib/evolution/scheduler";
import { createTelemetry, type RawEvent } from "@/lib/evolution/telemetry";
import { loadState, saveState, clearState } from "@/lib/evolution/memory";

/**
 * EXPERIENCE — the conductor of the organism.
 * Senses (telemetry) → belief (genome) → selection (scheduler) →
 * structure (shapes). Golden rule: evolution, not chaos.
 */

const ease = [0.22, 1, 0.36, 1] as const;

type Phase = "boot" | "hero" | "experience";

export function Experience() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [generation, setGeneration] = useState(1);
  const [shape, setShape] = useState<ShapeId>("magazine");
  const [genome, setGenome] = useState<Genome>(neutralGenome());
  const [fitnesses, setFitnesses] = useState(() => ([] as ReturnType<NonNullable<ReturnType<typeof createScheduler>["fitnesses"]>>));
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [brainOpen, setBrainOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [recentEvents, setRecentEvents] = useState<RawEvent[]>([]);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pins, setPins] = useState<Set<string>>(new Set());
  const [rankedIds, setRankedIds] = useState<string[]>(() => UNIT_IDS.slice(0, 11));
  const [pinnedRank, setPinnedRank] = useState<string[]>([]);
  const [readRank, setReadRank] = useState<string[]>([]);
  const [affinity, setAffinity] = useState<Map<string, number>>(new Map());
  const [, forceRender] = useState(0);

  const genomeRef = useRef(genome);
  const telemetry = useRef(createTelemetry());
  const scheduler = useRef(createScheduler({ genome: genomeRef.current }));
  const trailRef = useRef<string[]>([]);
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDwell = useRef({ id: null as string | null, start: 0 });
  const shockwaveKey = useRef(0);
  const bannerKey = useRef(0);
  const seenRef = useRef<Set<string>>(new Set());
  const expandedRef = useRef(expanded);
  const pinsRef = useRef(pins);
  const shapeRef = useRef<ShapeId>(shape);

  useEffect(() => { expandedRef.current = expanded; }, [expanded]);
  useEffect(() => { pinsRef.current = pins; }, [pins]);
  useEffect(() => { shapeRef.current = shape; }, [shape]);

  /* recognise returning visitors before the hero even speaks */
  useEffect(() => {
    const saved = loadState();
    if (saved?.generation) setGeneration(saved.generation + 1);
  }, []);

  /* smooth scroll — Lenis, like the RESONATE standard */
  useEffect(() => {
    if (phase !== "experience") return;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, touchMultiplier: 1.6 });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [phase]);

  /* ---------------- persistence ---------------- */
  const persist = useCallback(() => {
    saveState({
      generation,
      genome: { ...genomeRef.current },
      pins: [...pinsRef.current],
      seen: [...seenRef.current],
      expanded: [...expandedRef.current],
      focusId,
      trail: trailRef.current.slice(-20),
      affinity: [...affinity.entries()],
      promoted: {},
      lastShape: shapeRef.current,
      scheduler: scheduler.current.serialize(),
    });
  }, [generation, focusId, affinity]);

  useEffect(() => {
    if (phase === "experience") persist();
  }, [phase, persist, shape, expanded, pins, focusId]);

  /* ---------------- prime ranking (frozen per shape-session) ---------------- */
  const computeRanked = useCallback(() => {
    const aff = affinity;
    const scored = UNIT_IDS.map((id) => {
      const unit = UNIT_MAP.get(id)!;
      const seenBoost = seenRef.current.has(id) ? 0.22 : 0;
      const base =
        0.38 + (aff.get(id) || 0) * 0.6 + seenBoost + 0.22 * (1 - semanticDistance(id, focusId || "about"));
      const jitter = (id.charCodeAt(0) * 7 + id.length * 13 + generation * 31) % 100 / 1000;
      return { id, score: base + jitter };
    }).sort((a, b) => b.score - a.score).map((s) => s.id);

    setPinnedRank(scored.filter((id) => pinsRef.current.has(id)));
    setReadRank(scored.filter((id) => expandedRef.current.has(id) && !pinsRef.current.has(id)));
    setRankedIds(scored.filter((id) => !pinsRef.current.has(id) && !expandedRef.current.has(id)));
    forceRender((n) => n + 1);
  }, [affinity, focusId, generation]);

  /* ---------------- evolution moment (the ONLY reorder point) ---------------- */
  const evolutionMoment = useCallback((d: Decision | null, reason: string) => {
    // shockwave
    shockwaveKey.current += 1;
    const el = document.createElement("div");
    el.className = "shockwave";
    el.dataset.k = String(shockwaveKey.current);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);

    // golden rule: hierarchy may change HERE and only here
    computeRanked();

    const next = d?.to ?? shapeRef.current;
    const meta = PARADIGMS[next];
    bannerKey.current += 1;
    setBanner({
      key: bannerKey.current,
      kicker: reason === "user" ? "YOUR COMMAND" : "EVOLUTION · SHAPE SHIFT",
      headline: reason === "user" ? `You chose this · ${meta.blurb}` : (d?.why ?? meta.explain),
      sub:
        reason === "user"
          ? "The hierarchy re-flows around your choice. Plain clicks never move anything."
          : "Evidence gathered. New structure selected. Nothing moved without a reason.",
      glyph: meta.glyph,
    });

    if (d) setShape(d.to);
    setFitnesses(scheduler.current.fitnesses());
  }, [computeRanked]);

  /* ---------------- the act funnel ---------------- */
  const act = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    const unitId = payload.unitId as string | undefined | null;
    const via = payload.via as string | undefined;

    if (type === "focus" && (unitId == null || unitId === "")) {
      setFocusId(null);
      telemetry.current.setDwellTarget(null);
      return;
    }

    // 1 · senses
    let ev: RawEvent | undefined;
    switch (type) {
      case "focus": ev = telemetry.current.recordOpen(unitId!, via || "click") as RawEvent; break;
      case "toggle": {
        const on = !expandedRef.current.has(unitId!);
        ev = telemetry.current.recordExpand(unitId!, on) as RawEvent;
        setExpanded((s) => { const n = new Set(s); on ? n.add(unitId!) : n.delete(unitId!); return n; });
        break;
      }
      case "pin": {
        const on = !pinsRef.current.has(unitId!);
        ev = telemetry.current.recordPin(unitId!, on) as RawEvent;
        setPins((s) => { const n = new Set(s); on ? n.add(unitId!) : n.delete(unitId!); return n; });
        break;
      }
      case "rel": ev = telemetry.current.recordOpen(unitId!, "relation") as RawEvent; break;
      case "orbit": ev = telemetry.current.recordOpen(unitId!, "hub") as RawEvent; break;
      case "jump": ev = telemetry.current.recordJump(unitId!, via || "jump") as RawEvent; break;
      case "triage": ev = telemetry.current.recordAction("triage", { unitId, verdict: payload.verdict }) as RawEvent; break;
      case "command": ev = telemetry.current.recordAction("command", payload) as RawEvent; break;
      case "force-paradigm": ev = telemetry.current.recordAction("force-paradigm", payload) as RawEvent; break;
      default: ev = telemetry.current.recordAction(type, { unitId, ...payload }) as RawEvent;
    }
    if (ev) setRecentEvents(telemetry.current.events.slice(-12));

    // 2 · belief
    applyEvent(genomeRef.current, { type, ...payload, via });
    setGenome({ ...genomeRef.current });

    // 3 · selection
    const decision = scheduler.current.onAction();
    setFitnesses(scheduler.current.fitnesses());

    // 4 · attention bookkeeping (never reorders — golden rule)
    if (unitId) {
      seenRef.current.add(unitId);
      setAffinity((m) => {
        const n = new Map(m);
        n.set(unitId, Math.min(1, (n.get(unitId) || 0) + 0.12));
        return n;
      });
      if (type === "focus" || type === "rel" || type === "orbit" || type === "jump") {
        // flush the previous dwell first — with its REAL elapsed time
        if (dwellTimer.current && lastDwell.current.id) {
          clearTimeout(dwellTimer.current);
          const ms = Date.now() - lastDwell.current.start;
          telemetry.current.setDwellTarget(null);
          if (ms > 400) {
            applyEvent(genomeRef.current, { type: "dwell", ms, unitId: lastDwell.current.id });
            const dPrev = scheduler.current.onAction();
            if (dPrev) evolutionMoment(dPrev, "engine");
          }
        }
        setFocusId(unitId);
        trailRef.current = [...trailRef.current.slice(-19), unitId];
        telemetry.current.setDwellTarget(unitId);
        lastDwell.current = { id: unitId, start: Date.now() };
        dwellTimer.current = setTimeout(() => {
          telemetry.current.setDwellTarget(null);
          applyEvent(genomeRef.current, { type: "dwell", ms: Date.now() - lastDwell.current.start, unitId });
          lastDwell.current = { id: null, start: 0 };
          setGenome({ ...genomeRef.current });
          const d2 = scheduler.current.onAction();
          if (d2) evolutionMoment(d2, "engine");
          setFitnesses(scheduler.current.fitnesses());
        }, 12000);
      }
    }

    // 5 · evolution?
    if (decision) evolutionMoment(decision, "engine");
  }, [evolutionMoment]);

  /* ---------------- boot → hero → experience ---------------- */
  const beginExperience = useCallback((mode?: Mode) => {
    const saved = typeof window !== "undefined" ? loadState() : null;
    const g = genomeRef.current;

    if (saved) {
      setGeneration((saved.generation || 1) + 1);
      const restored = Object.fromEntries(
        TRAITS.map((t) => [t, typeof saved.genome?.[t] === "number" ? saved.genome[t] : 0.5])
      ) as Genome;
      Object.assign(g, restored);
      mutate(g, 0.12);
      scheduler.current.restore(saved.scheduler as never);
      setPins(new Set(saved.pins || []));
      pinsRef.current = new Set(saved.pins || []);
      setExpanded(new Set(saved.expanded || []));
      expandedRef.current = new Set(saved.expanded || []);
      seenRef.current = new Set(saved.seen || []);
      trailRef.current = saved.trail || [];
      setAffinity(new Map(saved.affinity || []));
    }

    if (mode) {
      applyEvent(g, { type: "prime", mode });
      telemetry.current.recordAction("choose-mode", { mode });
      // prime pushes the scheduler toward the matching shape
      const d = scheduler.current.force(
        mode === "reader" ? "magazine" : mode === "explorer" ? "constellation" : "deck",
        "prime"
      );
      setGenome({ ...g });
      setPhase("experience");
      setTimeout(() => evolutionMoment(d, "user"), 350);
    } else {
      // "just start" — genome decides freely
      setGenome({ ...g });
      setPhase("experience");
      const d = scheduler.current.maybeRestructure(true);
      if (d) setTimeout(() => evolutionMoment(d, "engine"), 350);
    }
    computeRanked();
    setFitnesses(scheduler.current.fitnesses());
    telemetry.current.recordAction("open", { via: mode ? "door" : "skip" });
    setRecentEvents(telemetry.current.events.slice(-12));
  }, [computeRanked, evolutionMoment]);

  /* ---------------- idle tick · decay + epochs ---------------- */
  useEffect(() => {
    if (phase !== "experience") return;
    const iv = setInterval(() => {
      decay(genomeRef.current, 15000);
      setGenome({ ...genomeRef.current });
      const d = scheduler.current.onTick(15);
      if (d) evolutionMoment(d, "engine");
      setFitnesses(scheduler.current.fitnesses());
    }, 15000);
    return () => clearInterval(iv);
  }, [phase, evolutionMoment]);

  /* ---------------- scroll velocity (pace signal) ---------------- */
  useEffect(() => {
    if (phase !== "experience") return;
    let lastY = window.scrollY;
    let lastT = performance.now();
    const onScroll = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      const velocity = Math.abs(window.scrollY - lastY) / dt * 1000;
      lastY = window.scrollY;
      lastT = now;
      applyEvent(genomeRef.current, { type: "scroll", velocity });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [phase]);

  /* ---------------- keyboard ---------------- */
  useEffect(() => {
    if (phase !== "experience") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;

      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        act("command", { key: "cmdk" });
        setJumpOpen(true);
        return;
      }
      switch (e.key) {
        case "/":
          e.preventDefault();
          act("command", { key: "/" });
          setJumpOpen(true);
          break;
        case "b": case "B":
          act("command", { key: "b" });
          setBrainOpen((v) => !v);
          break;
        case "m": case "M": {
          act("command", { key: "m" });
          const idx = PARADIGM_IDS.indexOf(shapeRef.current);
          const next = PARADIGM_IDS[(idx + 1) % PARADIGM_IDS.length];
          const d = scheduler.current.force(next, "command");
          evolutionMoment(d, "user");
          break;
        }
        case "Escape":
          setJumpOpen(false);
          setBrainOpen(false);
          break;
        case "ArrowRight": case "ArrowDown": {
          if (jumpOpen || brainOpen) break;
          e.preventDefault();
          const list = [...pinnedRank, ...readRank, ...rankedIds];
          const i = list.indexOf(focusId || "");
          const nextId = list[Math.min(list.length - 1, i + 1)] || list[0];
          if (nextId) act("focus", { unitId: nextId, via: "next" });
          break;
        }
        case "ArrowLeft": case "ArrowUp": {
          if (jumpOpen || brainOpen) break;
          e.preventDefault();
          const list = [...pinnedRank, ...readRank, ...rankedIds];
          const i = list.indexOf(focusId || "");
          const prevId = list[Math.max(0, i - 1)] || list[0];
          if (prevId) act("focus", { unitId: prevId, via: "prev" });
          break;
        }
        case " ": {
          if (jumpOpen || brainOpen || !focusId) break;
          e.preventDefault();
          act("toggle", { unitId: focusId });
          break;
        }
        case "[": {
          const trait = TRAITS[Math.floor(Math.random() * TRAITS.length)];
          genomeRef.current[trait] = Math.max(0, genomeRef.current[trait] - 0.1);
          setGenome({ ...genomeRef.current });
          act("command", { key: "[", trait });
          break;
        }
        case "]": {
          const trait = TRAITS[Math.floor(Math.random() * TRAITS.length)];
          genomeRef.current[trait] = Math.min(1, genomeRef.current[trait] + 0.1);
          setGenome({ ...genomeRef.current });
          act("command", { key: "]", trait });
          break;
        }
        case "e": case "E": {
          if (e.metaKey || e.ctrlKey) break;
          act("command", { key: "e" });
          const payload = {
            genome: genomeRef.current,
            log: scheduler.current.log,
            telemetry: telemetry.current.snapshot(),
          };
          void navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, jumpOpen, brainOpen, focusId, pinnedRank, readRank, rankedIds, act, evolutionMoment]);

  /* ---------------- shape ctx ---------------- */
  const cards: Unit[] = useMemo(() => {
    const ids = [...pinnedRank, ...readRank, ...rankedIds];
    return ids.map((id) => UNIT_MAP.get(id)!).filter(Boolean);
  }, [pinnedRank, readRank, rankedIds]);

  const ctx: ShapeCtx = {
    cards,
    act,
    state: {
      expanded,
      pins,
      seen: seenRef.current,
      recentEvents: recentEvents as ShapeCtx["state"]["recentEvents"],
      focusId,
    },
  };

  const onForceShape = useCallback((s: ShapeId) => {
    const d = scheduler.current.force(s, "forced");
    evolutionMoment(d, "user");
  }, [evolutionMoment]);

  const onPickJump = useCallback((unit: Unit) => {
    act("jump", { unitId: unit.id, via: "jump" });
  }, [act]);

  const resetMemory = useCallback(() => {
    clearState();
    Object.assign(genomeRef.current, neutralGenome());
    setGenome({ ...genomeRef.current });
    setGeneration(1);
    setPins(new Set());
    setExpanded(new Set());
    setAffinity(new Map());
    seenRef.current = new Set();
    trailRef.current = [];
    computeRanked();
    bannerKey.current += 1;
    setBanner({
      key: bannerKey.current,
      kicker: "MEMORY PURGED",
      headline: "It forgot you. Fresh genome, first contact again.",
      sub: "localStorage erased. The organism starts from zero — curiosity intact.",
      glyph: "✧",
    });
  }, [computeRanked]);

  /* ---------------- render ---------------- */
  return (
    <>
      <AnimatePresence mode="wait">
        {phase === "boot" && (
          <BootSequence key="boot" onComplete={() => setPhase("hero")} />
        )}

        {phase === "hero" && (
          <Hero key="hero" generation={generation} onChoose={beginExperience} onSkip={() => beginExperience()} />
        )}

        {phase === "experience" && (
          <motion.div
            key="experience"
            initial={{ opacity: 0, filter: "blur(12px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.75, ease }}
          >
            <Chrome
              shapeName={PARADIGMS[shape].name}
              shapeGlyph={PARADIGMS[shape].glyph}
              generation={generation}
              onBrain={() => setBrainOpen(true)}
            />
            <Ticker />

            {/* floating hint */}
            <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
              <div className="hud-label flex flex-wrap items-center gap-x-5 gap-y-1.5">
                <span className="text-shock">◈ IT IS WATCHING — respectfully</span>
                <span>⌘K / / TO JUMP</span>
                <span>B FOR BRAIN</span>
                <span>M TO CYCLE SHAPES</span>
                <span>SPACE TO EXPAND</span>
                <span>↑↓ TO MOVE</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.main
                key={shape}
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -18, filter: "blur(8px)" }}
                transition={{ duration: 0.65, ease }}
                className="pb-16"
              >
                {shape === "magazine" && <Magazine ctx={ctx} />}
                {shape === "constellation" && <Constellation ctx={ctx} />}
                {shape === "deck" && <Deck ctx={ctx} />}
                {shape === "orbit" && <Orbit ctx={ctx} />}
              </motion.main>
            </AnimatePresence>

            {/* footer · summon me */}
            <footer className="border-t border-white/10 bg-black/60">
              <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 grid md:grid-cols-2 gap-10">
                <div>
                  <div className="hud-label !text-shock mb-3">CONTACT · THE SCROLL ENDS HERE</div>
                  <h3 className="font-display text-[clamp(2.2rem,5vw,3.8rem)] font-bold text-white leading-[0.85]">
                    SUMMON<br />ME
                  </h3>
                  <p className="mt-4 text-white/55 text-sm max-w-md leading-relaxed">
                    One message. It reaches me. This is the way.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a href={`mailto:${PROFILE.email}`} className="btn-shock">✉ {PROFILE.email}</a>
                    <a href={PROFILE.github} target="_blank" rel="noopener" className="btn-ghost">
                      ⌘ GITHUB · {PROFILE.githubHandle}
                    </a>
                  </div>
                  <div className="hud-label mt-4">PLACEHOLDER CONTACT — swap in one line of content.ts</div>
                </div>
                <div className="flex flex-col justify-end gap-2.5">
                  <div className="hud-label">EDUCATION · STUDENT · DELHI · BUILDER</div>
                  <div className="hud-label">CREED · 「{PROFILE.creed}」</div>
                  <div className="hud-label">INTERFACE · EVOLVED {generation} TIME{generation > 1 ? "S" : ""} WITH YOU</div>
                  <div className="hud-label">GOLDEN RULE · EVOLUTION, NOT CHAOS</div>
                  <div className="hud-label !text-reso">◈ END OF LINE. THE STRUCTURE SURVIVES. FOR NOW.</div>
                </div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <Banner data={banner} onDone={() => setBanner(null)} />
      <Brain
        open={brainOpen}
        genome={genome}
        fitnesses={fitnesses.length ? fitnesses : scheduler.current.fitnesses()}
        current={shape}
        events={recentEvents}
        onClose={() => setBrainOpen(false)}
        onReset={resetMemory}
      />
      <Jump
        open={jumpOpen}
        affinity={affinity}
        onClose={() => setJumpOpen(false)}
        onPick={onPickJump}
        onForce={onForceShape}
      />
    </>
  );
}
