"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PremiumBadge } from "@/components/billing/PremiumBadge";

export type CanvasLook = { dot: string; edge: string };

export const CANVAS_LOOK_DEFAULT: CanvasLook = {
  dot: "#c4c4c0",
  edge: "#a8a29e",
};

const PRESETS: (CanvasLook & { id: string; label: string })[] = [
  { id: "classic", label: "Classic", ...CANVAS_LOOK_DEFAULT },
  { id: "ocean", label: "Ocean", dot: "#5eead4", edge: "#0f766e" },
  { id: "sunset", label: "Sunset", dot: "#fbbf24", edge: "#b45309" },
];

export const CANVAS_APPEARANCE_STORAGE_KEY = "pumi-canvas-appearance";

export function readStoredCanvasLook(): CanvasLook | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CANVAS_APPEARANCE_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<CanvasLook>;
    if (
      typeof p.dot === "string" &&
      typeof p.edge === "string" &&
      p.dot &&
      p.edge
    ) {
      return { dot: p.dot, edge: p.edge };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function CanvasAppearancePicker({
  isPro,
  value,
  onChange,
  onPremiumClick,
}: {
  isPro: boolean;
  value: CanvasLook;
  onChange: (next: CanvasLook) => void;
  onPremiumClick: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative inline-flex shrink-0 items-center">
      <Button
        type="button"
        variant="outline"
        className="!gap-1.5 !py-1.5 !text-sm whitespace-nowrap"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => {
          if (!isPro) {
            onPremiumClick();
            return;
          }
          setOpen((v) => !v);
        }}
      >
        <Palette className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden min-[420px]:inline">Theme</span>
        {!isPro ? <PremiumBadge /> : null}
      </Button>
      {open && isPro ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-[120] mt-1 min-w-[10rem] rounded-md border border-stone-200 bg-white py-1 shadow-lg"
        >
          {PRESETS.map((p) => {
            const selected = p.dot === value.dot && p.edge === value.edge;
            return (
            <button
              key={p.id}
              type="button"
              role="menuitem"
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-800 hover:bg-stone-50 ${
                selected ? "bg-stone-100 font-medium" : ""
              }`}
              onClick={() => {
                onChange({ dot: p.dot, edge: p.edge });
                try {
                  localStorage.setItem(
                    CANVAS_APPEARANCE_STORAGE_KEY,
                    JSON.stringify({ dot: p.dot, edge: p.edge })
                  );
                } catch {
                  /* ignore */
                }
                setOpen(false);
              }}
            >
              <span
                className="h-3 w-3 rounded-full border border-stone-300"
                style={{ background: p.dot }}
                aria-hidden
              />
              {p.label}
            </button>
          );
          })}
        </div>
      ) : null}
    </div>
  );
}
