"use client";

import { useEffect, useRef } from "react";

export function SitemapContextMenu({
  x,
  y,
  onClose,
  onAddPage,
}: {
  x: number;
  y: number;
  onClose: () => void;
  onAddPage: () => void;
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
      className="fixed z-50 w-56 rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
      style={{ left: x, top: y }}
    >
      <p className="px-3 py-2 text-xs font-medium text-stone-500">Site map</p>
      <button
        type="button"
        role="menuitem"
        className="block w-full px-3 py-2 text-left text-sm text-stone-800 hover:bg-stone-50"
        onClick={() => {
          onAddPage();
          onClose();
        }}
      >
        Add page…
      </button>
    </div>
  );
}
