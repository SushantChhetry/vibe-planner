"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignLeft,
  AlignVerticalSpaceBetween,
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Heading,
  Image as ImageIcon,
  LayoutPanelTop,
  LayoutGrid,
  LayoutTemplate,
  List,
  Maximize2,
  Minus,
  MousePointerClick,
  PanelBottom,
  PanelLeft,
  PanelTop,
  Plus,
  Sparkles,
  Square,
  TextCursorInput,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AddWireframeElementModal } from "@/components/canvas/AddWireframeElementModal";
import { WireframeElementVisual } from "@/components/canvas/WireframeElementVisual";
import {
  WIRE_ELEMENT_TYPES,
  type WireElementType,
  type WireframeElementMeta,
  type WireframeElementRow,
} from "@/lib/types";

const FORM_INPUT_TYPES = [
  "text",
  "email",
  "password",
  "number",
  "tel",
  "url",
  "textarea",
  "select",
  "checkbox",
  "radio",
  "date",
  "file",
  "hidden",
] as const;

const VIEWPORT_PRESETS = [
  /** iPhone-class width + tall portrait canvas so the board reads as a phone. */
  { id: "mobile", label: "Mobile", width: 390, minHeight: 844, frame: "phone" as const },
  { id: "tablet", label: "Tablet", width: 768, minHeight: 1024, frame: "tablet" as const },
  { id: "desktop", label: "Desktop", width: 1280, minHeight: 720, frame: "none" as const },
  { id: "fluid", label: "Fluid", width: null, minHeight: null, frame: "none" as const },
] as const;

type ViewportPresetId = (typeof VIEWPORT_PRESETS)[number]["id"];

/** Chrome around the artboard for device presets (not scaled). */
function DeviceFrame({
  frame,
  children,
}: {
  frame: "none" | "phone" | "tablet";
  children: ReactNode;
}) {
  if (frame === "none") return <>{children}</>;

  if (frame === "phone") {
    return (
      <div className="mx-auto w-max rounded-[2.25rem] border-[10px] border-stone-900 bg-stone-900 p-1 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)] ring-1 ring-stone-700/50">
        <div className="relative rounded-[1.85rem] bg-stone-900 px-2 pb-2 pt-7">
          <div
            className="absolute left-1/2 top-2.5 h-1 w-14 -translate-x-1/2 rounded-full bg-stone-700"
            aria-hidden
          />
          <div
            className="absolute left-1/2 top-[1.35rem] h-3.5 w-3.5 -translate-x-1/2 rounded-full border border-stone-600 bg-stone-800"
            aria-hidden
          />
          <div className="overflow-hidden rounded-t-[0.35rem] rounded-b-[1.2rem] bg-white">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-max rounded-[1.35rem] border-[8px] border-stone-900 bg-stone-900 p-1.5 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.4)] ring-1 ring-stone-700/40">
      <div className="rounded-xl bg-stone-800 p-1">
        <div className="overflow-hidden rounded-lg bg-white">{children}</div>
      </div>
    </div>
  );
}

const ELEMENT_PALETTE: Record<
  WireElementType,
  { description: string; Icon: typeof Heading }
> = {
  Heading: { description: "Page or section title", Icon: Heading },
  Section: { description: "Grouped content region", Icon: LayoutPanelTop },
  Navbar: { description: "Top bar · logo · nav links", Icon: PanelTop },
  Hero: { description: "Above-the-fold banner / headline area", Icon: LayoutTemplate },
  Sidebar: { description: "Secondary column · filters · nav", Icon: PanelLeft },
  Footer: { description: "Bottom links · legal · meta", Icon: PanelBottom },
  "Main content": {
    description: "Primary column · feed · article body",
    Icon: LayoutGrid,
  },
  "Body text": { description: "Paragraph or bullets", Icon: AlignLeft },
  Image: { description: "Photo, illustration, media", Icon: ImageIcon },
  "Primary button": { description: "Main call to action", Icon: MousePointerClick },
  "Secondary button": { description: "Alternate action", Icon: Square },
  Input: { description: "Form field", Icon: TextCursorInput },
  List: { description: "Nav links or bullet list", Icon: List },
  Divider: { description: "Horizontal rule", Icon: Minus },
  Spacer: { description: "Vertical rhythm / gap", Icon: AlignVerticalSpaceBetween },
  Custom: { description: "Carousel, chart, embed…", Icon: Sparkles },
};

/** One-click toolbar; modal covers the rest. */
const QUICK_ADD_TYPES: WireElementType[] = [
  "Navbar",
  "Hero",
  "Sidebar",
  "Main content",
  "Footer",
  "Section",
  "Heading",
  "Primary button",
];

function shortTypeLabel(t: string): string {
  const map: Record<string, string> = {
    Heading: "H1",
    Section: "SEC",
    Navbar: "NAV",
    Hero: "HERO",
    Sidebar: "SIDE",
    Footer: "FTR",
    "Main content": "MAIN",
    "Body text": "BODY",
    Image: "IMG",
    "Primary button": "1°",
    "Secondary button": "2°",
    Input: "IN",
    List: "LIST",
    Divider: "—",
    Spacer: "GAP",
    Custom: "◇",
  };
  return map[t] ?? "?";
}

const MIN_W = 72;
const MIN_H = 36;
const ARTBOARD_PADDING = 120;
const GRID = 8;
const SNAP_GUIDE_PX = 6;
const FLUID_MAX_W = 2560;
const FLUID_MIN_W = 320;
const FLUID_MAX_H = 4096;
const FLUID_MIN_H = 400;
/** Horizontal padding inside scroll host (matches p-4). */
const HOST_PAD_X = 32;
const HOST_PAD_Y = 16;
const VIEWPORT_MIN_H_RATIO = 0.68;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;

function snap(n: number): number {
  return Math.round(n / GRID) * GRID;
}

/** Snap a coordinate to a nearby alignment line (artboard / other elements). */
function snapLineToGuides(
  val: number,
  candidates: number[],
  threshold = SNAP_GUIDE_PX
): { snapped: number; guide: number | null } {
  let best = snap(val);
  let bestD = threshold + 1;
  let guide: number | null = null;
  for (const c of candidates) {
    const d = Math.abs(val - c);
    if (d < bestD && d <= threshold) {
      bestD = d;
      best = snap(c);
      guide = c;
    }
  }
  return { snapped: best, guide };
}

function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));
}

function defaultFrameForType(t: WireElementType): { w: number; h: number } {
  switch (t) {
    case "Heading":
      return { w: 320, h: 44 };
    case "Section":
      return { w: 400, h: 160 };
    case "Navbar":
      return { w: 752, h: 56 };
    case "Hero":
      return { w: 752, h: 200 };
    case "Sidebar":
      return { w: 200, h: 400 };
    case "Footer":
      return { w: 752, h: 80 };
    case "Main content":
      return { w: 480, h: 320 };
    case "Body text":
      return { w: 380, h: 108 };
    case "Image":
      return { w: 280, h: 168 };
    case "Primary button":
    case "Secondary button":
      return { w: 136, h: 48 };
    case "Input":
      return { w: 280, h: 48 };
    case "List":
      return { w: 320, h: 128 };
    case "Divider":
      return { w: 400, h: 28 };
    case "Spacer":
      return { w: 200, h: 48 };
    case "Custom":
    default:
      return { w: 180, h: 72 };
  }
}

function nextDropPosition(elements: WireframeElementRow[]): { x: number; y: number } {
  if (elements.length === 0) return { x: GRID * 3, y: GRID * 3 };
  let maxBottom = 0;
  for (const e of elements) {
    maxBottom = Math.max(maxBottom, e.frame_y + e.frame_h);
  }
  return { x: GRID * 3, y: snap(maxBottom + GRID * 2) };
}

function createRow(
  blockId: string,
  element_type: WireElementType,
  elements: WireframeElementRow[]
): WireframeElementRow {
  const pos = nextDropPosition(elements);
  const { w, h } = defaultFrameForType(element_type);
  return {
    id: crypto.randomUUID(),
    parent_block_id: blockId,
    element_type,
    label: "",
    sort_order: elements.length,
    created_at: new Date().toISOString(),
    frame_x: pos.x,
    frame_y: pos.y,
    frame_w: w,
    frame_h: h,
    meta: {},
  };
}

function duplicateElement(row: WireframeElementRow, elements: WireframeElementRow[]): WireframeElementRow {
  return {
    ...row,
    id: crypto.randomUUID(),
    sort_order: elements.length,
    created_at: new Date().toISOString(),
    frame_x: snap(row.frame_x + GRID * 2),
    frame_y: snap(row.frame_y + GRID * 2),
    meta: row.meta ? { ...row.meta } : {},
  };
}

function createRowAt(
  blockId: string,
  element_type: WireElementType,
  elements: WireframeElementRow[],
  x: number,
  y: number
): WireframeElementRow {
  const { w, h } = defaultFrameForType(element_type);
  return {
    id: crypto.randomUUID(),
    parent_block_id: blockId,
    element_type,
    label: "",
    sort_order: elements.length,
    created_at: new Date().toISOString(),
    frame_x: Math.max(0, snap(x)),
    frame_y: Math.max(0, snap(y)),
    frame_w: w,
    frame_h: h,
    meta: {},
  };
}

function toggleSelectedId(ids: string[], id: string): string[] {
  if (ids.includes(id)) return ids.filter((x) => x !== id);
  return [...ids, id];
}

type ResizeEdge = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

type DragMode =
  | {
      id: string;
      kind: "move";
      ids: string[];
      startClientX: number;
      startClientY: number;
      ox: Record<string, { x: number; y: number }>;
    }
  | {
      id: string;
      kind: "resize";
      edge: ResizeEdge;
      startClientX: number;
      startClientY: number;
      ox: number;
      oy: number;
      ow: number;
      oh: number;
    };

function applyResize(
  ox: number,
  oy: number,
  ow: number,
  oh: number,
  rdx: number,
  rdy: number,
  edge: ResizeEdge
): { x: number; y: number; w: number; h: number } {
  let xVar = ox;
  let yVar = oy;
  let w = ow;
  let h = oh;

  switch (edge) {
    case "se":
      w = Math.max(MIN_W, snap(ow + rdx));
      h = Math.max(MIN_H, snap(oh + rdy));
      break;
    case "s":
      h = Math.max(MIN_H, snap(oh + rdy));
      break;
    case "e":
      w = Math.max(MIN_W, snap(ow + rdx));
      break;
    case "n": {
      const nh = Math.max(MIN_H, snap(oh - rdy));
      yVar = oy + oh - nh;
      h = nh;
      break;
    }
    case "w": {
      const nw = Math.max(MIN_W, snap(ow - rdx));
      xVar = ox + ow - nw;
      w = nw;
      break;
    }
    case "ne": {
      w = Math.max(MIN_W, snap(ow + rdx));
      const nh = Math.max(MIN_H, snap(oh - rdy));
      yVar = oy + oh - nh;
      h = nh;
      break;
    }
    case "nw": {
      const nw = Math.max(MIN_W, snap(ow - rdx));
      xVar = ox + ow - nw;
      w = nw;
      const nh = Math.max(MIN_H, snap(oh - rdy));
      yVar = oy + oh - nh;
      h = nh;
      break;
    }
    case "sw": {
      const nw = Math.max(MIN_W, snap(ow - rdx));
      xVar = ox + ow - nw;
      w = nw;
      h = Math.max(MIN_H, snap(oh + rdy));
      break;
    }
  }

  return { x: xVar, y: yVar, w, h };
}

export function WireframeEditor({
  blockId,
  blockName,
  elements,
  onChange,
  onBack,
  onOpenExport,
  onHistoryCheckpoint,
  pageOptions = [],
  pageSurface = false,
}: {
  blockId: string;
  blockName: string;
  elements: WireframeElementRow[];
  onChange: (next: WireframeElementRow[]) => void;
  onBack: () => void;
  onOpenExport?: () => void;
  onHistoryCheckpoint?: () => void;
  pageOptions?: { id: string; name: string }[];
  pageSurface?: boolean;
}) {
  const [selectionIds, setSelectionIds] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [viewportId, setViewportId] = useState<ViewportPresetId>("fluid");
  const [fluidSizeMode, setFluidSizeMode] = useState<"fit" | "custom">("fit");
  const [fluidCustomW, setFluidCustomW] = useState(1200);
  const [fluidCustomH, setFluidCustomH] = useState(800);
  const [zoom, setZoomState] = useState(1);
  const [hostRect, setHostRect] = useState({ w: 0, h: 0 });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [marquee, setMarquee] = useState<{
    artX0: number;
    artY0: number;
    artX1: number;
    artY1: number;
  } | null>(null);
  const [snapGuides, setSnapGuides] = useState<{ vx?: number; hy?: number }>({});
  const lastFitArtboardRef = useRef({ w: 1200, h: 800 });
  const lastUsedTypeRef = useRef<WireElementType>("Section");
  const artboardInnerRef = useRef<HTMLDivElement | null>(null);
  const marqueeLiveRef = useRef<{
    artX0: number;
    artY0: number;
    artX1: number;
    artY1: number;
  } | null>(null);

  const dragRef = useRef<DragMode | null>(null);
  const elementsRef = useRef(elements);
  const onChangeRef = useRef(onChange);
  const selectionIdsRef = useRef<string[]>([]);
  const zoomRef = useRef(zoom);
  const artboardSizeRef = useRef({ width: 1200, height: 800 });
  const scrollHostRef = useRef<HTMLDivElement | null>(null);

  elementsRef.current = elements;
  onChangeRef.current = onChange;
  selectionIdsRef.current = selectionIds;
  zoomRef.current = zoom;

  const setZoom = useCallback((z: number | ((prev: number) => number)) => {
    setZoomState((prev) => {
      const next = typeof z === "function" ? z(prev) : z;
      return clampZoom(next);
    });
  }, []);

  const activePreset = VIEWPORT_PRESETS.find((p) => p.id === viewportId)!;
  const presetWidth = activePreset.width;
  const presetMinHeight = activePreset.minHeight;

  const contentBounds = useMemo(() => {
    let w = presetWidth ?? 880;
    let h = presetMinHeight ?? 520;
    for (const e of elements) {
      w = Math.max(w, e.frame_x + e.frame_w + ARTBOARD_PADDING);
      h = Math.max(h, e.frame_y + e.frame_h + ARTBOARD_PADDING);
    }
    if (presetWidth != null) w = Math.max(presetWidth, w);
    return { width: w, height: h };
  }, [elements, presetWidth, presetMinHeight]);

  const fitFluidArtboard = useMemo(() => {
    const hostW = hostRect.w;
    const hostH = hostRect.h;
    if (hostW <= 0) {
      return contentBounds;
    }
    const usableW = Math.max(0, hostW - HOST_PAD_X);
    const usableH = Math.max(0, hostH - HOST_PAD_Y);
    const fluidW = Math.min(
      FLUID_MAX_W,
      Math.max(FLUID_MIN_W, usableW, contentBounds.width)
    );
    const minHFromView = Math.max(520, Math.floor(usableH * VIEWPORT_MIN_H_RATIO));
    const fluidH = Math.max(minHFromView, contentBounds.height);
    return { width: fluidW, height: fluidH };
  }, [contentBounds, hostRect.w, hostRect.h]);

  useEffect(() => {
    if (viewportId === "fluid" && fluidSizeMode === "fit" && hostRect.w > 0) {
      lastFitArtboardRef.current = {
        w: fitFluidArtboard.width,
        h: fitFluidArtboard.height,
      };
    }
  }, [viewportId, fluidSizeMode, fitFluidArtboard.width, fitFluidArtboard.height, hostRect.w]);

  const artboardSize = useMemo(() => {
    if (presetWidth != null) {
      return contentBounds;
    }
    if (fluidSizeMode === "custom") {
      const w = Math.min(
        FLUID_MAX_W,
        Math.max(FLUID_MIN_W, fluidCustomW, contentBounds.width)
      );
      const h = Math.min(
        FLUID_MAX_H,
        Math.max(FLUID_MIN_H, fluidCustomH, contentBounds.height)
      );
      return { width: w, height: h };
    }
    return fitFluidArtboard;
  }, [
    presetWidth,
    contentBounds,
    fluidSizeMode,
    fluidCustomW,
    fluidCustomH,
    fitFluidArtboard,
  ]);

  useEffect(() => {
    artboardSizeRef.current = artboardSize;
  }, [artboardSize]);

  const primarySelectedId = selectionIds.length
    ? selectionIds[selectionIds.length - 1]
    : null;
  const selectedRow = primarySelectedId
    ? elements.find((r) => r.id === primarySelectedId)
    : undefined;

  const clientToArtboard = useCallback((clientX: number, clientY: number) => {
    const el = artboardInnerRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const z = zoomRef.current || 1;
    return {
      x: (clientX - r.left) / z,
      y: (clientY - r.top) / z,
    };
  }, []);

  useEffect(() => {
    const el = scrollHostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setHostRect({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setHostRect({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const fitZoom = useCallback(() => {
    const usable = Math.max(0, hostRect.w - HOST_PAD_X);
    if (usable <= 0 || artboardSize.width <= 0) return;
    setZoom(usable / artboardSize.width);
  }, [hostRect.w, artboardSize.width, setZoom]);

  const atMinZoom = zoom <= ZOOM_MIN;
  const atMaxZoom = zoom >= ZOOM_MAX;

  const openAddModal = useCallback(() => setAddModalOpen(true), []);
  const closeAddModal = useCallback(() => setAddModalOpen(false), []);

  const addPickerOptions = useMemo(
    () =>
      WIRE_ELEMENT_TYPES.map((t) => ({
        type: t,
        description: ELEMENT_PALETTE[t].description,
        Icon: ELEMENT_PALETTE[t].Icon,
      })),
    []
  );

  const addElementOfType = useCallback(
    (t: WireElementType) => {
      lastUsedTypeRef.current = t;
      onHistoryCheckpoint?.();
      onChange([...elements, createRow(blockId, t, elements)]);
      closeAddModal();
    },
    [blockId, elements, onChange, onHistoryCheckpoint, closeAddModal]
  );

  const quickAdd = useCallback(
    (t: WireElementType) => {
      lastUsedTypeRef.current = t;
      onHistoryCheckpoint?.();
      onChange([...elements, createRow(blockId, t, elements)]);
    },
    [blockId, elements, onChange, onHistoryCheckpoint]
  );

  useEffect(() => {
    function editingTextTarget(t: EventTarget | null) {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (editingTextTarget(e.target)) return;

      if (e.key === "Escape") {
        if (previewMode) {
          setPreviewMode(false);
          return;
        }
        setSelectionIds([]);
        setAddModalOpen(false);
        return;
      }

      if (previewMode) return;

      const lower = e.key.toLowerCase();
      if (!e.metaKey && !e.ctrlKey && lower === "a") {
        e.preventDefault();
        setAddModalOpen(true);
        return;
      }

      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (lower === "h") {
          e.preventDefault();
          quickAdd("Heading");
          return;
        }
        if (lower === "b") {
          e.preventDefault();
          quickAdd("Primary button");
          return;
        }
        if (lower === "i") {
          e.preventDefault();
          quickAdd("Input");
          return;
        }
      }

      const ids = selectionIdsRef.current;
      if (ids.length === 0) return;

      const step = e.shiftKey ? GRID * 4 : GRID;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const els = elementsRef.current;
        const sel = new Set(ids);
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        if (!dx && !dy) return;
        onHistoryCheckpoint?.();
        onChangeRef.current(
          els.map((r) =>
            sel.has(r.id)
              ? {
                  ...r,
                  frame_x: Math.max(0, r.frame_x + dx),
                  frame_y: Math.max(0, r.frame_y + dy),
                }
              : r
          )
        );
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        const els = elementsRef.current;
        const sel = new Set(ids);
        onHistoryCheckpoint?.();
        setSelectionIds([]);
        onChangeRef.current(els.filter((r) => !sel.has(r.id)));
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const els = elementsRef.current;
        const sel = new Set(ids);
        const toDup = els.filter((r) => sel.has(r.id));
        if (!toDup.length) return;
        onHistoryCheckpoint?.();
        let next = [...els];
        const newIds: string[] = [];
        for (const row of toDup) {
          const dup = duplicateElement(row, next);
          next = [...next, dup];
          newIds.push(dup.id);
        }
        onChangeRef.current(next);
        setSelectionIds(newIds);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onHistoryCheckpoint, previewMode, quickAdd]);

  useEffect(() => {
    function apply(clientX: number, clientY: number) {
      const d = dragRef.current;
      if (!d) return;
      const z = zoomRef.current || 1;
      const els = elementsRef.current;
      const { width: aw, height: ah } = artboardSizeRef.current;

      if (d.kind === "resize") {
        onChangeRef.current(
          els.map((r) => {
            if (r.id !== d.id) return r;
            const rdx = (clientX - d.startClientX) / z;
            const rdy = (clientY - d.startClientY) / z;
            const { x, y, w, h } = applyResize(d.ox, d.oy, d.ow, d.oh, rdx, rdy, d.edge);
            return {
              ...r,
              frame_x: Math.max(0, x),
              frame_y: Math.max(0, y),
              frame_w: w,
              frame_h: h,
            };
          })
        );
        return;
      }

      const moving = new Set(d.ids);
      const ox = d.ox;
      const origMinX = Math.min(...d.ids.map((id) => ox[id].x));
      const origMinY = Math.min(...d.ids.map((id) => ox[id].y));
      const rdx = (clientX - d.startClientX) / z;
      const rdy = (clientY - d.startClientY) / z;
      const draftMinX = origMinX + rdx;
      const draftMinY = origMinY + rdy;
      const staticEls = els.filter((row) => !moving.has(row.id));
      const candX = [
        0,
        snap(aw / 2),
        aw,
        ...staticEls.flatMap((e) => [e.frame_x, e.frame_x + e.frame_w / 2, e.frame_x + e.frame_w]),
      ];
      const candY = [
        0,
        snap(ah / 2),
        ah,
        ...staticEls.flatMap((e) => [e.frame_y, e.frame_y + e.frame_h / 2, e.frame_y + e.frame_h]),
      ];
      const { snapped: alignX, guide: gx } = snapLineToGuides(draftMinX, candX);
      const { snapped: alignY, guide: gy } = snapLineToGuides(draftMinY, candY);
      setSnapGuides({
        vx: gx ?? undefined,
        hy: gy ?? undefined,
      });

      onChangeRef.current(
        els.map((r) => {
          if (!moving.has(r.id)) return r;
          const o = ox[r.id];
          return {
            ...r,
            frame_x: Math.max(0, snap(o.x + alignX - origMinX)),
            frame_y: Math.max(0, snap(o.y + alignY - origMinY)),
          };
        })
      );
    }
    function onMove(e: PointerEvent) {
      if (!dragRef.current) return;
      apply(e.clientX, e.clientY);
    }
    function onUp(e: PointerEvent) {
      if (!dragRef.current) return;
      apply(e.clientX, e.clientY);
      dragRef.current = null;
      setSnapGuides({});
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

  function patchRow(
    id: string,
    patch: Partial<
      Pick<
        WireframeElementRow,
        "element_type" | "label" | "frame_x" | "frame_y" | "frame_w" | "frame_h" | "meta"
      >
    >
  ) {
    onChange(elements.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function patchMeta(id: string, metaPatch: Partial<WireframeElementMeta>) {
    onHistoryCheckpoint?.();
    onChange(
      elements.map((r) =>
        r.id === id ? { ...r, meta: { ...(r.meta ?? {}), ...metaPatch } } : r
      )
    );
  }

  function removeRow(id: string) {
    onHistoryCheckpoint?.();
    setSelectionIds((s) => s.filter((x) => x !== id));
    onChange(elements.filter((r) => r.id !== id));
  }

  function duplicateSelectedRow() {
    const ids = selectionIdsRef.current;
    if (!ids.length) return;
    const sel = new Set(ids);
    const toDup = elements.filter((r) => sel.has(r.id));
    if (!toDup.length) return;
    onHistoryCheckpoint?.();
    let next = [...elements];
    const newIds: string[] = [];
    for (const row of toDup) {
      const dup = duplicateElement(row, next);
      next = [...next, dup];
      newIds.push(dup.id);
    }
    onChange(next);
    setSelectionIds(newIds);
  }

  function clearCanvasSelection() {
    setSelectionIds([]);
    const ae = document.activeElement;
    if (
      ae instanceof HTMLElement &&
      (ae.tagName === "INPUT" ||
        ae.tagName === "TEXTAREA" ||
        ae.tagName === "SELECT" ||
        ae.isContentEditable)
    ) {
      ae.blur();
    }
  }

  function startMove(e: ReactPointerEvent, row: WireframeElementRow) {
    if (previewMode) return;
    e.preventDefault();
    e.stopPropagation();
    onHistoryCheckpoint?.();
    let ids = selectionIdsRef.current;
    if (!ids.includes(row.id)) {
      ids = [row.id];
      setSelectionIds(ids);
    }
    const ox: Record<string, { x: number; y: number }> = {};
    for (const id of ids) {
      const r0 = elementsRef.current.find((x) => x.id === id);
      if (r0) ox[id] = { x: r0.frame_x, y: r0.frame_y };
    }
    dragRef.current = {
      id: row.id,
      kind: "move",
      ids,
      startClientX: e.clientX,
      startClientY: e.clientY,
      ox,
    };
  }

  function startResize(e: ReactPointerEvent, row: WireframeElementRow, edge: ResizeEdge) {
    if (previewMode) return;
    e.preventDefault();
    e.stopPropagation();
    onHistoryCheckpoint?.();
    setSelectionIds([row.id]);
    dragRef.current = {
      id: row.id,
      kind: "resize",
      edge,
      startClientX: e.clientX,
      startClientY: e.clientY,
      ox: row.frame_x,
      oy: row.frame_y,
      ow: row.frame_w,
      oh: row.frame_h,
    };
  }

  const alignLeftEdges = useCallback(() => {
    const ids = selectionIdsRef.current;
    if (ids.length < 2) return;
    const sel = new Set(ids);
    const subset = elements.filter((e) => sel.has(e.id));
    const minX = Math.min(...subset.map((e) => e.frame_x));
    onHistoryCheckpoint?.();
    onChange(elements.map((r) => (sel.has(r.id) ? { ...r, frame_x: minX } : r)));
  }, [elements, onChange, onHistoryCheckpoint]);

  const alignRightEdges = useCallback(() => {
    const ids = selectionIdsRef.current;
    if (ids.length < 2) return;
    const sel = new Set(ids);
    const subset = elements.filter((e) => sel.has(e.id));
    const maxR = Math.max(...subset.map((e) => e.frame_x + e.frame_w));
    onHistoryCheckpoint?.();
    onChange(
      elements.map((r) =>
        sel.has(r.id) ? { ...r, frame_x: Math.max(0, maxR - r.frame_w) } : r
      )
    );
  }, [elements, onChange, onHistoryCheckpoint]);

  const alignCenterH = useCallback(() => {
    const ids = selectionIdsRef.current;
    if (ids.length < 2) return;
    const sel = new Set(ids);
    const subset = elements.filter((e) => sel.has(e.id));
    const minL = Math.min(...subset.map((e) => e.frame_x));
    const maxR = Math.max(...subset.map((e) => e.frame_x + e.frame_w));
    const mid = (minL + maxR) / 2;
    onHistoryCheckpoint?.();
    onChange(
      elements.map((r) =>
        sel.has(r.id) ? { ...r, frame_x: Math.max(0, snap(mid - r.frame_w / 2)) } : r
      )
    );
  }, [elements, onChange, onHistoryCheckpoint]);

  const distributeVertical = useCallback(() => {
    const ids = selectionIdsRef.current;
    if (ids.length < 2) return;
    const sel = new Set(ids);
    const subset = [...elements].filter((e) => sel.has(e.id)).sort((a, b) => a.frame_y - b.frame_y);
    if (subset.length < 2) return;
    const firstY = subset[0].frame_y;
    const last = subset[subset.length - 1];
    const lastBottom = last.frame_y + last.frame_h;
    const totalH = subset.reduce((s, e) => s + e.frame_h, 0);
    const span = lastBottom - firstY;
    const gap = (span - totalH) / (subset.length - 1);
    if (gap < 0) return;
    let y = firstY;
    const yById = new Map<string, number>();
    for (const e of subset) {
      yById.set(e.id, snap(y));
      y += e.frame_h + gap;
    }
    onHistoryCheckpoint?.();
    onChange(
      elements.map((r) => (yById.has(r.id) ? { ...r, frame_y: yById.get(r.id)! } : r))
    );
  }, [elements, onChange, onHistoryCheckpoint]);

  const onArtboardPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (previewMode) return;
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest("[data-wire-el]")) return;

      e.stopPropagation();

      /** Alt+click empty artboard: drop last-used type at pointer (Shift reserved for marquee add). */
      if (e.altKey) {
        const { x, y } = clientToArtboard(e.clientX, e.clientY);
        const typ = lastUsedTypeRef.current;
        const { w: fw, h: fh } = defaultFrameForType(typ);
        onHistoryCheckpoint?.();
        const row = createRowAt(blockId, typ, elements, x - fw / 2, y - fh / 2);
        onChange([...elements, row]);
        setSelectionIds([row.id]);
        return;
      }

      const shiftHeld = e.shiftKey;
      const p = clientToArtboard(e.clientX, e.clientY);
      marqueeLiveRef.current = { artX0: p.x, artY0: p.y, artX1: p.x, artY1: p.y };
      setMarquee({ ...marqueeLiveRef.current });

      function onMove(ev: PointerEvent) {
        const m = marqueeLiveRef.current;
        if (!m) return;
        const q = clientToArtboard(ev.clientX, ev.clientY);
        m.artX1 = q.x;
        m.artY1 = q.y;
        setMarquee({ ...m });
      }
      function onUp() {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        const m = marqueeLiveRef.current;
        marqueeLiveRef.current = null;
        setMarquee(null);
        if (!m) return;
        const x0 = Math.min(m.artX0, m.artX1);
        const x1 = Math.max(m.artX0, m.artX1);
        const y0 = Math.min(m.artY0, m.artY1);
        const y1 = Math.max(m.artY0, m.artY1);
        const els = elementsRef.current;
        if (x1 - x0 < 4 && y1 - y0 < 4) {
          if (!shiftHeld) setSelectionIds([]);
          return;
        }
        const hit = els.filter(
          (el) =>
            el.frame_x < x1 &&
            el.frame_x + el.frame_w > x0 &&
            el.frame_y < y1 &&
            el.frame_y + el.frame_h > y0
        );
        const ids = hit.map((h0) => h0.id);
        if (shiftHeld) {
          setSelectionIds((prev) => [...new Set([...prev, ...ids])]);
        } else {
          setSelectionIds(ids);
        }
      }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [previewMode, clientToArtboard, blockId, elements, onChange, onHistoryCheckpoint]
  );

  const cornerHandle =
    "data-resize-handle pointer-events-auto z-30 h-2.5 w-2.5 rounded-[2px] border border-white bg-stone-700 shadow-sm hover:bg-stone-900";
  const edgeHandleH =
    "data-resize-handle pointer-events-auto z-30 h-1.5 w-6 rounded-full bg-stone-600/90 hover:bg-stone-800";
  const edgeHandleV =
    "data-resize-handle pointer-events-auto z-30 h-6 w-1.5 rounded-full bg-stone-600/90 hover:bg-stone-800";

  const scaledW = artboardSize.width * zoom;
  const scaledH = artboardSize.height * zoom;

  const inspector = selectedRow ? (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-wide text-stone-500">
          Element
        </p>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-stone-600">Type</span>
          <select
            className="rounded-md border border-stone-400 bg-white px-2 py-2 text-sm text-stone-800 shadow-sm"
            value={selectedRow.element_type}
            onChange={(e) => {
              onHistoryCheckpoint?.();
              patchRow(selectedRow.id, { element_type: e.target.value as WireElementType });
            }}
          >
            {WIRE_ELEMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-sm text-stone-600">Label / copy</span>
          <textarea
            className="min-h-[5rem] rounded-md border border-stone-400 bg-white px-2 py-2 text-sm text-stone-800 shadow-sm outline-none focus:ring-2 focus:ring-stone-300"
            placeholder="Text shown in the wireframe"
            value={selectedRow.label}
            onFocus={onHistoryCheckpoint}
            onChange={(e) => patchRow(selectedRow.id, { label: e.target.value })}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="!gap-2"
          onClick={duplicateSelectedRow}
          aria-label="Duplicate element"
        >
          <Copy className="h-4 w-4 shrink-0" aria-hidden />
          Duplicate
        </Button>
        <Button
          type="button"
          variant="outline"
          className="!gap-2 !text-red-700 hover:!bg-red-50"
          onClick={() => removeRow(selectedRow.id)}
        >
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
          Delete
        </Button>
      </div>
      {(selectedRow.element_type === "Primary button" ||
        selectedRow.element_type === "Secondary button") && (
        <div className="border-t border-stone-200 pt-4">
          <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-wide text-stone-500">
            Button behavior
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-stone-600">Link to page</span>
            <select
              className="rounded-md border border-stone-400 bg-white px-2 py-2 text-sm text-stone-800 shadow-sm"
              value={selectedRow.meta?.linkPageId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                patchMeta(selectedRow.id, { linkPageId: v || null });
              }}
            >
              <option value="">None (describe below)</option>
              {pageOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 flex flex-col gap-1">
            <span className="text-sm text-stone-600">On click (intent, API, modal…)</span>
            <textarea
              className="min-h-[4.5rem] rounded-md border border-stone-400 bg-white px-2 py-2 text-sm text-stone-800 shadow-sm outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="e.g. submit form, open checkout, scroll to #pricing"
              value={selectedRow.meta?.onClickDescription ?? ""}
              onChange={(e) => patchMeta(selectedRow.id, { onClickDescription: e.target.value })}
            />
          </label>
        </div>
      )}
      {selectedRow.element_type === "Input" && (
        <div className="border-t border-stone-200 pt-4">
          <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-wide text-stone-500">
            Field
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-stone-600">Input type</span>
            <select
              className="rounded-md border border-stone-400 bg-white px-2 py-2 text-sm text-stone-800 shadow-sm"
              value={selectedRow.meta?.inputType ?? "text"}
              onChange={(e) => patchMeta(selectedRow.id, { inputType: e.target.value })}
            >
              {FORM_INPUT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 flex flex-col gap-1">
            <span className="text-sm text-stone-600">
              Validation / submit / what happens with the value
            </span>
            <textarea
              className="min-h-[4.5rem] rounded-md border border-stone-400 bg-white px-2 py-2 text-sm text-stone-800 shadow-sm outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="e.g. required email; POST /api/signup; bind to billing email"
              value={selectedRow.meta?.fieldBehavior ?? ""}
              onChange={(e) => patchMeta(selectedRow.id, { fieldBehavior: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  ) : null;

  const deviceFrame = presetWidth != null ? activePreset.frame : "none";

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{
        backgroundColor: "#ebeae6",
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
        backgroundSize: `${GRID * 4}px ${GRID * 4}px`,
      }}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b-2 border-dashed border-stone-300 bg-[#f7f6f3] px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Button type="button" variant="outline" className="!gap-2 !py-1.5" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {pageSurface ? "Site map" : "Back"}
          </Button>
          <div className="min-w-0 border-l border-stone-200 pl-3">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-stone-500">
              {pageSurface ? "Page wireframe" : "Lo-fi wireframe"}
            </p>
            <p className="truncate text-sm font-medium text-stone-900">
              {blockName || (pageSurface ? "Untitled page" : "Untitled block")}
            </p>
            {pageSurface && onOpenExport ? (
              <button
                type="button"
                className="mt-1 max-w-full truncate text-left font-mono text-[10px] text-teal-800 underline decoration-teal-800/40 underline-offset-2 hover:text-teal-950"
                onClick={onOpenExport}
              >
                Layout is included in Export → Cursor &amp; Claude formats
              </button>
            ) : null}
          </div>
        </div>

        <div className="relative flex flex-wrap items-center gap-2">
          <span className="hidden font-mono text-[10px] uppercase tracking-wide text-stone-500 sm:inline">
            Screen
          </span>
          <div
            className="flex rounded-md border border-stone-400 bg-white p-0.5 shadow-sm"
            role="group"
            aria-label="Artboard width preset"
          >
            {VIEWPORT_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`rounded px-2.5 py-1 font-mono text-[11px] font-medium transition-colors ${
                  viewportId === p.id
                    ? "bg-stone-800 text-white"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
                onClick={() => {
                  setViewportId(p.id);
                  if (p.id !== "fluid") setFluidSizeMode("fit");
                }}
                title={
                  p.minHeight
                    ? `Artboard about ${p.width}×${p.minHeight}px`
                    : "Size follows workspace or your custom values"
                }
              >
                {p.label}
                {p.width != null && p.minHeight != null ? (
                  <span className="ml-1 tabular-nums opacity-70">
                    {p.width}×{p.minHeight}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {viewportId === "fluid" ? (
            <div
              className="flex max-w-full flex-wrap items-center gap-1.5 border-l border-stone-300 pl-2 sm:ml-1"
              role="group"
              aria-label="Fluid artboard size"
            >
              <span className="font-mono text-[10px] uppercase tracking-wide text-stone-500">
                Fluid
              </span>
              <button
                type="button"
                className={`rounded px-2 py-1 font-mono text-[11px] font-medium transition-colors ${
                  fluidSizeMode === "fit"
                    ? "bg-stone-800 text-white"
                    : "bg-white text-stone-600 ring-1 ring-stone-300 hover:bg-stone-50"
                }`}
                onClick={() => setFluidSizeMode("fit")}
              >
                Fill workspace
              </button>
              <button
                type="button"
                className={`rounded px-2 py-1 font-mono text-[11px] font-medium transition-colors ${
                  fluidSizeMode === "custom"
                    ? "bg-stone-800 text-white"
                    : "bg-white text-stone-600 ring-1 ring-stone-300 hover:bg-stone-50"
                }`}
                onClick={() => {
                  const { w, h } = lastFitArtboardRef.current;
                  setFluidCustomW(Math.min(FLUID_MAX_W, Math.max(FLUID_MIN_W, w)));
                  setFluidCustomH(Math.min(FLUID_MAX_H, Math.max(FLUID_MIN_H, h)));
                  setFluidSizeMode("custom");
                }}
              >
                Custom
              </button>
              {fluidSizeMode === "custom" ? (
                <>
                  <label className="flex items-center gap-1 font-mono text-[11px] text-stone-700">
                    <span className="text-stone-500">W</span>
                    <input
                      type="number"
                      min={FLUID_MIN_W}
                      max={FLUID_MAX_W}
                      className="w-[4.5rem] rounded border border-stone-400 bg-white px-1.5 py-1 tabular-nums shadow-sm"
                      value={fluidCustomW}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (Number.isNaN(v)) return;
                        setFluidCustomW(Math.min(FLUID_MAX_W, Math.max(FLUID_MIN_W, v)));
                      }}
                    />
                  </label>
                  <label className="flex items-center gap-1 font-mono text-[11px] text-stone-700">
                    <span className="text-stone-500">H</span>
                    <input
                      type="number"
                      min={FLUID_MIN_H}
                      max={FLUID_MAX_H}
                      className="w-[4.5rem] rounded border border-stone-400 bg-white px-1.5 py-1 tabular-nums shadow-sm"
                      value={fluidCustomH}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (Number.isNaN(v)) return;
                        setFluidCustomH(Math.min(FLUID_MAX_H, Math.max(FLUID_MIN_H, v)));
                      }}
                    />
                  </label>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="hidden flex-wrap items-center gap-1 sm:flex" aria-label="Quick add">
            {QUICK_ADD_TYPES.map((t) => {
              const { Icon } = ELEMENT_PALETTE[t];
              return (
                <button
                  key={t}
                  type="button"
                  title={`Add ${t}`}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-stone-400 bg-white text-stone-700 shadow-sm hover:bg-stone-100"
                  onClick={() => quickAdd(t)}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  <span className="sr-only">Add {t}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-xs font-medium shadow-sm ${
              previewMode
                ? "border-teal-600 bg-teal-700 text-white hover:bg-teal-800"
                : "border-stone-400 bg-white text-stone-800 hover:bg-stone-50"
            }`}
            aria-pressed={previewMode}
            title={previewMode ? "Exit preview (Esc)" : "Preview without edit chrome"}
            onClick={() => {
              setPreviewMode((p) => {
                const next = !p;
                if (next) setSelectionIds([]);
                return next;
              });
            }}
          >
            {previewMode ? (
              <EyeOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : (
              <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
            <span className="hidden sm:inline">{previewMode ? "Editing" : "Preview"}</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-stone-400 bg-white px-2.5 py-1.5 font-mono text-xs font-medium text-stone-800 shadow-sm hover:bg-stone-50"
            aria-expanded={addModalOpen}
            aria-haspopup="dialog"
            onClick={() => (addModalOpen ? closeAddModal() : openAddModal())}
          >
            <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Add element
          </button>
        </div>
      </div>

      <AddWireframeElementModal
        open={addModalOpen}
        onClose={closeAddModal}
        onPick={addElementOfType}
        options={addPickerOptions}
      />

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-stone-200/90 bg-white/90 px-4 py-2 font-mono text-[11px] text-stone-600">
        <span>
          <span className="text-stone-400">Artboard</span>{" "}
          <span className="tabular-nums text-stone-800">
            {artboardSize.width}×{artboardSize.height}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 border-l border-stone-200 pl-3">
          <span className="text-stone-400">Zoom</span>
          <button
            type="button"
            className="rounded border border-stone-300 px-1.5 py-0.5 text-stone-700 hover:bg-stone-100"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => clampZoom(z - 0.1))}
          >
            <ZoomOut className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            className="min-w-[3rem] tabular-nums text-stone-800 hover:underline"
            title="Reset zoom to 100%"
            onClick={() => setZoom(1)}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            className="rounded border border-stone-300 px-1.5 py-0.5 text-stone-700 hover:bg-stone-100"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => clampZoom(z + 0.1))}
          >
            <ZoomIn className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            className="ml-1 rounded border border-stone-300 px-2 py-0.5 text-[10px] font-medium text-stone-700 hover:bg-stone-100"
            title="Fit artboard width to view"
            onClick={fitZoom}
          >
            Fit
          </button>
        </span>
        {selectionIds.length >= 2 && !previewMode ? (
          <span className="inline-flex flex-wrap items-center gap-1 border-l border-stone-200 pl-3">
            <span className="text-stone-400 max-sm:hidden">Align</span>
            <button
              type="button"
              className="rounded border border-stone-300 p-0.5 text-stone-700 hover:bg-stone-100"
              title="Align left edges"
              aria-label="Align left edges"
              onClick={alignLeftEdges}
            >
              <AlignHorizontalJustifyStart className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              className="rounded border border-stone-300 p-0.5 text-stone-700 hover:bg-stone-100"
              title="Align horizontal centers"
              aria-label="Align horizontal centers"
              onClick={alignCenterH}
            >
              <AlignHorizontalJustifyCenter className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              className="rounded border border-stone-300 p-0.5 text-stone-700 hover:bg-stone-100"
              title="Align right edges"
              aria-label="Align right edges"
              onClick={alignRightEdges}
            >
              <AlignHorizontalJustifyEnd className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              className="rounded border border-stone-300 p-0.5 text-stone-700 hover:bg-stone-100"
              title="Distribute vertically"
              aria-label="Distribute vertically"
              onClick={distributeVertical}
            >
              <AlignVerticalSpaceBetween className="h-3.5 w-3.5" aria-hidden />
            </button>
          </span>
        ) : null}
        {selectedRow ? (
          <span className="hidden sm:inline">
            <span className="text-stone-400">Selection</span>{" "}
            <span className="tabular-nums text-stone-800">
              {selectionIds.length > 1
                ? `${selectionIds.length} elements`
                : `${selectedRow.frame_w}×${selectedRow.frame_h} @ ${selectedRow.frame_x},${selectedRow.frame_y}`}
            </span>
          </span>
        ) : null}
        <span className="text-stone-400 max-lg:hidden">
          A add · H/B/I quick · Esc clear · Alt+click place · Shift+drag add to selection · arrows
          nudge · Del · ⌘D · ⌘+scroll zoom
        </span>
      </div>

      {selectedRow ? (
        <div className="max-h-[min(40vh,280px)] shrink-0 overflow-y-auto border-b border-stone-200 bg-[#f7f6f3] md:hidden">
          {inspector}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative min-h-0 min-w-0 flex-1">
          <div
            ref={scrollHostRef}
            className="h-full min-h-0 overflow-auto p-4"
            onClick={clearCanvasSelection}
          onWheel={(e) => {
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.08 : 0.08;
            setZoom((z) => clampZoom(z + delta));
          }}
          role="presentation"
        >
          {elements.length === 0 ? (
            <div className="mx-auto max-w-lg pt-10 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-stone-500">
                Empty artboard
              </p>
              <p className="mt-2 text-sm leading-relaxed text-stone-700">
                Pick a screen width, then add elements. Export keeps types, labels, links, and box
                geometry.
              </p>
              <button
                type="button"
                className="mt-6 inline-flex items-center gap-2 rounded-md border-2 border-stone-800 bg-white px-4 py-2.5 font-mono text-sm font-medium text-stone-900 shadow-[3px_3px_0_0_rgba(28,25,23,0.2)] hover:bg-stone-50"
                onClick={openAddModal}
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                Add element
              </button>
            </div>
          ) : null}

          {elements.length > 0 ? (
            <DeviceFrame frame={deviceFrame}>
              <div
                className="relative mx-auto"
                style={{
                  width: scaledW,
                  height: scaledH,
                }}
                role="presentation"
              >
                <div
                  ref={artboardInnerRef}
                  className="relative border-[3px] border-stone-800 bg-white shadow-[4px_4px_0_0_rgba(28,25,23,0.12)]"
                  style={{
                    width: artboardSize.width,
                    height: artboardSize.height,
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                    backgroundImage: previewMode
                      ? undefined
                      : "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
                    backgroundSize: previewMode ? undefined : `${GRID}px ${GRID}px`,
                  }}
                  role="presentation"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={onArtboardPointerDown}
                >
                  {snapGuides.vx != null ? (
                    <div
                      className="pointer-events-none absolute bottom-0 top-0 z-[40] w-px bg-teal-500/90"
                      style={{ left: snapGuides.vx }}
                      aria-hidden
                    />
                  ) : null}
                  {snapGuides.hy != null ? (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-[40] h-px bg-teal-500/90"
                      style={{ top: snapGuides.hy }}
                      aria-hidden
                    />
                  ) : null}
                  {marquee ? (
                    <div
                      className="pointer-events-none absolute z-[35] border border-dashed border-teal-600 bg-teal-500/10"
                      style={{
                        left: Math.min(marquee.artX0, marquee.artX1),
                        top: Math.min(marquee.artY0, marquee.artY1),
                        width: Math.abs(marquee.artX1 - marquee.artX0),
                        height: Math.abs(marquee.artY1 - marquee.artY0),
                      }}
                      aria-hidden
                    />
                  ) : null}
              {elements.map((row) => {
                const selected = selectionIds.includes(row.id);
                return (
                  <div
                    key={row.id}
                    data-wire-el
                    title={
                      previewMode
                        ? undefined
                        : selected
                          ? "Drag to move · use handles to resize"
                          : "Click to select · Shift+click add · drag to move"
                    }
                    className={`group absolute flex flex-col overflow-visible transition-shadow duration-150 ${
                      previewMode
                        ? "z-0 cursor-default shadow-none ring-0"
                        : selected
                          ? "z-10 cursor-grab shadow-[3px_3px_0_0_rgba(87,83,78,0.15)] ring-2 ring-stone-800 ring-offset-2 ring-offset-white active:cursor-grabbing"
                          : "z-0 cursor-grab ring-2 ring-stone-400 ring-offset-2 ring-offset-white hover:ring-stone-600 active:cursor-grabbing"
                    }`}
                    style={{
                      left: row.frame_x,
                      top: row.frame_y,
                      width: row.frame_w,
                      height: row.frame_h,
                      background:
                        row.element_type === "Divider" || row.element_type === "Spacer"
                          ? "transparent"
                          : "#fefefe",
                    }}
                    role="presentation"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (previewMode) return;
                      if (e.shiftKey) {
                        setSelectionIds((prev) => toggleSelectedId(prev, row.id));
                      } else {
                        setSelectionIds([row.id]);
                      }
                    }}
                  >
                    <div
                      className="pointer-events-none absolute left-1 top-1 z-20 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    >
                      <span className="inline-flex items-center justify-center rounded border border-stone-400 bg-white/95 p-0.5 text-stone-500 shadow-sm">
                        <GripVertical className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div
                      className="pointer-events-none absolute bottom-1 right-1 z-20 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    >
                      <span title="Resize from corners when selected" className="inline-flex items-center justify-center rounded border border-stone-400 bg-white/95 p-0.5 text-stone-500 shadow-sm">
                        <Maximize2 className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    <div
                      className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-1"
                      onPointerDown={(e) => {
                        if (previewMode) return;
                        const t = e.target as HTMLElement;
                        if (
                          t.closest(
                            "[data-no-drag], [data-resize-handle], [data-wire-toolbar]"
                          )
                        )
                          return;
                        startMove(e, row);
                      }}
                    >
                      {!selected || previewMode ? (
                        <span
                          className="pointer-events-none absolute bottom-1 left-1 z-10 rounded border border-stone-300 bg-white/95 px-1 py-px font-mono text-[9px] font-semibold uppercase tracking-wide text-stone-500"
                          aria-hidden
                        >
                          {shortTypeLabel(row.element_type)}
                        </span>
                      ) : null}

                      <div className="min-h-0 flex-1 pt-0.5">
                        <WireframeElementVisual
                          row={row}
                          readOnly={previewMode}
                          onLabelChange={(label) => patchRow(row.id, { label })}
                          onLabelFocus={onHistoryCheckpoint}
                        />
                      </div>
                    </div>

                    {selected && !previewMode && selectionIds.length === 1 ? (
                      <>
                        <div
                          data-wire-toolbar
                          className="absolute left-1 right-1 top-0 z-30 flex h-7 translate-y-[calc(-100%-0.25rem)] items-center gap-1 rounded border border-stone-500 bg-stone-50 px-1 shadow-sm md:hidden"
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <span
                            className="shrink-0 select-none px-0.5 font-mono text-[10px] text-stone-400"
                            aria-hidden
                          >
                            ::
                          </span>
                          <select
                            className="min-w-0 flex-1 rounded border border-stone-300 bg-white py-0.5 pl-1 pr-0 font-mono text-[10px] font-medium text-stone-800"
                            value={row.element_type}
                            onChange={(e) => {
                              onHistoryCheckpoint?.();
                              patchRow(row.id, { element_type: e.target.value as WireElementType });
                            }}
                          >
                            {WIRE_ELEMENT_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="shrink-0 rounded p-0.5 text-stone-400 hover:bg-stone-200 hover:text-red-600"
                            onClick={() => removeRow(row.id)}
                            aria-label="Remove element"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                        <button
                          type="button"
                          title="Drag to resize"
                          className={`${cornerHandle} absolute -left-1 -top-1 cursor-nwse-resize`}
                          aria-label="Resize top left"
                          onPointerDown={(e) => startResize(e, row, "nw")}
                        />
                        <button
                          type="button"
                          title="Drag to resize"
                          className={`${edgeHandleH} absolute -top-1 left-1/2 -translate-x-1/2 cursor-ns-resize`}
                          aria-label="Resize top"
                          onPointerDown={(e) => startResize(e, row, "n")}
                        />
                        <button
                          type="button"
                          title="Drag to resize"
                          className={`${cornerHandle} absolute -right-1 -top-1 cursor-nesw-resize`}
                          aria-label="Resize top right"
                          onPointerDown={(e) => startResize(e, row, "ne")}
                        />
                        <button
                          type="button"
                          title="Drag to resize"
                          className={`${edgeHandleV} absolute -right-1 top-1/2 -translate-y-1/2 cursor-ew-resize`}
                          aria-label="Resize right"
                          onPointerDown={(e) => startResize(e, row, "e")}
                        />
                        <button
                          type="button"
                          title="Drag to resize"
                          className={`${cornerHandle} absolute -bottom-1 -right-1 cursor-nwse-resize`}
                          aria-label="Resize bottom right"
                          onPointerDown={(e) => startResize(e, row, "se")}
                        />
                        <button
                          type="button"
                          title="Drag to resize"
                          className={`${edgeHandleH} absolute -bottom-1 left-1/2 -translate-x-1/2 cursor-ns-resize`}
                          aria-label="Resize bottom"
                          onPointerDown={(e) => startResize(e, row, "s")}
                        />
                        <button
                          type="button"
                          title="Drag to resize"
                          className={`${cornerHandle} absolute -bottom-1 -left-1 cursor-nesw-resize`}
                          aria-label="Resize bottom left"
                          onPointerDown={(e) => startResize(e, row, "sw")}
                        />
                        <button
                          type="button"
                          title="Drag to resize"
                          className={`${edgeHandleV} absolute -left-1 top-1/2 -translate-y-1/2 cursor-ew-resize`}
                          aria-label="Resize left"
                          onPointerDown={(e) => startResize(e, row, "w")}
                        />
                      </>
                    ) : null}
                  </div>
                );
              })}
                </div>
              </div>
            </DeviceFrame>
          ) : null}
        </div>

          <div
            className="pointer-events-none absolute bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-5"
            aria-label="Quick actions"
          >
            <div
              className="pointer-events-auto flex w-[3.25rem] flex-col overflow-hidden rounded-2xl border-2 border-stone-800 bg-[#f7f6f3]/98 shadow-[4px_4px_0_0_rgba(28,25,23,0.14)] backdrop-blur-md sm:w-[3.5rem]"
              role="toolbar"
              aria-label="Canvas zoom"
            >
              <button
                type="button"
                disabled={atMaxZoom}
                className="flex min-h-11 items-center justify-center text-stone-800 transition-colors hover:bg-stone-200/85 active:bg-stone-300/80 disabled:pointer-events-none disabled:opacity-35 focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f6f3]"
                aria-label="Zoom in"
                title="Zoom in · ⌘+scroll up"
                onClick={() => setZoom((z) => clampZoom(z + 0.1))}
              >
                <ZoomIn className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              </button>
              <button
                type="button"
                className="flex min-h-9 items-center justify-center border-y border-stone-300/90 px-1 font-mono text-[11px] font-medium tabular-nums tracking-tight text-stone-800 transition-colors hover:bg-stone-200/85 active:bg-stone-300/80 focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600"
                title="Reset zoom to 100%"
                aria-label={`Zoom ${Math.round(zoom * 100)}%. Click to reset to 100%.`}
                onClick={() => setZoom(1)}
              >
                <span className="min-w-[2.125rem] text-center">{Math.round(zoom * 100)}%</span>
              </button>
              <button
                type="button"
                disabled={atMinZoom}
                className="flex min-h-11 items-center justify-center text-stone-800 transition-colors hover:bg-stone-200/85 active:bg-stone-300/80 disabled:pointer-events-none disabled:opacity-35 focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f6f3]"
                aria-label="Zoom out"
                title="Zoom out · ⌘+scroll down"
                onClick={() => setZoom((z) => clampZoom(z - 0.1))}
              >
                <ZoomOut className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              </button>
              <button
                type="button"
                className="flex min-h-11 flex-col items-center justify-center gap-0.5 border-t border-stone-300/90 px-1 py-1 font-mono text-[8px] font-semibold uppercase leading-none tracking-wide text-stone-700 transition-colors hover:bg-stone-200/85 active:bg-stone-300/80 focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600"
                title="Fit artboard width to view"
                aria-label="Fit artboard width to view"
                onClick={fitZoom}
              >
                <Maximize2 className="h-3.5 w-3.5 shrink-0 text-stone-600" strokeWidth={2} aria-hidden />
                <span className="select-none" aria-hidden>
                  Fit
                </span>
              </button>
            </div>
            <button
              type="button"
              className="pointer-events-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-stone-900 bg-teal-700 text-white shadow-[4px_4px_0_0_rgba(28,25,23,0.2)] hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              aria-expanded={addModalOpen}
              aria-haspopup="dialog"
              aria-label="Add element"
              title="Add element"
              onClick={() => (addModalOpen ? closeAddModal() : openAddModal())}
            >
              <Plus className="h-7 w-7" strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        </div>

        {selectedRow ? (
          <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-stone-200 bg-[#f7f6f3] md:block">
            {inspector}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
