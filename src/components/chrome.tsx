"use client";

import { motion } from "framer-motion";

/**
 * CHROME — the HUD top bar. The one thing that never morphs.
 */

export function Chrome({
  shapeName,
  shapeGlyph,
  generation,
  onBrain,
}: {
  shapeName: string;
  shapeGlyph: string;
  generation: number;
  onBrain: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-4 sm:px-8 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border border-shock/60 bg-shock/10 grid place-items-center font-display font-bold text-shock text-sm shadow-[0_0_24px_-6px_rgba(255,0,85,0.7)]">
            AP
          </div>
          <div>
            <div className="font-display font-semibold tracking-[0.22em] text-sm text-white">ANUJ PHULERA</div>
            <div className="hud-label !text-[8px]">THE IMPOSSIBLE INTERFACE</div>
          </div>
        </div>

        <div className="flex-1" />

        <motion.div
          key={shapeName}
          initial={{ scale: 0.85, opacity: 0, filter: "brightness(2.4)" }}
          animate={{ scale: 1, opacity: 1, filter: "brightness(1)" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5 border border-reso/40 bg-reso/10 px-4 py-2 rounded-full"
        >
          <span className="text-reso text-sm">{shapeGlyph}</span>
          <span className="hud-label !text-reso !tracking-[0.26em]">{shapeName.toUpperCase()}</span>
        </motion.div>

        <div className="hud-label border border-white/10 rounded-full px-3 py-2">
          GEN <span className="text-white">{String(generation).padStart(2, "0")}</span>
        </div>

        <button onClick={onBrain} className="btn-ghost !py-2.5 rounded-full flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-shock animate-pulse shadow-[0_0_10px_rgba(255,0,85,0.9)]" />
          SEE ITS BRAIN
        </button>
      </div>
    </header>
  );
}

export function Ticker() {
  const items = ["TYPESCRIPT", "NEXT.JS", "THREE.JS", "REACT", "VERDE", "RESONATE", "SKILLVERSE", "NIRMAAN", "MODEL UN", "CINEMATIC UI", "WAKE UP TO REALITY"];
  const strip = (
    <div className="ticker-track">
      {[...items, ...items].map((t, i) => (
        <span key={i} className="flex items-center gap-6 hud-label !tracking-[0.34em] whitespace-nowrap">
          {t}<i className="text-shock not-italic">✦</i>
        </span>
      ))}
    </div>
  );
  return (
    <div className="ticker-mask border-b border-white/8 bg-black/40 py-2.5" aria-hidden="true">
      {strip}
    </div>
  );
}
