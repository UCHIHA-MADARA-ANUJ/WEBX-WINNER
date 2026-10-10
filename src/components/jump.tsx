"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UNITS, searchUnits, type Unit } from "@/lib/evolution/content";
import { PARADIGMS, PARADIGM_IDS, type ShapeId } from "@/lib/evolution/scheduler";

/**
 * JUMP — ⌘K / Ctrl+K / // command palette.
 * Fuzzy search + "go:" commands to force a shape.
 */

export function Jump({
  open,
  affinity,
  onClose,
  onPick,
  onForce,
}: {
  open: boolean;
  affinity: Map<string, number>;
  onClose: () => void;
  onPick: (unit: Unit) => void;
  onForce: (shape: ShapeId) => void;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const results = useMemo(() => searchUnits(q, affinity).slice(0, 7), [q, affinity]);
  const forceCommands = useMemo(
    () =>
      PARADIGM_IDS.filter((id) => `go:${id}`.includes(q.toLowerCase().replace(/\s/g, "")) || q.toLowerCase().startsWith("go")).map(
        (id) => id
      ),
    [q]
  );
  const showCommands = q.toLowerCase().replace(/\s/g, "").startsWith("go");
  const total = results.length + (showCommands ? forceCommands.length : 0);

  const commit = (i: number) => {
    if (showCommands && i < forceCommands.length) {
      onForce(forceCommands[i]);
    } else {
      const unit = results[i - (showCommands ? forceCommands.length : 0)];
      if (unit) onPick(unit);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] bg-black/85 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: -14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-[16vh] -translate-x-1/2 w-[min(620px,92vw)] bg-black/95 border border-reso/40 shadow-[0_0_70px_-10px_rgba(0,240,255,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 border-b border-white/10">
              <span className="text-reso font-mono text-xs">⌘</span>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setSel(0); }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") onClose();
                  else if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(total - 1, s + 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
                  else if (e.key === "Enter") { e.preventDefault(); commit(sel); }
                }}
                placeholder="jump anywhere… or type go:orbit / go:magazine / go:deck / go:constellation"
                className="flex-1 bg-transparent outline-none py-5 font-mono text-sm text-white placeholder:text-white/25"
              />
            </div>

            <div>
              {showCommands &&
                forceCommands.map((id, i) => (
                  <button
                    key={id}
                    onMouseEnter={() => setSel(i)}
                    onClick={() => commit(i)}
                    className={`w-full flex items-center gap-3.5 px-5 py-3 text-left border-b border-white/5
                      ${sel === i ? "bg-shock/15" : ""}`}
                  >
                    <span className="text-shock text-sm">{PARADIGMS[id].glyph}</span>
                    <span className="font-mono text-sm text-white">go:{id}</span>
                    <span className="hud-label ml-auto">{PARADIGMS[id].blurb}</span>
                  </button>
                ))}
              {results.map((u, i) => {
                const idx = i + (showCommands ? forceCommands.length : 0);
                return (
                  <button
                    key={u.id}
                    onMouseEnter={() => setSel(idx)}
                    onClick={() => commit(idx)}
                    className={`w-full flex items-center gap-3.5 px-5 py-3 text-left border-b border-white/5
                      ${sel === idx ? "bg-reso/10" : ""}`}
                  >
                    <span className="hud-label !text-reso w-14 shrink-0">{u.kicker.split(" ")[0]}</span>
                    <span className="text-sm text-white font-medium">{u.title}</span>
                    <span className="hud-label ml-auto truncate max-w-[200px]">{u.subtitle}</span>
                  </button>
                );
              })}
              {total === 0 && (
                <div className="px-5 py-10 text-center hud-label">
                  NOTHING IN THIS UNIVERSE MATCHES THAT
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 px-5 py-3 border-t border-white/10">
              <span className="hud-label !text-[7px]">↑↓ MOVE</span>
              <span className="hud-label !text-[7px]">⏎ JUMP</span>
              <span className="hud-label !text-[7px]">ESC CLOSE</span>
              <span className="hud-label !text-[7px] ml-auto">{UNITS.length} NODES INDEXED</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
