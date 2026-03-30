import type { Edge, Node } from "reactflow";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PageNavigationEdgeRow, PageNodeData, PageRow } from "@/lib/types";

export async function persistSitemap(
  supabase: SupabaseClient,
  projectId: string,
  pages: Pick<PageRow, "id" | "name" | "order" | "description" | "sitemap_x" | "sitemap_y">[],
  navEdges: Pick<
    PageNavigationEdgeRow,
    "id" | "source_page_id" | "target_page_id" | "label"
  >[],
  pageNodes: Node<PageNodeData>[]
): Promise<{ error: Error | null }> {
  const now = new Date().toISOString();

  const { error: projErr } = await supabase
    .from("projects")
    .update({ updated_at: now })
    .eq("id", projectId);
  if (projErr) return { error: new Error(projErr.message) };

  const posByPageId = new Map(
    pageNodes.map((n) => [n.id, { x: n.position.x, y: n.position.y }])
  );

  const pageRows = pages.map((p) => {
    const pos = posByPageId.get(p.id);
    return {
      id: p.id,
      project_id: projectId,
      name: p.name,
      order: p.order,
      description: p.description,
      sitemap_x: pos?.x ?? p.sitemap_x,
      sitemap_y: pos?.y ?? p.sitemap_y,
    };
  });

  if (pageRows.length) {
    const { error: upErr } = await supabase.from("pages").upsert(pageRows, { onConflict: "id" });
    if (upErr) return { error: new Error(upErr.message) };
  }

  const edgeRows = navEdges.map((e) => ({
    id: e.id,
    project_id: projectId,
    source_page_id: e.source_page_id,
    target_page_id: e.target_page_id,
    label: e.label,
  }));

  if (edgeRows.length) {
    const { error: eUp } = await supabase
      .from("page_navigation_edges")
      .upsert(edgeRows, { onConflict: "id" });
    if (eUp) return { error: new Error(eUp.message) };
  }

  const { data: existingNav, error: exNErr } = await supabase
    .from("page_navigation_edges")
    .select("id")
    .eq("project_id", projectId);
  if (exNErr) return { error: new Error(exNErr.message) };

  const keepNav = new Set(navEdges.map((e) => e.id));
  const toDeleteNav =
    existingNav?.filter((x) => !keepNav.has(x.id)).map((x) => x.id) ?? [];
  if (toDeleteNav.length) {
    const { error: dN } = await supabase.from("page_navigation_edges").delete().in("id", toDeleteNav);
    if (dN) return { error: new Error(dN.message) };
  }

  return { error: null };
}

/** Build React Flow edges from DB rows */
export function pageNavRowsToEdges(rows: PageNavigationEdgeRow[]): Edge[] {
  return rows.map((e) => ({
    id: e.id,
    source: e.source_page_id,
    target: e.target_page_id,
    label: e.label ?? undefined,
  }));
}
