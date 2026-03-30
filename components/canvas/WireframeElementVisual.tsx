"use client";

import type { WireframeElementRow } from "@/lib/types";

/** Outline-first, low-chrome controls so the canvas reads as structure, not a visual mock. */
const mono =
  "font-mono text-[13px] tabular-nums tracking-tight text-stone-800 placeholder:text-stone-400";

export function WireframeElementVisual({
  row,
  onLabelChange,
  onLabelFocus,
}: {
  row: WireframeElementRow;
  onLabelChange: (v: string) => void;
  onLabelFocus?: () => void;
}) {
  const v = row.label;

  switch (row.element_type) {
    case "Section":
      return (
        <div className="flex h-full w-full flex-col border-2 border-dashed border-stone-500/80 bg-stone-50/40 p-2">
          <span className="shrink-0 font-mono text-[10px] font-medium uppercase tracking-wider text-stone-500">
            Section
          </span>
          <textarea
            data-no-drag
            className={`min-h-0 flex-1 resize-none bg-transparent ${mono} text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-0`}
            placeholder="Region / grouping · what lives here"
            value={v}
            onChange={(e) => onLabelChange(e.target.value)}
            onFocus={onLabelFocus}
          />
        </div>
      );

    case "Heading":
      return (
        <div className="flex h-full w-full flex-col justify-center border-b-2 border-stone-700/90 px-0.5 pb-1">
          <input
            data-no-drag
            className={`h-full w-full bg-transparent ${mono} font-semibold focus:outline-none focus:ring-0`}
            placeholder="H1 · section title"
            value={v}
            onChange={(e) => onLabelChange(e.target.value)}
            onFocus={onLabelFocus}
          />
        </div>
      );

    case "Body text":
      return (
        <textarea
          data-no-drag
          className={`h-full w-full resize-none border border-dashed border-stone-400/70 bg-stone-50/50 p-2 ${mono} leading-snug text-stone-700 focus:outline-none focus:border-stone-500 focus:ring-0`}
          placeholder="Paragraph / bullets…"
          value={v}
          onChange={(e) => onLabelChange(e.target.value)}
          onFocus={onLabelFocus}
        />
      );

    case "Image":
      return (
        <div className="flex h-full w-full flex-col overflow-hidden rounded border-2 border-dashed border-stone-400 bg-[repeating-linear-gradient(45deg,transparent,transparent_7px,rgba(120,113,108,0.07)_7px,rgba(120,113,108,0.07)_8px)]">
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-1 text-stone-500">
              <div className="h-10 w-14 border-2 border-stone-400" />
              <span className="text-[10px] font-mono uppercase tracking-wider">IMG</span>
            </div>
          </div>
          <input
            data-no-drag
            className="shrink-0 border-t-2 border-dashed border-stone-300 bg-white/90 px-2 py-1 text-[11px] font-mono text-stone-600 placeholder:text-stone-400 focus:outline-none focus:ring-0"
            placeholder="caption · alt"
            value={v}
            onChange={(e) => onLabelChange(e.target.value)}
            onFocus={onLabelFocus}
          />
        </div>
      );

    case "Primary button":
      return (
        <div className="flex h-full w-full items-stretch p-1">
          <div className="flex min-h-[32px] w-full items-center justify-center rounded border-[3px] border-stone-800 bg-stone-100 px-2">
            <input
              data-no-drag
              className={`w-full min-w-0 bg-transparent text-center text-[13px] font-semibold text-stone-900 focus:outline-none focus:ring-0`}
              placeholder="primary"
              value={v}
              onChange={(e) => onLabelChange(e.target.value)}
              onFocus={onLabelFocus}
            />
          </div>
        </div>
      );

    case "Secondary button":
      return (
        <div className="flex h-full w-full items-stretch p-1">
          <div className="flex min-h-[32px] w-full items-center justify-center rounded border-2 border-dashed border-stone-500 bg-transparent px-2">
            <input
              data-no-drag
              className={`w-full min-w-0 bg-transparent text-center text-[13px] font-medium text-stone-800 focus:outline-none focus:ring-0`}
              placeholder="secondary"
              value={v}
              onChange={(e) => onLabelChange(e.target.value)}
              onFocus={onLabelFocus}
            />
          </div>
        </div>
      );

    case "Input":
      return (
        <div className="flex h-full w-full items-center px-0.5 py-0.5">
          <div
            className={`flex h-full min-h-[34px] w-full items-center rounded-sm border border-stone-500 bg-white px-2 ${mono}`}
          >
            <span className="mr-1.5 shrink-0 text-stone-400" aria-hidden>
              |
            </span>
            <input
              data-no-drag
              className="min-w-0 flex-1 bg-transparent text-[13px] focus:outline-none focus:ring-0"
              placeholder="field label / placeholder"
              value={v}
              onChange={(e) => onLabelChange(e.target.value)}
              onFocus={onLabelFocus}
            />
          </div>
        </div>
      );

    case "List":
      return (
        <div className="flex h-full w-full flex-col gap-1 overflow-hidden border border-stone-400/80 bg-white p-2">
          <input
            data-no-drag
            className="shrink-0 border-b border-stone-300 bg-transparent text-[11px] font-semibold uppercase tracking-wide text-stone-600 placeholder:text-stone-400 focus:outline-none"
            placeholder="List · group title"
            value={v}
            onChange={(e) => onLabelChange(e.target.value)}
            onFocus={onLabelFocus}
          />
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-2.5">
            {[88, 72, 60].map((pct, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="shrink-0 font-mono text-xs text-stone-500" aria-hidden>
                  ○
                </span>
                <div className="h-1.5 border border-stone-300 bg-stone-100" style={{ width: `${pct}%` }} />
              </div>
            ))}
          </div>
        </div>
      );

    case "Divider":
      return (
        <div className="flex h-full w-full items-center px-1 py-1">
          <div className="h-0 w-full border-t-2 border-dotted border-stone-400" />
        </div>
      );

    case "Spacer":
      return (
        <div className="flex h-full w-full items-center justify-center rounded border border-dotted border-stone-400 bg-transparent">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">spacer</span>
        </div>
      );

    case "Custom":
    default:
      return (
        <div className="flex h-full w-full flex-col rounded border-2 border-amber-600/50 border-dashed bg-amber-50/30 p-2">
          <span className="shrink-0 text-[10px] font-mono font-medium uppercase tracking-wider text-amber-800/80">
            custom zone
          </span>
          <textarea
            data-no-drag
            className={`min-h-0 flex-1 resize-none bg-transparent text-[12px] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-0`}
            placeholder="Anything: carousel, chart, map…"
            value={v}
            onChange={(e) => onLabelChange(e.target.value)}
            onFocus={onLabelFocus}
          />
        </div>
      );
  }
}
