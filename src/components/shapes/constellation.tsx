"use client";

import { motion } from "framer-motion";
import { hash01, type Unit } from "@/lib/evolution/content";
import type { ShapeCtx } from "./magazine";

/**
 * SHAPE · CONSTELLATION — a free star-map.
 * Deliberately unreadable everywhere at once — that's the choice.
 */

export function Constellation({ ctx }: { ctx: ShapeCtx }) {
  const { cards, act, state } = ctx;

  return (
    <div className="relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-12 pb-4">
        <div className="flex items-center gap-3 hud-label !text-reso">
          <span className="w-8 h-[1.5px] bg-reso shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
          CURRENT SHAPE · ✦ CONSTELLATION
        </div>
        <h2 className="mt-3 font-display text-[clamp(2.2rem,5.5vw,4.2rem)] font-bold text-white leading-[0.9]">
          The Star Map
        </h2>
        <p className="mt-2 text-white/50 text-sm max-w-xl">
          The same twelve stories, scattered as stars. Grab one, or click a satellite — the map
          never moves until it evolves.
        </p>
      </div>

      <div className="relative h-[min(72vh,660px)] mx-4 sm:mx-8 border border-white/8 rounded-xl overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.05),transparent_70%)]">
        {/* faint grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" aria-hidden="true">
          <defs>
            <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M 56 0 L 0 0 0 56" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {cards.map((u, i) => {
          const hub = i < 5;
          const top = 8 + hash01(u.id + "y") * (hub ? 52 : 34) + (hub ? 0 : 34);
          const left = 5 + hash01(u.id + "x") * 74;
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="absolute"
              style={{ top: `${top}%`, left: `${left}%`, width: hub ? "min(210px, 22vw)" : "min(140px, 16vw)" }}
            >
              <button
                onClick={() => act("focus", { unitId: u.id })}
                className={`w-full text-left border rounded-lg px-3 py-2.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1
                  ${hub
                    ? "border-reso/40 bg-[#06121a]/85 hover:shadow-[0_0_38px_-8px_rgba(0,240,255,0.55)]"
                    : "border-white/12 bg-black/70 hover:border-white/40 hover:shadow-[0_0_28px_-8px_rgba(255,255,255,0.35)]"}`}
              >
                <div className={`font-display text-[13px] leading-tight ${hub ? "text-white" : "text-white/80"}`}>
                  {u.title}
                </div>
                <div className="hud-label !text-[7.5px] mt-1 truncate">{u.subtitle}</div>
              </button>
              {/* twinkles */}
              <motion.span
                className="absolute -top-1.5 -right-1.5 w-1.5 h-1.5 rounded-full bg-reso shadow-[0_0_10px_rgba(0,240,255,0.9)]"
                animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.8 + hash01(u.id) * 1.6, delay: hash01(u.id + "t") * 2 }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* legend */}
      <div className="max-w-7xl mx-auto px-8 py-6 flex flex-wrap gap-5">
        {[
          ["●", "white", "star = a story"],
          ["●", "reso", "big star = a hub — click to orbit it"],
          ["◆", "shock", "click anything to expand"],
        ].map(([g, c, t], i) => (
          <span key={i} className={`hud-label flex items-center gap-2 ${c === "reso" ? "!text-reso" : c === "shock" ? "!text-shock" : ""}`}>
            <i className="not-italic">{g}</i> {t}
          </span>
        ))}
      </div>

      {/* expanded overlay card lives here when focus set */}
      {state.focusId && cards.find((c) => c.id === state.focusId) && (
        <FocusOverlay unit={cards.find((c) => c.id === state.focusId)!} ctx={ctx} />
      )}
    </div>
  );
}

function FocusOverlay({ unit, ctx }: { unit: Unit; ctx: ShapeCtx }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-x-0 bottom-0 z-[55] p-4 sm:p-6 pointer-events-none"
    >
      <div className="max-w-2xl mx-auto pointer-events-auto border border-shock/45 bg-black/95 backdrop-blur-xl p-5 shadow-[0_0_60px_-12px_rgba(255,0,85,0.5)]">
        <div className="hud-label !text-shock mb-1.5">{unit.kicker}</div>
        <div className="font-display text-2xl text-white">{unit.title}</div>
        <p className="text-white/60 text-sm mt-2 leading-relaxed">{unit.summary}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => ctx.act("toggle", { unitId: unit.id })} className="btn-ghost !py-2 !px-4 !text-[9px]">
            {ctx.state.expanded.has(unit.id) ? "COLLAPSE" : "READ"}
          </button>
          <button onClick={() => ctx.act("orbit", { unitId: unit.id })} className="btn-ghost !py-2 !px-4 !text-[9px]">
            CENTRE
          </button>
          <button onClick={() => ctx.act("focus", { unitId: null })} className="btn-shock !py-2 !px-4 !text-[9px]">
            CLOSE
          </button>
        </div>
      </div>
    </motion.div>
  );
}
