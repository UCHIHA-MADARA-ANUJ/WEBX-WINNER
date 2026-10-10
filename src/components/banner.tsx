"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * BANNER — every restructure explained in plain English.
 * The headline types itself in. Drama, never mystery.
 */

export type BannerData = {
  key: number;
  kicker: string;
  headline: string;
  sub: string;
  glyph: string;
};

export function Banner({ data, onDone }: { data: BannerData | null; onDone: () => void }) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!data) return;
    setTyped("");
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setTyped(data.headline.slice(0, i));
      if (i >= data.headline.length) clearInterval(t);
    }, 11);
    const out = setTimeout(onDone, 5600);
    return () => {
      clearInterval(t);
      clearTimeout(out);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.key]);

  return (
    <div className="fixed z-[85] bottom-6 left-1/2 -translate-x-1/2 w-[min(640px,calc(100vw-32px))] pointer-events-none">
      <AnimatePresence>
        {data && (
          <motion.div
            key={data.key}
            initial={{ opacity: 0, y: 36, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="relative overflow-hidden border border-shock/50 bg-black/90 backdrop-blur-xl px-6 py-5 shadow-[0_0_60px_-12px_rgba(255,0,85,0.55)] flex gap-4 items-start"
          >
            <div className="text-2xl text-shock drop-shadow-[0_0_14px_rgba(255,0,85,0.9)]">{data.glyph}</div>
            <div>
              <div className="hud-label !text-shock !tracking-[0.34em] mb-1.5">{data.kicker}</div>
              <div className="font-display text-base sm:text-lg text-white leading-snug">
                {typed}
                {typed.length < data.headline.length && <span className="banner-type-caret" />}
              </div>
              <div className="hud-label mt-1.5">{data.sub}</div>
            </div>
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(105deg,transparent_30%,rgba(255,0,85,0.12)_50%,transparent_70%)] animate-[wave-sweep_1.2s_ease-out_1]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
