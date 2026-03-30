import type { Edge, Node } from "reactflow";
import type { BundleBlock, ProjectBundle, WireframeElementRow } from "@/lib/types";
import type { BlockNodeData } from "@/lib/types";

/** Canonical wireframe container: oldest block on the page (stable for legacy multi-block projects). */
export function hostBlockIdForPage(blocks: BundleBlock[]): string | null {
  if (!blocks.length) return null;
  return [...blocks].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )[0]!.id;
}

export function buildPageHostIndex(pages: ProjectBundle["pages"]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const p of pages) {
    const id = hostBlockIdForPage(p.blocks);
    if (id) m[p.id] = id;
  }
  return m;
}

export function buildWireframeMapForHosts(bundle: ProjectBundle): Record<string, WireframeElementRow[]> {
  const m: Record<string, WireframeElementRow[]> = {};
  for (const p of bundle.pages) {
    const sorted = [...p.blocks].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    if (!sorted.length) continue;
    const hostId = sorted[0]!.id;
    let yOff = 0;
    const merged: WireframeElementRow[] = [];
    for (const b of sorted) {
      const wires = [...b.wireframe_elements].sort((a, c) => a.sort_order - c.sort_order);
      for (const w of wires) {
        const isHostBlock = b.id === hostId;
        merged.push({
          ...w,
          id: isHostBlock ? w.id : crypto.randomUUID(),
          parent_block_id: hostId,
          frame_y: w.frame_y + yOff,
        });
      }
      const bottom = wires.length
        ? Math.max(...wires.map((w) => w.frame_y + w.frame_h))
        : 0;
      yOff += bottom + 24;
    }
    m[hostId] = merged;
  }
  return m;
}

/** Single placeholder node used by autosave / persist (positions are unused). */
export function makeHostCanvasNode(blockId: string): Node<BlockNodeData> {
  return {
    id: blockId,
    type: "block",
    position: { x: 0, y: 0 },
    data: { blockType: "Custom", name: "Page layout", description: "" },
  };
}

export function emptyPageDraft(hostBlockId: string): {
  nodes: Node<BlockNodeData>[];
  edges: Edge[];
} {
  return { nodes: [makeHostCanvasNode(hostBlockId)], edges: [] };
}
