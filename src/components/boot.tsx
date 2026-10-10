"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * BOOT SEQUENCE — the terminal loader.
 * Short (~3s), skippable, dramatic. RESONATE energy.
 */

const LINES: { text: string; cls: string; delay: number }[] = [
  { text: "> INITIALIZING IMPOSSIBLE INTERFACE...", cls: "text-white/60", delay: 150 },
  { text: "> SCANNING VISITOR BEHAVIOR VECTORS...", cls: "text-white/60", delay: 550 },
  { text: "> GENOME: 5 TRAITS ONLINE", cls: "text-reso", delay: 950 },
  { text: "> SHAPES: MAGAZINE / CONSTELLATION / DECK / ORBIT", cls: "text-white", delay: 1300 },
  { text: "> SELECTION PRESSURE: ENGAGED", cls: "text-shock", delay: 1750 },
  { text: "> WAKE UP TO REALITY.", cls: "text-reso font-bold", delay: 2250 },
];

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [shown, setShown] = useState<number>(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    LINES.forEach((_, i) => {
      timeouts.push(setTimeout(() => setShown(i + 1), LINES[i].delay));
    });
    timeouts.push(
      setTimeout(() => setLeaving(true), 2900),
      setTimeout(onComplete, 3450)
    );
    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center px-6"
      animate={leaving ? { opacity: [1, 0, 1, 0], scale: [1, 1.06, 0.96, 1.2], filter: ["blur(0px)", "blur(6px)", "blur(0px)", "blur(18px)"] } : {}}
      transition={{ duration: 0.55, ease: "easeInOut" }}
    >
      <div className="w-full max-w-2xl font-mono text-[11px] sm:text-xs tracking-[0.22em]">
        {LINES.slice(0, shown).map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`py-1.5 ${l.cls}`}
          >
            {l.text}
          </motion.div>
        ))}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.1 }}
            className="text-shock text-[10px] tracking-[0.4em]"
          >
            ▮
          </motion.span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
      </div>
      <button
        onClick={onComplete}
        className="absolute bottom-8 right-8 hud-label hover:text-reso transition-colors"
      >
        [ SKIP → ]
      </button>
    </motion.div>
  );
}
