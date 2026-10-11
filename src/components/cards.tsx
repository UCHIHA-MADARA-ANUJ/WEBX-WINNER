"use client";

import { motion } from "framer-motion";
import type { Unit } from "@/lib/evolution/content";

/**
 * CARDS — one persistent identity per piece of the story.
 * Shapes re-dress these; framer-motion flies them between structures.
 */

export type ActFn = (type: string, payload?: Record<string, unknown>) => void;

export function Card({
  unit,
  expanded,
  pinned,
  index,
  act,
  className = "",
  style,
  variant = "full",
  reveal = true,
}: {
  unit: Unit;
  expanded: boolean;
  pinned: boolean;
  index: number;
  act: ActFn;
  className?: string;
  style?: React.CSSProperties;
  variant?: "full" | "compact" | "star" | "satellite" | "deck" | "hub";
  reveal?: boolean;
}) {
  const compact = variant === "star" || variant === "satellite";

  return (
    <motion.article
      layout
      layoutId={`card-${unit.id}`}
      initial={reveal ? { opacity: 0, y: 26, filter: "blur(6px)" } : false}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.65, delay: Math.min(index, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      style={style}
      onClick={() => act("focus", { unitId: unit.id })}
      className={`lcard cursor-pointer ${expanded ? "is-expanded" : ""} ${className}`}
      aria-label={unit.title}
    >
      {/* visual */}
      {unit.image ? (
        <div className={`relative overflow-hidden ${compact ? "h-16" : variant === "deck" || variant === "hub" ? "h-40 sm:h-48" : "h-36 sm:h-44"}`}>
          <img
            src={unit.image}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent" />
        </div>
      ) : (
        <div className={`relative overflow-hidden grid place-items-center ${compact ? "h-14" : "h-28"}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,0,85,0.18),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(0,240,255,0.14),transparent_60%)]" />
          <span className="font-display text-5xl text-white/12 select-none">{unit.title[0]}</span>
        </div>
      )}

      <div className={`relative z-[1] flex flex-col gap-2.5 ${compact ? "p-3" : "p-5 sm:p-6"}`}>
        {!compact && (
          <div className="flex items-center gap-2.5 hud-label !text-shock">
            <span className="w-5 h-[1.5px] bg-shock shadow-[0_0_8px_rgba(255,0,85,0.9)]" />
            {unit.kicker}
          </div>
        )}
        <h3 className={`font-display font-semibold text-white leading-tight ${compact ? "text-[12px]" : "text-xl sm:text-2xl"}`}>
          {unit.title}
        </h3>
        {!compact && unit.subtitle && (
          <div className="text-white/45 italic text-sm -mt-1">{unit.subtitle}</div>
        )}
        {!compact && (
          <div className="flex flex-wrap items-center gap-2 hud-label">
            {unit.tags.map((t) => (
              <span key={t} className="border border-white/10 rounded-full px-2.5 py-0.5 !text-[8.5px]">{t}</span>
            ))}
            <span className="text-reso/80 !text-[8.5px]">{unit.stack}</span>
          </div>
        )}
        {!compact && <p className="text-white/55 text-sm leading-relaxed">{unit.summary}</p>}

        {expanded && !compact && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border-t border-white/10 pt-4 mt-1 flex flex-col gap-3.5 overflow-hidden"
          >
            {unit.body.map((b, i) =>
              b.type === "aside" ? (
                <p key={i} className="font-mono text-[11px] leading-relaxed text-white/40 border-l-2 border-shock pl-3 tracking-wide">
                  {b.text}
                </p>
              ) : (
                <p key={i} className={`text-white/${b.type === "lead" ? "85" : "65"} leading-relaxed ${b.type === "lead" ? "text-[15px]" : "text-sm"}`}>
                  {b.text}
                </p>
              )
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="hud-label !text-[8px] pt-2">THREADS</span>
              {unit.links.map((id) => (
                <button
                  key={id}
                  onClick={(e) => { e.stopPropagation(); act("rel", { unitId: id, from: unit.id }); }}
                  className="border border-dashed border-white/15 rounded-full px-2.5 py-1 hud-label !text-[8px] hover:border-shock hover:text-shock transition-colors"
                >
                  → {id}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {!compact && (
          <div className="flex flex-wrap gap-2 pt-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); act("toggle", { unitId: unit.id }); }}
              className="btn-ghost !py-2 !px-4 !text-[9px]"
            >
              {expanded ? "COLLAPSE" : "READ"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); act("pin", { unitId: unit.id }); }}
              className={`btn-ghost !py-2 !px-4 !text-[9px] ${pinned ? "!border-[#FFCE73] !text-[#FFCE73]" : ""}`}
            >
              {pinned ? "PINNED ◆" : "PIN"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); act("orbit", { unitId: unit.id }); }}
              className="btn-ghost !py-2 !px-4 !text-[9px]"
            >
              CENTRE
            </button>
            {unit.href && (
              <a
                href={unit.href}
                target="_blank"
                rel="noopener"
                onClick={(e) => e.stopPropagation()}
                className="btn-shock !py-2 !px-4 !text-[9px]"
              >
                SEE IT LIVE ↗
              </a>
            )}
          </div>
        )}
      </div>

      <div className="lcard__spot" aria-hidden="true" />
      {pinned && (
        <div className="absolute top-3 right-3.5 text-[#FFCE73] text-sm drop-shadow-[0_0_10px_rgba(255,206,115,0.9)] z-10">◆</div>
      )}
    </motion.article>
  );
}
