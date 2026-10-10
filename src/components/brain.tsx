"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TRAITS, TRAIT_LABELS, type Genome } from "@/lib/evolution/genome";
import { PARADIGMS, PARADIGM_IDS, type Fitness } from "@/lib/evolution/scheduler";
import type { RawEvent } from "@/lib/evolution/telemetry";

/**
 * SEE ITS BRAIN — the glass box in human words.
 */

const HUMAN: Record<string, [string, string, string]> = {
  linearity: ["journey", "straight line", "free roam"],
  pace: ["tempo", "calm", "rapid"],
  depth: ["reading", "grazing", "diving"],
  agency: ["control", "follows", "drives"],
  keyboard: ["input", "pointer", "keys"],
};

const EVENT_WORDS: Record<string, (e: RawEvent) => string> = {
  open: (e) => `opened “${e.unitId || "…"}” via ${e.via || "click"}`,
  expand: (e) => (e.on ? "expanded a card to read it fully" : "collapsed a card"),
  dwell: (e) => `lingered ${Math.round((e.ms || 0) / 1000)}s on “${e.unitId || "…"}”`,
  pin: (e) => (e.on ? "pinned a card" : "unpinned a card"),
  jump: (e) => `jumped straight to “${e.unitId || "…"}”`,
  navigate: (e) => `moved via ${e.via || "…"}`,
  triage: (e) => `judged a card: ${e.verdict || "…"}`,
  command: () => "used a keyboard command",
  orbit: (e) => `re-centred the orbit on “${e.unitId || "…"}”`,
  "choose-mode": (e) => `chose the ${e.mode || "…"} door`,
  "force-paradigm": () => "forced a shape manually",
};

export function Brain({
  open,
  genome,
  fitnesses,
  current,
  events,
  onClose,
  onReset,
}: {
  open: boolean;
  genome: Genome;
  fitnesses: Fitness[];
  current: string;
  events: RawEvent[];
  onClose: () => void;
  onReset: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 240 }}
          className="fixed right-0 top-0 bottom-0 z-[75] w-[min(430px,94vw)] bg-black/95 border-l border-shock/30 backdrop-blur-2xl flex flex-col"
          aria-label="See its brain"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div className="font-display tracking-[0.24em] text-shock text-sm">🧠 SEE ITS BRAIN</div>
            <button onClick={onClose} className="btn-ghost !py-2 !px-4 !text-[9px]">CLOSE</button>
          </div>

          <div className="flex-1 overflow-auto px-6 py-6 flex flex-col gap-8">
            <section>
              <div className="hud-label mb-4">WHAT IT THINKS OF YOU</div>
              <div className="flex justify-center mb-5">
                <motion.div
                  animate={{
                    scale: [1, 1.12 + genome.pace * 0.25, 1],
                    boxShadow: [
                      `0 0 ${30 + genome.agency * 60}px rgba(255,0,85,0.5)`,
                      `0 0 ${50 + genome.agency * 80}px rgba(0,240,255,0.65)`,
                      `0 0 ${30 + genome.agency * 60}px rgba(255,0,85,0.5)`,
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 2.6 - genome.pace * 1.2, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-full bg-[radial-gradient(circle_at_35%_35%,#ff0055,#0b001a_75%)]"
                />
              </div>
              {TRAITS.map((t) => {
                const [label, lo, hi] = HUMAN[t];
                const v = genome[t];
                return (
                  <div key={t} className="mb-4">
                    <div className="flex justify-between hud-label">
                      <span>{label}</span>
                      <b className="text-white/90">{v < 0.38 ? lo : v > 0.62 ? hi : "mixed"}</b>
                    </div>
                    <div className="h-[5px] bg-white/8 rounded-full mt-1.5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#00F0FF] to-[#FF0055]"
                        animate={{ width: `${8 + v * 92}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="hud-label !text-[7.5px]">{lo}</span>
                      <span className="hud-label !text-[7.5px]">{hi}</span>
                    </div>
                  </div>
                );
              })}
            </section>

            <section>
              <div className="hud-label mb-4">THE FOUR SHAPES, COMPETING RIGHT NOW</div>
              {fitnesses.map((f) => (
                <div key={f.id} className="mb-3">
                  <div className="flex justify-between hud-label">
                    <b className={f.id === current ? "!text-reso" : ""}>{PARADIGMS[f.id].glyph} {f.name}</b>
                    <span className="text-white/80">{f.score.toFixed(2)}</span>
                  </div>
                  <div className="h-[4px] bg-white/8 rounded-full mt-1.5 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${f.id === current ? "bg-reso shadow-[0_0_12px_rgba(0,240,255,0.8)]" : "bg-white/25"}`}
                      animate={{ width: `${Math.min(100, f.score * 100)}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>
              ))}
            </section>

            <section>
              <div className="hud-label mb-4">WHAT IT JUST SAW YOU DO</div>
              <div className="flex flex-col gap-1">
                {events.slice(-10).reverse().map((e, i) => {
                  const say = EVENT_WORDS[e.type];
                  return (
                    <div key={i} className={`font-mono text-[10px] px-2 py-1.5 rounded ${i < 3 ? "bg-white/[0.03] text-white/60" : "text-white/30"}`}>
                      <span className="text-shock mr-2">{e.type}</span>
                      {say ? say(e) : JSON.stringify(e).slice(0, 48)}
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <p className="text-white/40 text-xs leading-relaxed">
                Every action nudges 5 behavioural traits. They decay toward neutral, so only
                patterns — not single clicks — reshape the site. Shapes compete on fitness; a new
                shape must beat the current one before the site dares to rebuild.
                <b className="text-white/70"> Evolution, never chaos.</b>
              </p>
              <button onClick={onReset} className="btn-ghost mt-4 !text-[9px]">
                ERASE ITS MEMORY OF ME
              </button>
            </section>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
