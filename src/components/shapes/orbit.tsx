"use client";

import { motion } from "framer-motion";
import { Card, type ActFn } from "@/components/cards";
import { UNIT_MAP } from "@/lib/evolution/content";
import type { ShapeCtx } from "./magazine";

/**
 * SHAPE · ORBIT — one idea at the centre, the rest revolving.
 * Following a thread of thought = the shape that thinks in threads.
 */

export function Orbit({ ctx }: { ctx: ShapeCtx }) {
  const { cards, act, state } = ctx;
  const centreId = state.focusId && UNIT_MAP.has(state.focusId) ? state.focusId : cards[0]?.id;
  const centre = UNIT_MAP.get(centreId || "");
  const relatedIds = centre?.links || [];
  const rest = cards.filter((u) => u.id !== centreId && !relatedIds.includes(u.id)).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
      <div className="flex items-center gap-3 hud-label !text-reso mb-3">
        <span className="w-8 h-[1.5px] bg-reso shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
        CURRENT SHAPE · ◎ ORBIT
      </div>
      <h2 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] font-bold text-white leading-[0.9]">
        The Orbit
      </h2>
      <p className="mt-2 text-white/50 text-sm max-w-xl">
        One idea holds the centre. Its threads revolve closest. Everything else drifts further out.
      </p>

      <div className="mt-10 grid lg:grid-cols-[1.1fr,0.9fr] gap-8 items-start">
        {centre && (
          <motion.div
            layout
            className="lg:sticky lg:top-24"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hud-label !text-shock mb-3">◎ THE CENTRE</div>
            <Card
              unit={centre}
              expanded={state.expanded.has(centre.id)}
              pinned={state.pins.has(centre.id)}
              index={0}
              act={act as ActFn}
              variant="hub"
            />
          </motion.div>
        )}

        <div>
          <div className="hud-label mb-3">↻ ITS THREADS — CLOSEST</div>
          <div className="flex flex-col gap-3.5">
            {relatedIds.map((id, i) => {
              const u = UNIT_MAP.get(id);
              if (!u) return null;
              return (
                <motion.button
                  key={id}
                  layout
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
                  onClick={() => act("orbit", { unitId: id })}
                  className="text-left border border-reso/25 bg-[#041018]/80 rounded-lg px-4 py-3.5 hover:border-reso hover:shadow-[0_0_30px_-8px_rgba(0,240,255,0.5)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="font-display text-white text-sm">{u.title}</div>
                  <div className="hud-label mt-1">{u.subtitle}</div>
                </motion.button>
              );
            })}
          </div>

          <div className="hud-label mt-8 mb-3">… FURTHER OUT</div>
          <div className="flex flex-wrap gap-2.5">
            {rest.map((u, i) => (
              <motion.button
                key={u.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                onClick={() => act("orbit", { unitId: u.id })}
                className="border border-white/10 rounded-full px-3.5 py-1.5 hud-label hover:border-white/45 hover:text-white transition-colors"
              >
                {u.title}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
