"use client";

import { motion } from "framer-motion";
import { Card, type ActFn } from "@/components/cards";
import type { Unit } from "@/lib/evolution/content";
import type { RawEvent } from "@/lib/evolution/telemetry";

/**
 * SHAPE · MAGAZINE — a calm editorial spread.
 * 1 lead story + 2 secondaries + a rail. Hierarchy is frozen.
 */

export function Magazine({ ctx }: { ctx: ShapeCtx }) {
  const { cards, act, state } = ctx;
  const lead = cards[0];
  const secondaries = cards.slice(1, 3);
  const rail = cards.slice(3);

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
      <SectionTitle
        kicker="CURRENT SHAPE · ▤ MAGAZINE"
        title="The Long Read"
        sub="Hierarchy frozen. The lead story leads, the rail rails. It reorders only at evolution moments."
      />

      {lead && (
        <div className="mb-10">
          <Card
            unit={lead}
            expanded={state.expanded.has(lead.id)}
            pinned={state.pins.has(lead.id)}
            index={0}
            act={act as ActFn}
            className="w-full"
            variant="full"
          />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {secondaries.map((u, i) => (
          <Card
            key={u.id}
            unit={u}
            expanded={state.expanded.has(u.id)}
            pinned={state.pins.has(u.id)}
            index={i + 1}
            act={act as ActFn}
            variant="full"
          />
        ))}
      </div>

      <div className="hud-label mb-5 flex items-center gap-3">
        <span className="w-10 h-px bg-white/15" />FROM THE ARCHIVE
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rail.map((u, i) => (
          <Card
            key={u.id}
            unit={u}
            expanded={state.expanded.has(u.id)}
            pinned={state.pins.has(u.id)}
            index={i + 3}
            act={act as ActFn}
            variant="full"
          />
        ))}
      </div>
    </div>
  );
}

export function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="mb-10"
    >
      <div className="flex items-center gap-3 hud-label !text-shock mb-3">
        <span className="w-8 h-[1.5px] bg-shock shadow-[0_0_8px_rgba(255,0,85,0.9)]" />
        {kicker}
      </div>
      <h2 className="font-display text-[clamp(2.2rem,5.5vw,4.2rem)] font-bold text-white leading-[0.9] tracking-tight">
        {title}
      </h2>
      <p className="mt-3 text-white/50 text-sm sm:text-base max-w-2xl leading-relaxed">{sub}</p>
    </motion.div>
  );
}

export type ShapeCtx = {
  cards: Unit[];
  act: (type: string, payload?: Record<string, unknown>) => void;
  state: {
    expanded: Set<string>;
    pins: Set<string>;
    seen: Set<string>;
    recentEvents: RawEvent[];
    focusId: string | null;
  };
};
