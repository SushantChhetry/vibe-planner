"use client";

import { useEffect, useRef, useState } from "react";

const BLOCKS = [
  "col-span-4 row-span-1 h-14 rounded-lg border border-dashed border-stone-300/90 bg-stone-50/80",
  "col-span-2 h-14 rounded-lg border border-stone-200 bg-white",
  "col-span-3 h-24 rounded-lg border border-stone-200 bg-white shadow-sm",
  "col-span-3 h-24 rounded-lg border border-stone-200 bg-white/90",
  "col-span-2 h-16 rounded-lg border border-stone-200 bg-stone-50/90",
  "col-span-4 h-16 rounded-lg border border-dashed border-teal-700/25 bg-teal-50/40",
  "col-span-5 h-20 rounded-lg border border-stone-200 bg-white",
  "col-span-3 h-20 rounded-lg border border-stone-200/90 bg-stone-50/70",
] as const;

/** Keep in sync with `animate-canvas-block-place` duration in tailwind.config.ts */
const PLACE_DURATION_MS = 720;
const STAGGER_MS = 68;
const PAUSE_AFTER_PLACE_MS = 2100;
const EXIT_MS = 360;

function placeSequenceEndMs() {
  return (BLOCKS.length - 1) * STAGGER_MS + PLACE_DURATION_MS;
}

export function AbstractCanvasPreview() {
  const [loopKey, setLoopKey] = useState(0);
  const [exiting, setExiting] = useState(false);
  const exitTimeoutRef = useRef<number | null>(null);
  const loopTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const scheduleLoop = () => {
      loopTimeoutRef.current = window.setTimeout(() => {
        setExiting(true);
        exitTimeoutRef.current = window.setTimeout(() => {
          setLoopKey((k) => k + 1);
          setExiting(false);
          scheduleLoop();
        }, EXIT_MS);
      }, placeSequenceEndMs() + PAUSE_AFTER_PLACE_MS);
    };

    scheduleLoop();

    return () => {
      if (loopTimeoutRef.current) window.clearTimeout(loopTimeoutRef.current);
      if (exitTimeoutRef.current) window.clearTimeout(exitTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <div
        className={`relative transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.33,1,0.53,1)] motion-reduce:transition-none ${
          exiting ? "scale-[0.985] opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] motion-reduce:opacity-25 [background-image:radial-gradient(rgb(168_162_158/0.45)_1px,transparent_1px)] [background-size:12px_12px] [mask-image:linear-gradient(to_bottom,black_40%,transparent)]"
        />
        <div
          key={loopKey}
          className="relative grid grid-cols-6 gap-2 sm:grid-cols-8 sm:gap-2.5"
        >
          {BLOCKS.map((cls, i) => (
            <div
              key={i}
              className={`${cls} motion-reduce:animate-none animate-canvas-block-place`}
              style={{ animationDelay: `${i * STAGGER_MS}ms` }}
            />
          ))}
        </div>
      </div>
      <p className="relative mt-6 text-center text-xs font-medium uppercase tracking-wider text-stone-500">
        Abstract canvas preview
      </p>
    </>
  );
}
