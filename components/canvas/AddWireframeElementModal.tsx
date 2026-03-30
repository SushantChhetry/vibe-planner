"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import type { WireElementType } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export type WireframeAddOption = {
  type: WireElementType;
  description: string;
  Icon: LucideIcon;
};

export function AddWireframeElementModal({
  open,
  onClose,
  onPick,
  options,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (t: WireElementType) => void;
  options: WireframeAddOption[];
}) {
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const listId = `${dialogId}-list`;
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.type.toLowerCase().includes(q) || o.description.toLowerCase().includes(q)
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const t = window.setTimeout(() => searchRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[min(85dvh,32rem)] w-full max-w-md flex-col overflow-hidden rounded-xl border-2 border-stone-800 bg-[#fafaf9] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.35)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-stone-200 bg-white px-4 pb-3 pt-4">
          <h2
            id={titleId}
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500"
          >
            Add element
          </h2>
          <p className="mt-1 text-sm text-stone-700">
            Search by name or description, then choose a block for the artboard.
          </p>
          <label className="relative mt-3 block">
            <span className="sr-only">Search elements</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden
            />
            <input
              ref={searchRef}
              type="search"
              autoComplete="off"
              spellCheck={false}
              id={`${dialogId}-search`}
              className="w-full rounded-lg border border-stone-300 bg-stone-50 py-2.5 pl-10 pr-3 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-500 focus:bg-white focus:ring-2 focus:ring-stone-400"
              placeholder="e.g. button, hero, form…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-controls={listId}
            />
          </label>
        </div>

        <ul
          id={listId}
          className="min-h-0 flex-1 list-none overflow-y-auto overscroll-contain px-2 py-2 [scrollbar-width:thin]"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-stone-500">
              {query.trim()
                ? `No elements match “${query.trim()}”. Try another word.`
                : "No elements available."}
            </li>
          ) : (
            filtered.map((o) => {
              const { Icon } = o;
              return (
                <li key={o.type}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left text-stone-900 transition-colors hover:bg-stone-200/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9]"
                    onClick={() => onPick(o.type)}
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 shadow-sm">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-stone-900">{o.type}</span>
                      <span className="block text-xs leading-snug text-stone-600">{o.description}</span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="border-t border-stone-200 bg-white px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            className="!text-stone-700"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
