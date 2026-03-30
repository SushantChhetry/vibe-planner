"use client";

import { useEffect, useRef } from "react";
import { BLOCK_TYPES, type BlockType } from "@/lib/types";

export function ContextMenu({
  x,
  y,
  onPick,
  onClose,
}: {
  x: number;
  y: number;
  onPick: (type: BlockType) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 max-h-[min(320px,70vh)] w-56 overflow-y-auto rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
      style={{ left: x, top: y }}
    >
      <p className="px-3 py-2 text-xs font-medium text-stone-500">Add layout block</p>
      <p className="px-3 pb-1 text-[11px] leading-snug text-stone-400">
        Navbar, hero, form… Headings & buttons live inside a block.
      </p>
      {BLOCK_TYPES.map((t) => (
        <button
          key={t}
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left text-sm text-stone-800 hover:bg-stone-50"
          onClick={() => {
            onPick(t);
            onClose();
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
