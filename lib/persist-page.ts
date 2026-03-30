import type { Edge, Node } from "reactflow";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlockNodeData } from "@/lib/types";

export async function persistPageCanvas(
  supabase: SupabaseClient,
  projectId: string,
  pageId: string,
  nodes: Node<BlockNodeData>[],
  edges: Edge[]
): Promise<{ error: Error | null }> {
  const now = new Date().toISOString();

  const { error: projErr } = await supabase
    .from("projects")
    .update({ updated_at: now })
    .eq("id", projectId);
  if (projErr) return { error: new Error(projErr.message) };

  const blockIds = nodes.map((n) => n.id);

  const blockRows = nodes.map((n) => ({
    id: n.id,
    page_id: pageId,
    type: n.data.blockType,
    name: n.data.name,
    description: n.data.description,
    position_x: n.position.x,
    position_y: n.position.y,
  }));

  if (blockRows.length) {
    const { error: upErr } = await supabase.from("blocks").upsert(blockRows, {
      onConflict: "id",
    });
    if (upErr) return { error: new Error(upErr.message) };
  }

  const { data: existingBlocks, error: exBErr } = await supabase
    .from("blocks")
    .select("id")
    .eq("page_id", pageId);
  if (exBErr) return { error: new Error(exBErr.message) };

  const toDeleteBlocks =
    existingBlocks?.filter((b) => !blockIds.includes(b.id)).map((b) => b.id) ?? [];
  if (toDeleteBlocks.length) {
    const { error: delErr } = await supabase.from("blocks").delete().in("id", toDeleteBlocks);
    if (delErr) return { error: new Error(delErr.message) };
  }

  const edgeRows = edges.map((e) => ({
    id: e.id,
    page_id: pageId,
    source_block_id: e.source,
    target_block_id: e.target,
    label: typeof e.label === "string" && e.label ? e.label : null,
  }));

  if (edgeRows.length) {
    const { error: eUp } = await supabase.from("edges").upsert(edgeRows, { onConflict: "id" });
    if (eUp) return { error: new Error(eUp.message) };
  }

  const { data: existingEdges, error: exEErr } = await supabase
    .from("edges")
    .select("id")
    .eq("page_id", pageId);
  if (exEErr) return { error: new Error(exEErr.message) };

  const edgeIds = edges.map((e) => e.id);
  const toDeleteEdges =
    existingEdges?.filter((x) => !edgeIds.includes(x.id)).map((x) => x.id) ?? [];
  if (toDeleteEdges.length) {
    const { error: dE } = await supabase.from("edges").delete().in("id", toDeleteEdges);
    if (dE) return { error: new Error(dE.message) };
  }

  return { error: null };
}
