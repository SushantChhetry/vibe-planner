import type { Edge, Node } from "reactflow";
import type { BundleBlock, EdgeRow, BlockNodeData, BlockType } from "@/lib/types";

export function blockRowsToNodes(blocks: BundleBlock[]): Node<BlockNodeData>[] {
  return blocks.map((b) => ({
    id: b.id,
    type: "block",
    position: { x: b.position_x, y: b.position_y },
    data: {
      blockType: b.type as BlockType,
      name: b.name,
      description: b.description,
    },
  }));
}

export function edgeRowsToEdges(rows: EdgeRow[]): Edge[] {
  return rows.map((e) => ({
    id: e.id,
    source: e.source_block_id,
    target: e.target_block_id,
    label: e.label ?? undefined,
  }));
}
