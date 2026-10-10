"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, type ActFn } from "@/components/cards";
import { UNIT_MAP } from "@/lib/evolution/content";
import type { ShapeCtx } from "./magazine";

/**
 * SHAPE · DECK — full-screen cards for decision speed.
 * Triaged in seconds, never slowly.
 */

export function Deck({ ctx }: { ctx: ShapeCtx }) {
  const { cards, act, state } = ctx;
  const recent = state.recentEvents.slice(-2);
  const triage = recent.find((e) => e.type === "triage");

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
      <div className="flex items-center gap-3 hud-label !text-white mb-3">
        <span className="w-8 h-[1.5px] bg-white/40" />
        CURRENT SHAPE · ⇉ SWIPE DECK
      </div>
      <h2 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] font-bold text-white leading-[0.9]">
        The Deck
      </h2>
      <p className="mt-2 text-white/50 text-sm max-w-xl">
        One card at a time, judged in seconds — keep it, or swipe on. The site rebuilds itself for
        triage speed.
      </p>

      <AnimatePresence mode="popLayout">
        {triage && (
          <motion.div
            key={String(triage.t)}
            initial={{ opacity: 0, y: 22, rotate: -2, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            className="mt-8 border border-white/12 bg-black/80 backdrop-blur-lg p-4 flex gap-3.5 items-start"
          >
            <div
              className={`w-10 h-10 grid place-items-center border text-lg
                ${triage.verdict === "yes" ? "border-[#FFCE73] text-[#FFCE73]" : "border-white/25 text-white/50"}`}
            >
              {triage.verdict === "yes" ? "◆" : "✕"}
            </div>
            <div>
              <div className="font-display text-white text-sm">
                {triage.verdict === "yes" ? "KEPT" : "DISMISSED"} · {UNIT_MAP.get(triage.unitId || "")?.title}
              </div>
              <div className="hud-label mt-1">
                {triage.verdict === "yes"
                  ? "pinned to the top of the stack — read it at full size"
                  : "moved down the deck — no hard feelings, just speed"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 flex flex-col gap-5">
        {cards.map((u, i) => (
          <motion.div
            key={u.id}
            layout
            initial={{ opacity: 0, x: 40, rotate: 1.5 - i * 0.4 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.55, delay: Math.min(i, 5) * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card
              unit={u}
              expanded={state.expanded.has(u.id)}
              pinned={state.pins.has(u.id)}
              index={i}
              act={act as ActFn}
              variant="deck"
              className="w-full"
            />
            <div className="flex gap-2.5 mt-2.5">
              <button
                onClick={() => act("triage", { unitId: u.id, verdict: "yes" })}
                className="btn-ghost flex-1 !py-2.5 !text-[9px]"
              >
                ◆ KEEP IT
              </button>
              <button
                onClick={() => act("triage", { unitId: u.id, verdict: "no" })}
                className="btn-ghost flex-1 !py-2.5 !text-[9px]"
              >
                ✕ SWIPE ON
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
