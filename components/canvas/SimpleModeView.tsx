"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { WireElementType, WireframeElementRow } from "@/lib/types";
import { WIRE_ELEMENT_TYPES } from "@/lib/types";
import { SectionPalette } from "@/components/canvas/SectionPalette";

// ─── Grid constants ──────────────────────────────────────────────────────────

export const SIMPLE_GRID = 32;
const MIN_BLOCK_H = SIMPLE_GRID * 2; // 64 px
const MIN_BLOCK_W = SIMPLE_GRID * 3; // 96 px
const ARTBOARD_BOTTOM_PAD = SIMPLE_GRID * 5; // 160 px breathing room below last block

// Heights are multiples of SIMPLE_GRID so they always snap cleanly
export const SIMPLE_MODE_DEFAULT_HEIGHTS: Partial<Record<string, number>> = {
  Navbar: 64,        // 2 rows
  Hero: 192,         // 6 rows
  "Main content": 256, // 8 rows
  Section: 160,      // 5 rows
  Sidebar: 256,      // 8 rows
  Footer: 96,        // 3 rows
  Heading: 64,       // 2 rows
  Custom: 128,       // 4 rows
  "Body text": 96,
  Image: 160,
  "Primary button": 64,
  "Secondary button": 64,
  Input: 64,
  List: 128,
  Divider: 32,
  Spacer: 64,
};

function snapG(n: number): number {
  return Math.round(n / SIMPLE_GRID) * SIMPLE_GRID;
}

// ─── Color system (matches WireframeElementVisual palette) ───────────────────

type BlockColors = { border: string; bg: string; text: string; stripe: string };

function blockColors(type: string): BlockColors {
  switch (type) {
    case "Navbar":
      return { border: "#818cf8", bg: "#eef2ff", text: "#3730a3", stripe: "#c7d2fe" };
    case "Hero":
      return { border: "#fbbf24", bg: "#fffbeb", text: "#92400e", stripe: "#fde68a" };
    case "Sidebar":
      return { border: "#38bdf8", bg: "#f0f9ff", text: "#075985", stripe: "#bae6fd" };
    case "Footer":
      return { border: "#a78bfa", bg: "#f5f3ff", text: "#5b21b6", stripe: "#ddd6fe" };
    case "Main content":
      return { border: "#2dd4bf", bg: "#f0fdfa", text: "#134e4a", stripe: "#99f6e4" };
    case "Section":
      return { border: "#94a3b8", bg: "#f8fafc", text: "#334155", stripe: "#e2e8f0" };
    default:
      return { border: "#a8a29e", bg: "#ffffff", text: "#44403c", stripe: "#e7e5e4" };
  }
}

// ─── Drag / resize state ─────────────────────────────────────────────────────

type DragState =
  | { kind: "move"; id: string; startX: number; startY: number; origX: number; origY: number }
  | { kind: "resize-s"; id: string; startY: number; origH: number }
  | { kind: "resize-e"; id: string; startX: number; origW: number }
  | { kind: "resize-se"; id: string; startX: number; startY: number; origW: number; origH: number };

// ─── Component ───────────────────────────────────────────────────────────────

export function SimpleModeView({
  blockId,
  elements,
  onChange,
  onHistoryCheckpoint,
  onSwitchToAdvanced,
}: {
  blockId: string;
  elements: WireframeElementRow[];
  onChange: (next: WireframeElementRow[]) => void;
  onHistoryCheckpoint?: () => void;
  onSwitchToAdvanced: () => void;
}) {
  const scrollHostRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  const dragRef = useRef<DragState | null>(null);
  const elementsRef = useRef(elements);
  const onChangeRef = useRef(onChange);
  const [paletteOpen, setPaletteOpen] = useState(false);
  /** Block whose label/notes panel is open — only via pencil (or new section), not on mere click/drag. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const inspectorRef = useRef<HTMLDivElement>(null);

  elementsRef.current = elements;
  onChangeRef.current = onChange;

  // ── Measure container width ──
  useEffect(() => {
    const el = scrollHostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerW(el.clientWidth));
    ro.observe(el);
    setContainerW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Keep the context panel visible when opening the editor (new content mounts above the artboard).
  useEffect(() => {
    if (!editingId) return;
    inspectorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editingId]);

  // ── Artboard dimensions ──
  // Leave 32 px margin on each side inside the scroll host
  const artboardW = containerW > 0 ? Math.max(320, snapG(containerW - 64)) : 0;

  const artboardH = useMemo(() => {
    if (elements.length === 0 || artboardW === 0) return SIMPLE_GRID * 14;
    const maxBottom = Math.max(...elements.map((e) => e.frame_y + e.frame_h));
    return Math.max(SIMPLE_GRID * 14, snapG(maxBottom) + ARTBOARD_BOTTOM_PAD);
  }, [elements, artboardW]);

  // ── Global pointer move / up ──
  useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;
      const els = elementsRef.current;

      if (d.kind === "move") {
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        onChangeRef.current(
          els.map((r) =>
            r.id !== d.id
              ? r
              : { ...r, frame_x: Math.max(0, snapG(d.origX + dx)), frame_y: Math.max(0, snapG(d.origY + dy)) }
          )
        );
        return;
      }

      if (d.kind === "resize-s") {
        const dy = e.clientY - d.startY;
        onChangeRef.current(
          els.map((r) =>
            r.id !== d.id ? r : { ...r, frame_h: Math.max(MIN_BLOCK_H, snapG(d.origH + dy)) }
          )
        );
        return;
      }

      if (d.kind === "resize-e") {
        const dx = e.clientX - d.startX;
        onChangeRef.current(
          els.map((r) =>
            r.id !== d.id ? r : { ...r, frame_w: Math.max(MIN_BLOCK_W, snapG(d.origW + dx)) }
          )
        );
        return;
      }

      if (d.kind === "resize-se") {
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        onChangeRef.current(
          els.map((r) =>
            r.id !== d.id
              ? r
              : {
                  ...r,
                  frame_w: Math.max(MIN_BLOCK_W, snapG(d.origW + dx)),
                  frame_h: Math.max(MIN_BLOCK_H, snapG(d.origH + dy)),
                }
          )
        );
      }
    }

    function onUp() {
      dragRef.current = null;
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  // ── Add section ──
  const addSection = useCallback(
    (type: WireElementType) => {
      if (artboardW === 0) return;
      onHistoryCheckpoint?.();
      const maxBottom =
        elements.length === 0 ? 0 : Math.max(...elements.map((e) => e.frame_y + e.frame_h));
      const y = elements.length === 0 ? 0 : snapG(maxBottom);
      const h = SIMPLE_MODE_DEFAULT_HEIGHTS[type] ?? 128;
      const newRow: WireframeElementRow = {
        id: crypto.randomUUID(),
        parent_block_id: blockId,
        element_type: type,
        label: "",
        sort_order: elements.length,
        created_at: new Date().toISOString(),
        frame_x: 0,
        frame_y: y,
        frame_w: artboardW,
        frame_h: h,
        meta: {},
      };
      onChange([...elements, newRow]);
      setEditingId(newRow.id);
      setPaletteOpen(false);
    },
    [blockId, elements, onChange, onHistoryCheckpoint, artboardW]
  );

  const removeRow = useCallback(
    (id: string) => {
      onHistoryCheckpoint?.();
      onChange(elements.filter((r) => r.id !== id));
      setEditingId((prev) => (prev === id ? null : prev));
    },
    [elements, onChange, onHistoryCheckpoint]
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      ref={scrollHostRef}
      className="flex min-h-0 flex-1 flex-col overflow-auto"
      style={{ backgroundColor: "#ebeae6" }}
    >
      {artboardW > 0 && (
        <div className="flex flex-col items-center px-8 py-6">
          {/* ── Inspector: above canvas + sticky so context isn’t buried below a tall artboard ── */}
          {editingId && (() => {
            const row = elements.find((r) => r.id === editingId);
            if (!row) return null;
            const c = blockColors(row.element_type);
            return (
              <div
                ref={inspectorRef}
                className="sticky top-0 z-30 -mx-1 mb-4 shrink-0 rounded-xl border-2 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
                style={{ width: artboardW, borderColor: c.border }}
              >
                <div
                  className="flex items-center gap-2 rounded-t-[0.65rem] px-4 py-2.5"
                  style={{ backgroundColor: c.stripe }}
                >
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider" style={{ color: c.text }}>
                    {row.element_type}
                  </span>
                  <select
                    className="ml-1 rounded border border-stone-300 bg-white px-1.5 py-0.5 text-xs text-stone-700 shadow-sm"
                    value={row.element_type}
                    onChange={(e) => {
                      onHistoryCheckpoint?.();
                      onChange(
                        elements.map((r) =>
                          r.id === row.id ? { ...r, element_type: e.target.value as WireElementType } : r
                        )
                      );
                    }}
                  >
                    {WIRE_ELEMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="ml-auto rounded p-0.5 text-stone-400 hover:text-stone-600"
                    onClick={() => setEditingId(null)}
                    aria-label="Close"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] font-medium uppercase tracking-wide text-stone-500">
                      Label
                    </span>
                    <input
                      type="text"
                      className="rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-300"
                      placeholder={`e.g. "Main navigation"`}
                      value={row.label}
                      onFocus={onHistoryCheckpoint}
                      onChange={(e) =>
                        onChange(elements.map((r) => (r.id === row.id ? { ...r, label: e.target.value } : r)))
                      }
                    />
                    <span className="text-[11px] text-stone-400">Short name shown on the block</span>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] font-medium uppercase tracking-wide text-stone-500">
                      Notes
                    </span>
                    <textarea
                      className="min-h-[5rem] resize-y rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-300 sm:min-h-[4.5rem]"
                      placeholder={`What should this ${row.element_type.toLowerCase()} contain or do?`}
                      value={row.meta?.notes ?? ""}
                      onFocus={onHistoryCheckpoint}
                      onChange={(e) =>
                        onChange(
                          elements.map((r) =>
                            r.id === row.id ? { ...r, meta: { ...r.meta, notes: e.target.value } } : r
                          )
                        )
                      }
                    />
                    <span className="text-[11px] text-stone-400">Context for Cursor / Claude Code</span>
                  </label>
                </div>
              </div>
            );
          })()}

          {/* ── Artboard ── */}
          <div
            className="relative bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
            onClick={() => setEditingId(null)}
            style={{
              width: artboardW,
              height: artboardH,
              // Visible 32 px grid
              backgroundImage: [
                // minor lines every 32 px
                "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)",
                "linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
                // major lines every 128 px (4 × SIMPLE_GRID)
                "linear-gradient(rgba(0,0,0,0.07) 1px, transparent 1px)",
                "linear-gradient(90deg, rgba(0,0,0,0.07) 1px, transparent 1px)",
              ].join(", "),
              backgroundSize: [
                `${SIMPLE_GRID}px ${SIMPLE_GRID}px`,
                `${SIMPLE_GRID}px ${SIMPLE_GRID}px`,
                `${SIMPLE_GRID * 4}px ${SIMPLE_GRID * 4}px`,
                `${SIMPLE_GRID * 4}px ${SIMPLE_GRID * 4}px`,
              ].join(", "),
            }}
          >
            {/* Empty state */}
            {elements.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2">
                <p className="font-mono text-xs uppercase tracking-widest text-stone-400">
                  Empty canvas
                </p>
                <p className="text-sm text-stone-400">
                  Click <strong>+ Add section</strong> below to start
                </p>
              </div>
            )}

            {/* Blocks */}
            {elements.map((row) => {
              const c = blockColors(row.element_type);
              const isEditing = editingId === row.id;

              return (
                <div
                  key={row.id}
                  className="group absolute"
                  style={{
                    left: row.frame_x,
                    top: row.frame_y,
                    width: row.frame_w,
                    height: row.frame_h,
                    backgroundColor: c.bg,
                    border: isEditing ? `2px solid ${c.border}` : `2px solid ${c.border}99`,
                    boxSizing: "border-box",
                    outline: isEditing ? `3px solid ${c.border}55` : undefined,
                    outlineOffset: isEditing ? "2px" : undefined,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* ── Drag bar (top strip) ── */}
                  <div
                    className="absolute left-0 right-0 top-0 z-10 flex h-7 cursor-grab select-none items-center gap-2 px-2 active:cursor-grabbing"
                    style={{ backgroundColor: c.stripe }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      onHistoryCheckpoint?.();
                      dragRef.current = {
                        kind: "move",
                        id: row.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        origX: row.frame_x,
                        origY: row.frame_y,
                      };
                    }}
                  >
                    {/* Grip dots */}
                    <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0 opacity-40" aria-hidden>
                      {[0, 4].map((cx) =>
                        [0, 4, 8].map((cy) => (
                          <circle key={`${cx}-${cy}`} cx={cx + 1} cy={cy + 1} r="1" fill={c.text} />
                        ))
                      )}
                    </svg>
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.text }}>
                      {row.element_type}
                    </span>
                    <div className="ml-auto flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        className="rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
                        style={{ color: c.text }}
                        title="Edit label & notes"
                        aria-label={`Edit ${row.element_type}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(row.id);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ color: c.text }}
                        title={`Remove ${row.element_type}`}
                        onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>

                  {/* ── Block body: show label + notes preview ── */}
                  <div className="absolute bottom-3 left-0 right-3 top-7 flex flex-col items-center justify-center gap-1 overflow-hidden px-4">
                    {row.label ? (
                      <p className="max-w-full truncate text-center text-sm font-medium leading-snug" style={{ color: c.text }}>
                        {row.label}
                      </p>
                    ) : (
                      <p className="flex items-center justify-center gap-1.5 text-center text-sm" style={{ color: `${c.text}50` }}>
                        <Pencil className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                        <span>Use the bar above to edit</span>
                      </p>
                    )}
                    {row.meta?.notes && (
                      <p className="line-clamp-2 max-w-full text-center text-xs leading-snug" style={{ color: `${c.text}80` }}>
                        {row.meta.notes}
                      </p>
                    )}
                  </div>

                  {/* ── Resize handle – bottom edge ── */}
                  <div
                    className="absolute bottom-0 left-8 right-8 h-3 cursor-ns-resize"
                    title="Drag to resize height"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onHistoryCheckpoint?.();
                      dragRef.current = {
                        kind: "resize-s",
                        id: row.id,
                        startY: e.clientY,
                        origH: row.frame_h,
                      };
                    }}
                  >
                    {/* Visible pip */}
                    <div
                      className="mx-auto mt-1 h-1 w-8 rounded-full opacity-40"
                      style={{ backgroundColor: c.border }}
                    />
                  </div>

                  {/* ── Resize handle – right edge ── */}
                  <div
                    className="absolute bottom-8 right-0 top-7 w-3 cursor-ew-resize"
                    title="Drag to resize width"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onHistoryCheckpoint?.();
                      dragRef.current = {
                        kind: "resize-e",
                        id: row.id,
                        startX: e.clientX,
                        origW: row.frame_w,
                      };
                    }}
                  >
                    <div
                      className="ml-1 mt-auto inline-block h-8 w-1 rounded-full opacity-40"
                      style={{ backgroundColor: c.border, position: "absolute", top: "50%", transform: "translateY(-50%)" }}
                    />
                  </div>

                  {/* ── Resize handle – bottom-right corner ── */}
                  <div
                    className="absolute bottom-0 right-0 h-5 w-5 cursor-nwse-resize"
                    title="Drag to resize"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onHistoryCheckpoint?.();
                      dragRef.current = {
                        kind: "resize-se",
                        id: row.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        origW: row.frame_w,
                        origH: row.frame_h,
                      };
                    }}
                  >
                    {/* L-shaped corner pip */}
                    <svg width="12" height="12" viewBox="0 0 12 12" className="absolute bottom-1 right-1 opacity-50" aria-hidden>
                      <path d="M2 10 L10 10 L10 2" stroke={c.border} strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Add section button ── */}
          <div className="relative mt-4 flex justify-center" style={{ width: artboardW }}>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border-2 border-stone-700 bg-white px-5 py-2.5 font-mono text-sm font-medium text-stone-800 shadow-[3px_3px_0_0_rgba(28,25,23,0.15)] hover:bg-stone-50 active:translate-x-px active:translate-y-px active:shadow-[2px_2px_0_0_rgba(28,25,23,0.15)]"
              onClick={() => setPaletteOpen((o) => !o)}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              Add section
            </button>
            {paletteOpen && (
              <SectionPalette onPick={addSection} onClose={() => setPaletteOpen(false)} />
            )}
          </div>

          {/* ── Switch hint ── */}
          <p className="mt-5 text-center text-xs text-stone-400">
            Need free-form positioning or more element types?{" "}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-stone-600"
              onClick={onSwitchToAdvanced}
            >
              Switch to Advanced
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
