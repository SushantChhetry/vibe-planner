"use client";

import { useEffect, useRef } from "react";
import {
  Heading,
  LayoutGrid,
  LayoutPanelTop,
  LayoutTemplate,
  PanelBottom,
  PanelLeft,
  PanelTop,
  Sparkles,
} from "lucide-react";
import type { WireElementType } from "@/lib/types";

const PALETTE_ITEMS: { type: WireElementType; Icon: typeof Heading; description: string }[] = [
  { type: "Navbar", Icon: PanelTop, description: "Logo · nav links · CTA" },
  { type: "Hero", Icon: LayoutTemplate, description: "Above-the-fold banner" },
  { type: "Main content", Icon: LayoutGrid, description: "Feed · dashboard · article" },
  { type: "Section", Icon: LayoutPanelTop, description: "Feature block · cards · text" },
  { type: "Sidebar", Icon: PanelLeft, description: "Secondary column · filters" },
  { type: "Footer", Icon: PanelBottom, description: "Links · legal · meta" },
  { type: "Heading", Icon: Heading, description: "Page or section title" },
  { type: "Custom", Icon: Sparkles, description: "Carousel · chart · embed" },
];

export function SectionPalette({
  onPick,
  onClose,
}: {
  onPick: (type: WireElementType) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border-2 border-stone-800 bg-white shadow-[4px_4px_0_0_rgba(28,25,23,0.12)]"
      role="menu"
      aria-label="Add section"
    >
      <div className="border-b border-stone-100 px-3 py-2">
        <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-stone-500">
          Add section
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1 p-2">
        {PALETTE_ITEMS.map(({ type, Icon, description }) => (
          <button
            key={type}
            type="button"
            role="menuitem"
            className="flex items-start gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-left transition-colors hover:border-stone-400 hover:bg-white active:bg-stone-100"
            onClick={() => {
              onPick(type);
              onClose();
            }}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-stone-600" aria-hidden />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-stone-900">{type}</span>
              <span className="block truncate text-xs text-stone-500">{description}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
