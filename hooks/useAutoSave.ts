"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Edge, Node } from "reactflow";
import { useClerkSupabase } from "@/lib/supabase";
import { persistPageCanvas } from "@/lib/persist-page";
import { persistSitemap } from "@/lib/persist-sitemap";
import { persistWireframesForPage } from "@/lib/persist-wireframe";
import type { BlockNodeData, PageNodeData, PageRow, WireframeElementRow } from "@/lib/types";
import { SITE_MAP_TAB_ID } from "@/lib/types";
import type { SaveStatus } from "@/components/ui/TopBar";
import { serializePageSnapshot, serializeSitemapSnapshot } from "@/lib/canvas-serial";

export function useAutoSave({
  projectId,
  activeTab,
  pageNodes,
  pageEdges,
  wireframeByBlockId,
  sitemapPagesMeta,
  sitemapNodes,
  baselineSerial,
}: {
  projectId: string;
  activeTab: string;
  pageNodes: Node<BlockNodeData>[];
  pageEdges: Edge[];
  wireframeByBlockId: Record<string, WireframeElementRow[]>;
  sitemapPagesMeta: Pick<
    PageRow,
    "id" | "name" | "order" | "description" | "sitemap_x" | "sitemap_y"
  >[];
  sitemapNodes: Node<PageNodeData>[];
  baselineSerial: string;
}) {
  const supabase = useClerkSupabase();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const pageNodesRef = useRef(pageNodes);
  const pageEdgesRef = useRef(pageEdges);
  const wireRef = useRef(wireframeByBlockId);
  const sitemapPagesRef = useRef(sitemapPagesMeta);
  const sitemapNodesRef = useRef(sitemapNodes);
  pageNodesRef.current = pageNodes;
  pageEdgesRef.current = pageEdges;
  wireRef.current = wireframeByBlockId;
  sitemapPagesRef.current = sitemapPagesMeta;
  sitemapNodesRef.current = sitemapNodes;

  const lastSaved = useRef<string>(baselineSerial);
  const skipOnce = useRef(false);

  useEffect(() => {
    lastSaved.current = baselineSerial;
    skipOnce.current = true;
  }, [baselineSerial]);

  const onMap = activeTab === SITE_MAP_TAB_ID;
  const serial = onMap
    ? serializeSitemapSnapshot(sitemapPagesMeta, sitemapNodes, pageEdges)
    : serializePageSnapshot(activeTab, pageNodes, pageEdges, wireframeByBlockId);

  const flush = useCallback(async () => {
    setSaveStatus("saving");

    if (onMap) {
      const sn = sitemapNodesRef.current;
      const se = pageEdgesRef.current.map((e) => ({
        id: e.id,
        source_page_id: e.source,
        target_page_id: e.target,
        label: typeof e.label === "string" && e.label ? e.label : null,
      }));
      const { error } = await persistSitemap(
        supabase,
        projectId,
        sitemapPagesRef.current,
        se,
        sn
      );
      if (error) {
        setSaveStatus("error");
        return;
      }
      lastSaved.current = serializeSitemapSnapshot(
        sitemapPagesRef.current,
        sitemapNodesRef.current,
        pageEdgesRef.current
      );
    } else {
      const pid = activeTab;
      const n = pageNodesRef.current;
      const e = pageEdgesRef.current;
      const w = wireRef.current;
      const { error: cErr } = await persistPageCanvas(supabase, projectId, pid, n, e);
      if (cErr) {
        setSaveStatus("error");
        return;
      }
      const blockIds = n.map((node) => node.id);
      const { error: wErr } = await persistWireframesForPage(supabase, blockIds, w);
      if (wErr) {
        setSaveStatus("error");
        return;
      }
      lastSaved.current = serializePageSnapshot(pid, n, e, w);
    }

    setSaveStatus("saved");
    window.setTimeout(() => setSaveStatus("idle"), 2000);
  }, [projectId, activeTab, onMap, supabase]);

  useEffect(() => {
    if (skipOnce.current) {
      skipOnce.current = false;
      return;
    }
    if (serial === lastSaved.current) return;
    const t = window.setTimeout(() => {
      void flush();
    }, 800);

    return () => window.clearTimeout(t);
  }, [serial, flush]);

  return { saveStatus, flush };
}
