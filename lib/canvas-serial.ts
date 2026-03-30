import type { Edge, Node } from "reactflow";
import type {
  BlockNodeData,
  PageNodeData,
  PageRow,
  WireframeElementRow,
} from "@/lib/types";

function wireframeSliceForBlockIds(
  blockIds: string[],
  wireframeByBlockId: Record<string, WireframeElementRow[]>
) {
  const slice: Record<
    string,
    {
      id: string;
      element_type: string;
      label: string;
      sort_order: number;
      frame_x: number;
      frame_y: number;
      frame_w: number;
      frame_h: number;
      meta: WireframeElementRow["meta"];
    }[]
  > = {};
  const sortedIds = [...blockIds].sort();
  for (const id of sortedIds) {
    const list = wireframeByBlockId[id] ?? [];
    slice[id] = [...list]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((w) => ({
        id: w.id,
        element_type: w.element_type,
        label: w.label,
        sort_order: w.sort_order,
        frame_x: w.frame_x,
        frame_y: w.frame_y,
        frame_w: w.frame_w,
        frame_h: w.frame_h,
        meta: w.meta ?? {},
      }));
  }
  return slice;
}

/** Site map canvas + page metadata (names, purpose copy) for autosave dirty detection. */
export function serializeSitemapSnapshot(
  pages: Pick<
    PageRow,
    "id" | "name" | "order" | "description" | "sitemap_x" | "sitemap_y"
  >[],
  pageNodes: Node<PageNodeData>[],
  navEdges: Edge[]
): string {
  return JSON.stringify({
    kind: "sitemap",
    pages,
    nodes: pageNodes.map((n) => ({
      id: n.id,
      position: n.position,
      name: n.data.name,
      description: n.data.description,
    })),
    edges: navEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
    })),
  });
}

/** Full page snapshot for autosave dirty detection (canvas + wireframes for blocks on page). */
export function serializePageSnapshot(
  pageId: string | null,
  nodes: Node<BlockNodeData>[],
  edges: Edge[],
  wireframeByBlockId: Record<string, WireframeElementRow[]>
): string {
  if (!pageId) return "";
  const blockIds = nodes.map((n) => n.id);
  return JSON.stringify({
    pageId,
    nodes: nodes.map((n) => ({
      id: n.id,
      position: n.position,
      blockType: n.data.blockType,
      name: n.data.name,
      description: n.data.description,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
    })),
    wireframes: wireframeSliceForBlockIds(blockIds, wireframeByBlockId),
  });
}

/** @deprecated Use serializePageSnapshot for autosave; kept for any legacy callers */
export function serializeCanvas(
  pageId: string | null,
  nodes: Node<BlockNodeData>[],
  edges: Edge[]
): string {
  if (!pageId) return "";
  return JSON.stringify({
    pageId,
    nodes: nodes.map((n) => ({
      id: n.id,
      position: n.position,
      blockType: n.data.blockType,
      name: n.data.name,
      description: n.data.description,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
    })),
  });
}
