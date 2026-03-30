import type { Edge, Node } from "reactflow";
import type { BlockNodeData, WireframeElementRow } from "@/lib/types";

export type PageDraft = { nodes: Node<BlockNodeData>[]; edges: Edge[] };

export type CanvasHistorySnapshot = {
  pageId: string;
  cache: Record<string, PageDraft>;
  wireframeByBlockId: Record<string, WireframeElementRow[]>;
};

const MAX_ENTRIES = 80;

export function cloneNodes(nodes: Node<BlockNodeData>[]): Node<BlockNodeData>[] {
  return nodes.map((n) => ({
    ...n,
    position: { ...n.position },
    data: { ...n.data },
  }));
}

export function cloneEdges(edges: Edge[]): Edge[] {
  return edges.map((e) => ({ ...e }));
}

export function clonePageCache(cache: Record<string, PageDraft>): Record<string, PageDraft> {
  const out: Record<string, PageDraft> = {};
  for (const id of Object.keys(cache)) {
    const d = cache[id]!;
    out[id] = { nodes: cloneNodes(d.nodes), edges: cloneEdges(d.edges) };
  }
  return out;
}

export function cloneWireframeMap(
  m: Record<string, WireframeElementRow[]>
): Record<string, WireframeElementRow[]> {
  const out: Record<string, WireframeElementRow[]> = {};
  for (const k of Object.keys(m)) {
    out[k] = m[k]!.map((w) => ({ ...w }));
  }
  return out;
}

export function pushHistoryEntry(
  past: CanvasHistorySnapshot[],
  snap: CanvasHistorySnapshot
): void {
  past.push(snap);
  if (past.length > MAX_ENTRIES) past.shift();
}
