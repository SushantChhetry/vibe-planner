import type { SupabaseClient } from "@supabase/supabase-js";
import type { WireframeElementMeta, WireframeElementRow } from "@/lib/types";

function metaForDb(m: WireframeElementMeta | undefined): Record<string, unknown> {
  if (!m || Object.keys(m).length === 0) return {};
  return { ...m };
}

export async function persistWireframesForPage(
  supabase: SupabaseClient,
  blockIds: string[],
  wireframeByBlockId: Record<string, WireframeElementRow[]>
): Promise<{ error: Error | null }> {
  for (const blockId of blockIds) {
    const rows = wireframeByBlockId[blockId] ?? [];
    const ordered = [...rows].sort((a, b) => {
      if (a.frame_y !== b.frame_y) return a.frame_y - b.frame_y;
      return a.frame_x - b.frame_x;
    });
    const dbRows = ordered.map((r, index) => ({
      id: r.id,
      parent_block_id: blockId,
      element_type: r.element_type,
      label: r.label ?? "",
      sort_order: index,
      frame_x: r.frame_x,
      frame_y: r.frame_y,
      frame_w: r.frame_w,
      frame_h: r.frame_h,
      meta: metaForDb(r.meta),
    }));

    if (dbRows.length) {
      const { error: upErr } = await supabase
        .from("wireframe_elements")
        .upsert(dbRows, { onConflict: "id" });
      if (upErr) return { error: new Error(upErr.message) };
    }

    const { data: existing, error: exErr } = await supabase
      .from("wireframe_elements")
      .select("id")
      .eq("parent_block_id", blockId);
    if (exErr) return { error: new Error(exErr.message) };

    const keep = new Set(ordered.map((r) => r.id));
    const toDelete =
      existing?.filter((e) => !keep.has(e.id)).map((e) => e.id) ?? [];
    if (toDelete.length) {
      const { error: delErr } = await supabase
        .from("wireframe_elements")
        .delete()
        .in("id", toDelete);
      if (delErr) return { error: new Error(delErr.message) };
    }
  }

  return { error: null };
}
