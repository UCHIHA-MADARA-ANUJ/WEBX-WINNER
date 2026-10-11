"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { PROFILE } from "@/lib/evolution/content";

/** The neural wave is pure client-side WebGL — never SSR it. */
const ParticleField = dynamic(
  () => import("./particle-field").then((m) => m.ParticleField),
  { ssr: false }
);

/**
 * THE LANDING — HUD cinematic hero.
 * Giant glitch type over a neural particle wave, framed by system
 * telemetry. Three glowing doors decide how the story begins.
 */

const ease = [0.16, 1, 0.3, 1] as const;

export type Mode = "reader" | "explorer" | "speedrunner";

const DOORS: { mode: Mode; glyph: string; title: [string, string]; sub: string; accent: "shock" | "reso" | "white" }[] = [
  { mode: "reader", glyph: "▤", title: ["READ", "CAREFULLY"], sub: "→ become a magazine", accent: "shock" },
  { mode: "explorer", glyph: "✦", title: ["EXPLORE", "WILDLY"], sub: "→ become a constellation", accent: "reso" },
  { mode: "speedrunner", glyph: "⇉", title: ["SPEED", "RUN"], sub: "→ become a swipe deck", accent: "white" },
];

export function Hero({
  generation,
  onChoose,
  onSkip,
}: {
  generation: number;
  onChoose: (mode: Mode) => void;
  onSkip: () => void;
}) {
  return (
    <motion.section
      className="fixed inset-0 z-[60] bg-black overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(14px)" }}
      transition={{ duration: 0.65, ease }}
    >
      <ParticleField />

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#000_100%)] pointer-events-none opacity-80" />

      {/* HUD frame */}
      <div className="absolute inset-4 sm:inset-6 border border-white/10 pointer-events-none z-10">
        <div className="absolute top-3 left-4 flex flex-col gap-1.5 hud-label">
          <span className="text-reso animate-pulse">◈ SYS.OPERATIONAL</span>
          <span>LAT: 28.6139° N</span>
          <span>LON: 77.2090° E</span>
        </div>
        <div className="absolute top-3 right-4 flex flex-col gap-1.5 hud-label text-right">
          <span>{generation >= 2 ? `GEN_${String(generation).padStart(2, "0")} // RETURNING` : "GEN_01 // FIRST CONTACT"}</span>
          <span>NODE: ANUJ.PRIME</span>
          <span className="text-shock">STRUCTURE: UNDECIDED</span>
        </div>
        <div className="absolute bottom-3 left-4 hud-label">
          SCROLL TO INITIATE SEQUENCE
        </div>
        <div className="absolute bottom-3 right-4 flex flex-col items-end gap-2 hud-label">
          <span>THE IMPOSSIBLE INTERFACE · V2.0</span>
          <div className="w-16 h-px bg-white/20" />
        </div>
        {/* corner ticks */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-reso/50" />
        <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-reso/50" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-shock/50" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-shock/50" />
      </div>

      {/* content */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 26, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.1, delay: 0.15, ease }}
          className="hud-label text-shock tracking-[0.5em] mb-6"
        >
          ◈ WEBX · THE IMPOSSIBLE INTERFACE
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.94, filter: "blur(24px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.5, delay: 0.3, ease }}
          className="font-display font-bold leading-[0.8] tracking-tighter"
        >
          <span className="block text-[clamp(3.4rem,14vw,13rem)] text-white glitch-text" data-text="ANUJ">
            ANUJ
          </span>
          <span
            className="block text-[clamp(2.6rem,10.5vw,9.5rem)] text-outline hover:text-reso transition-colors duration-500"
            data-text="PHULERA"
          >
            PHULERA
          </span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-6 flex flex-wrap justify-center items-center gap-3 hud-label"
        >
          <span>BUILDER</span><i className="text-shock not-italic">◆</i>
          <span>DESIGNER</span><i className="text-shock not-italic">◆</i>
          <span>FULL-STACK</span><i className="text-shock not-italic">◆</i>
          <span>DELHI</span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1, ease }}
          className="mt-5 font-mono text-xs sm:text-sm tracking-[0.18em] text-reso/90 max-w-xl"
        >
          「{PROFILE.creed}」
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.15, ease }}
          className="mt-5 text-sm sm:text-base text-white/60 max-w-lg leading-relaxed"
        >
          This website has <span className="text-white">no fixed layout</span> — it watches how
          you move and <span className="text-shock">physically rebuilds itself</span> around you.
          Choose how your story begins.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.35, ease }}
          className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl"
        >
          {DOORS.map((d) => (
            <button
              key={d.mode}
              onClick={() => onChoose(d.mode)}
              className={`group relative border border-white/12 bg-white/[0.025] px-6 py-7 text-left
                transition-all duration-300 hover:-translate-y-1.5
                ${d.accent === "shock" ? "hover:border-shock hover:shadow-[0_0_50px_-10px_rgba(255,0,85,0.55)]" : ""}
                ${d.accent === "reso" ? "hover:border-reso hover:shadow-[0_0_50px_-10px_rgba(0,240,255,0.5)]" : ""}
                ${d.accent === "white" ? "hover:border-white/70 hover:shadow-[0_0_50px_-10px_rgba(255,255,255,0.35)]" : ""}`}
            >
              <div className={`text-2xl mb-4 transition-transform duration-300 group-hover:scale-125
                ${d.accent === "shock" ? "text-shock" : d.accent === "reso" ? "text-reso" : "text-white"}`}>
                {d.glyph}
              </div>
              <div className="font-display text-xl sm:text-2xl font-semibold leading-tight text-white">
                {d.title[0]}<br />{d.title[1]}
              </div>
              <div className="mt-3 hud-label group-hover:text-white/80 transition-colors">{d.sub}</div>
            </button>
          ))}
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.6 }}
          onClick={onSkip}
          className="mt-8 hud-label hover:text-shock transition-colors underline underline-offset-8 decoration-white/20 hover:decoration-shock"
        >
          or just start — let it figure me out
        </motion.button>

        {generation >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="mt-5 hud-label text-shock"
          >
            ✦ THE GENOME REMEMBERS YOU FROM LAST TIME
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
