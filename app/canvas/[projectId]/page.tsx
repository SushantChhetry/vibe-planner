import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfileId } from "@/lib/auth/profile";
import { CanvasEditor } from "@/components/canvas/CanvasEditor";
import { getSubscriptionState } from "@/lib/subscription";
import type {
  ProjectBundle,
  BundleBlock,
  EdgeRow,
  WireframeElementRow,
  PageNavigationEdgeRow,
} from "@/lib/types";

type RawWireframeRow = {
  id: string;
  parent_block_id: string;
  element_type: string;
  label: string | null;
  sort_order: number;
  created_at: string;
  frame_x?: number | null;
  frame_y?: number | null;
  frame_w?: number | null;
  frame_h?: number | null;
  meta?: unknown;
};

function normalizeWireframeMeta(raw: unknown): import("@/lib/types").WireframeElementMeta {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const out: import("@/lib/types").WireframeElementMeta = {};
  if (typeof o.linkPageId === "string") out.linkPageId = o.linkPageId;
  if (typeof o.onClickDescription === "string") out.onClickDescription = o.onClickDescription;
  if (typeof o.inputType === "string") out.inputType = o.inputType;
  if (typeof o.fieldBehavior === "string") out.fieldBehavior = o.fieldBehavior;
  return out;
}

function normalizeWireRow(raw: RawWireframeRow, index: number): WireframeElementRow {
  const ok = [raw.frame_x, raw.frame_y, raw.frame_w, raw.frame_h].every(
    (v) => typeof v === "number" && !Number.isNaN(v)
  );
  const label = raw.label ?? "";
  const meta = normalizeWireframeMeta(raw.meta);
  if (ok) {
    return {
      id: raw.id,
      parent_block_id: raw.parent_block_id,
      element_type: raw.element_type,
      label,
      sort_order: raw.sort_order,
      created_at: raw.created_at,
      frame_x: raw.frame_x!,
      frame_y: raw.frame_y!,
      frame_w: raw.frame_w!,
      frame_h: raw.frame_h!,
      meta,
    };
  }
  return {
    id: raw.id,
    parent_block_id: raw.parent_block_id,
    element_type: raw.element_type,
    label,
    sort_order: raw.sort_order,
    created_at: raw.created_at,
    frame_x: 24,
    frame_y: 24 + index * 72,
    frame_w: 160,
    frame_h: 48,
    meta,
  };
}

type PagePayload = {
  id: string;
  name: string;
  order: number;
  description?: string | null;
  sitemap_x?: number | null;
  sitemap_y?: number | null;
  blocks: (BundleBlock & { wireframe_elements?: WireframeElementRow[] | null })[] | null;
  edges: EdgeRow[] | null;
};

type PageNavPayload = {
  id: string;
  project_id: string;
  source_page_id: string;
  target_page_id: string;
  label: string | null;
};

export default async function CanvasProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const profileId = await requireProfileId();
  const supabase = await createClient();
  const { isPro } = await getSubscriptionState(supabase, profileId);

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      page_navigation_edges ( id, project_id, source_page_id, target_page_id, label ),
      pages (
        id,
        name,
        order,
        description,
        sitemap_x,
        sitemap_y,
        blocks ( *, wireframe_elements ( * ) ),
        edges ( * )
      )
    `
    )
    .eq("id", projectId)
    .single();

  if (error || !data) {
    notFound();
  }

  const rawPagesFirst = (data.pages ?? []) as PagePayload[];
  for (const p of rawPagesFirst) {
    if (!p.blocks?.length) {
      const { data: blk, error: insErr } = await supabase
        .from("blocks")
        .insert({
          page_id: p.id,
          type: "Custom",
          name: "Page layout",
          description: "",
          position_x: 0,
          position_y: 0,
        })
        .select("id, page_id, type, name, description, position_x, position_y, created_at")
        .single();
      if (insErr || !blk) {
        notFound();
      }
      p.blocks = [{ ...blk, wireframe_elements: [] }];
    }
  }

  const projectData = data;

  const navRaw = (projectData as { page_navigation_edges?: PageNavPayload[] | null })
    .page_navigation_edges;
  const page_navigation_edges = (navRaw ?? []) as PageNavigationEdgeRow[];

  const rawPages = (projectData.pages ?? []) as PagePayload[];
  const pages = rawPages
    .map((p) => ({
      id: p.id,
      name: p.name,
      order: p.order,
      description: p.description ?? "",
      sitemap_x: p.sitemap_x ?? null,
      sitemap_y: p.sitemap_y ?? null,
      blocks: (p.blocks ?? []).map((b) => {
        const wiresRaw = [...(b.wireframe_elements ?? [])].sort(
          (a, c) => a.sort_order - c.sort_order
        ) as RawWireframeRow[];
        const wires = wiresRaw.map((w, idx) => normalizeWireRow(w, idx));
        return {
          id: b.id,
          page_id: b.page_id,
          type: b.type,
          name: b.name,
          description: b.description,
          position_x: b.position_x,
          position_y: b.position_y,
          created_at: b.created_at,
          wireframe_elements: wires,
        } satisfies BundleBlock;
      }),
      edges: (p.edges ?? []) as EdgeRow[],
    }))
    .sort((a, b) => a.order - b.order);

  const bundle: ProjectBundle = {
    project: { id: projectData.id, name: projectData.name },
    pages,
    page_navigation_edges,
  };

  return <CanvasEditor bundle={bundle} isPro={isPro} />;
}
