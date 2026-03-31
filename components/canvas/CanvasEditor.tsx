"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import ReactFlow, {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import type {
  ProjectBundle,
  ExportSnapshot,
  PageNodeData,
  WireframeElementRow,
} from "@/lib/types";
import { SITE_MAP_TAB_ID } from "@/lib/types";
import type { BlockNodeData } from "@/lib/types";
import { PageNode } from "@/components/canvas/PageNode";
import { TopBar, type SaveStatus } from "@/components/ui/TopBar";
import { PageTabs } from "@/components/ui/PageTabs";
import { CanvasHistoryButtons, CanvasToolbar } from "@/components/canvas/CanvasToolbar";
import { CanvasHistoryContext } from "@/components/canvas/CanvasHistoryContext";
import { useCanvasHistory } from "@/hooks/useCanvasHistory";
import { SitemapContextMenu } from "@/components/canvas/SitemapContextMenu";
import { AddPageModal } from "@/components/canvas/AddPageModal";
import { SiteMapActionsProvider } from "@/components/canvas/SiteMapActionsContext";
import { ExportDrawer } from "@/components/canvas/ExportDrawer";
import {
  CanvasAppearancePicker,
  CANVAS_LOOK_DEFAULT,
  readStoredCanvasLook,
  type CanvasLook,
} from "@/components/canvas/CanvasAppearancePicker";
import { TeamInviteButton } from "@/components/canvas/TeamInviteButton";
import { WireframeEditor } from "@/components/canvas/WireframeEditor";
import { PremiumModal } from "@/components/billing/PremiumModal";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useDebouncedProjectRename } from "@/hooks/useProject";
import type { PageDraft } from "@/lib/canvas-history";
import { cloneEdges, cloneNodes } from "@/lib/canvas-history";
import { serializePageSnapshot, serializeSitemapSnapshot } from "@/lib/canvas-serial";
import { pageNavRowsToEdges } from "@/lib/persist-sitemap";
import {
  buildPageHostIndex,
  buildWireframeMapForHosts,
  makeHostCanvasNode,
  emptyPageDraft,
} from "@/lib/page-wireframe-host";
import { useClerkSupabase } from "@/lib/supabase";
import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { TEMPLATES, flattenTemplateToWireRows } from "@/lib/templates";

type FlowData = BlockNodeData | PageNodeData;
type FlowNode = Node<FlowData>;

function buildSitemapNodes(bundle: ProjectBundle): Node<PageNodeData>[] {
  const sorted = [...bundle.pages].sort((a, b) => a.order - b.order);
  return sorted.map((p, i) => ({
    id: p.id,
    type: "page",
    position: {
      x: p.sitemap_x ?? 40 + (i % 4) * 300,
      y: p.sitemap_y ?? 40 + Math.floor(i / 4) * 180,
    },
    data: { name: p.name, description: p.description ?? "" },
  }));
}

function cloneFlowNodes(ns: FlowNode[]): FlowNode[] {
  return ns.map((n) => ({
    ...n,
    position: { ...n.position },
    data: { ...n.data },
  }));
}

function CanvasWorkspace({
  bundle,
  isPro,
}: {
  bundle: ProjectBundle;
  isPro: boolean;
}) {
  const supabase = useClerkSupabase();
  const sortedPages = useMemo(
    () => [...bundle.pages].sort((a, b) => a.order - b.order),
    [bundle.pages]
  );

  const pageHostBlockRef = useRef(buildPageHostIndex(bundle.pages));

  const pageBlockCacheRef = useRef<Record<string, PageDraft> | null>(null);
  if (pageBlockCacheRef.current === null) {
    const hosts = buildPageHostIndex(bundle.pages);
    const c: Record<string, PageDraft> = {};
    for (const p of bundle.pages) {
      const hid = hosts[p.id];
      if (hid) c[p.id] = emptyPageDraft(hid);
      else c[p.id] = { nodes: [], edges: [] };
    }
    pageBlockCacheRef.current = c;
  }

  const sitemapNodesSeed = useMemo(() => buildSitemapNodes(bundle), [bundle]);
  const sitemapEdgesSeed = useMemo(
    () => pageNavRowsToEdges(bundle.page_navigation_edges ?? []),
    [bundle.page_navigation_edges]
  );

  const sitemapSnapshotRef = useRef<{ nodes: FlowNode[]; edges: Edge[] }>({
    nodes: cloneFlowNodes(sitemapNodesSeed as FlowNode[]),
    edges: cloneEdges(sitemapEdgesSeed),
  });

  const initialWireMap = useMemo(() => buildWireframeMapForHosts(bundle), [bundle]);

  const [activeTab, setActiveTab] = useState<string>(SITE_MAP_TAB_ID);
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowData>(
    cloneFlowNodes(sitemapNodesSeed as FlowNode[])
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(cloneEdges(sitemapEdgesSeed));

  const [wireframeByBlockId, setWireframeByBlockId] =
    useState<Record<string, WireframeElementRow[]>>(initialWireMap);

  const [pagesMeta, setPagesMeta] = useState<
    Pick<
      import("@/lib/types").PageRow,
      "id" | "name" | "order" | "description" | "sitemap_x" | "sitemap_y"
    >[]
  >(() =>
    sortedPages.map((p) => ({
      id: p.id,
      name: p.name,
      order: p.order,
      description: p.description ?? "",
      sitemap_x: p.sitemap_x,
      sitemap_y: p.sitemap_y,
    }))
  );

  const [projectName, setProjectName] = useState(bundle.project.name);
  const [baselineSerial, setBaselineSerial] = useState(() =>
    serializeSitemapSnapshot(pagesMeta, sitemapNodesSeed as Node<PageNodeData>[], sitemapEdgesSeed)
  );

  const [menu, setMenu] = useState<{
    clientX: number;
    clientY: number;
    flowX: number;
    flowY: number;
  } | null>(null);
  const [addPageOpen, setAddPageOpen] = useState(false);
  const pendingAddFlowRef = useRef<{ x: number; y: number }>({ x: 80, y: 80 });
  const [exportOpen, setExportOpen] = useState(false);
  const [renameSaveStatus, setRenameSaveStatus] = useState<SaveStatus>("idle");
  const [premium, setPremium] = useState<{ title: string; description: string } | null>(null);
  const [appearance, setAppearance] = useState<CanvasLook>(CANVAS_LOOK_DEFAULT);

  const onMap = activeTab === SITE_MAP_TAB_ID;
  const designPageId = onMap ? null : activeTab;
  const hostBlockId =
    !onMap && designPageId ? pageHostBlockRef.current[designPageId] ?? null : null;

  const blockNodesForSave: Node<BlockNodeData>[] =
    !onMap && hostBlockId ? [makeHostCanvasNode(hostBlockId)] : [];

  const openPremium = useCallback((title: string, description: string) => {
    setPremium({ title, description });
  }, []);

  useEffect(() => {
    if (!isPro) {
      setAppearance(CANVAS_LOOK_DEFAULT);
      return;
    }
    const stored = readStoredCanvasLook();
    if (stored) setAppearance(stored);
  }, [isPro]);

  /** Stable refs for React Flow (#002 — avoid new nodeTypes / edgeOptions objects each render). */
  const flowNodeTypes = useMemo(() => ({ page: PageNode }), []);
  const defaultEdgeOptions = useMemo(
    () => ({
      style: { stroke: appearance.edge, strokeWidth: 1.5 },
    }),
    [appearance.edge]
  );
  const flowProOptions = useMemo(() => ({ hideAttribution: true }), []);

  const rfInstance = useRef<ReactFlowInstance | null>(null);
  const wireframeRef = useRef(initialWireMap);
  wireframeRef.current = wireframeByBlockId;

  const { flushProjectName } = useDebouncedProjectRename(
    bundle.project.id,
    projectName,
    bundle.project.name,
    setRenameSaveStatus
  );

  const sitemapNodesForSave = (onMap ? nodes : []) as Node<PageNodeData>[];
  const sitemapEdgesForSave = (onMap ? edges : []) as Edge[];

  const { saveStatus, flush } = useAutoSave({
    projectId: bundle.project.id,
    activeTab,
    pageNodes: blockNodesForSave,
    pageEdges: onMap ? sitemapEdgesForSave : ([] as Edge[]),
    wireframeByBlockId,
    sitemapPagesMeta: pagesMeta,
    sitemapNodes: sitemapNodesForSave,
    baselineSerial,
  });

  const barSaveStatus = useMemo((): SaveStatus => {
    if (renameSaveStatus === "saving" || saveStatus === "saving") return "saving";
    if (renameSaveStatus === "error" || saveStatus === "error") return "error";
    if (renameSaveStatus === "saved" || saveStatus === "saved") return "saved";
    return "idle";
  }, [renameSaveStatus, saveStatus]);

  const {
    beforeMutate: historyBeforeMutate,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
  } = useCanvasHistory({
    pageId: designPageId,
    setPageId: setActiveTab,
    cacheRef: pageBlockCacheRef,
    wireframeRef,
    setNodes: setNodes as (v: Node<BlockNodeData>[] | ((n: Node<BlockNodeData>[]) => Node<BlockNodeData>[])) => void,
    setEdges,
    setWireframeByBlockId,
    setBaselineSerial,
  });

  const beforeMutate = historyBeforeMutate;

  const onNodesChangeWrapped = useCallback(
    (changes: NodeChange[]) => {
      if (changes.some((c) => c.type === "remove")) beforeMutate();
      onNodesChange(changes);
    },
    [beforeMutate, onNodesChange]
  );

  const onEdgesChangeWrapped = useCallback(
    (changes: EdgeChange[]) => {
      if (changes.some((c) => c.type === "remove")) beforeMutate();
      onEdgesChange(changes);
    },
    [beforeMutate, onEdgesChange]
  );

  useEffect(() => {
    if (activeTab !== SITE_MAP_TAB_ID) return;
    sitemapSnapshotRef.current = { nodes: cloneFlowNodes(nodes), edges: cloneEdges(edges) };
  }, [activeTab, nodes, edges]);

  useEffect(() => {
    const c = pageBlockCacheRef.current;
    if (!c) return;
    const draftBlockIds = new Set<string>();
    for (const draft of Object.values(c)) {
      for (const n of draft.nodes) draftBlockIds.add(n.id);
    }
    /** Host block ids for every page — always keep wireframe state for these even if a draft is momentarily empty. */
    const hostBlockIds = new Set(Object.values(pageHostBlockRef.current));
    setWireframeByBlockId((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (draftBlockIds.has(k) || hostBlockIds.has(k)) continue;
        delete next[k];
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [nodes, edges, activeTab]);

  useEffect(() => {
    if (!onMap) return;
    const inst = rfInstance.current;
    if (!inst) return;
    const id = window.requestAnimationFrame(() => {
      inst.fitView({ padding: 0.2, duration: 200 });
    });
    return () => window.cancelAnimationFrame(id);
  }, [onMap, activeTab, nodes.length, edges.length]);

  const pagesMetaRef = useRef(pagesMeta);
  pagesMetaRef.current = pagesMeta;

  const syncBaselineForTab = useCallback(
    (tab: string, nextNodes: FlowNode[], nextEdges: Edge[]) => {
      const meta = pagesMetaRef.current;
      setBaselineSerial(
        tab === SITE_MAP_TAB_ID
          ? serializeSitemapSnapshot(meta, nextNodes as Node<PageNodeData>[], nextEdges)
          : (() => {
              const hid = pageHostBlockRef.current[tab];
              const pn = hid ? [makeHostCanvasNode(hid)] : [];
              return serializePageSnapshot(tab, pn, [], wireframeRef.current);
            })()
      );
    },
    []
  );

  /** New projects (or rare load races) may lack a host block in the ref — wireframe would render nothing without this. */
  const ensureHostBlockForPage = useCallback(
    async (pageId: string): Promise<string | null> => {
      const hit = pageHostBlockRef.current[pageId];
      if (hit) return hit;

      const { data: rows, error: selErr } = await supabase
        .from("blocks")
        .select("id, created_at")
        .eq("page_id", pageId)
        .order("created_at", { ascending: true });

      if (selErr) {
        console.error("[canvas] ensureHostBlockForPage select:", selErr);
        return null;
      }

      let hostId = rows?.[0]?.id ?? null;

      if (!hostId) {
        const { data: ins, error: insErr } = await supabase
          .from("blocks")
          .insert({
            page_id: pageId,
            type: "Custom",
            name: "Page layout",
            description: "",
            position_x: 0,
            position_y: 0,
          })
          .select("id")
          .single();
        if (insErr || !ins) {
          console.error("[canvas] ensureHostBlockForPage insert:", insErr);
          return null;
        }
        hostId = ins.id as string;
      }

      pageHostBlockRef.current[pageId] = hostId;
      setWireframeByBlockId((prev) =>
        prev[hostId] !== undefined ? prev : { ...prev, [hostId]: [] }
      );
      const cache = pageBlockCacheRef.current;
      if (cache && cache[pageId] === undefined) {
        cache[pageId] = emptyPageDraft(hostId);
      }
      return hostId;
    },
    [supabase, setWireframeByBlockId]
  );

  const selectTabFixed = useCallback(
    async (next: string) => {
      if (next === activeTab) return;
      await flush();
      clearHistory();
      if (activeTab === SITE_MAP_TAB_ID) {
        sitemapSnapshotRef.current = { nodes: cloneFlowNodes(nodes), edges: cloneEdges(edges) };
      } else {
        const c = pageBlockCacheRef.current;
        const hidPrev = pageHostBlockRef.current[activeTab];
        if (c && activeTab && hidPrev) c[activeTab] = emptyPageDraft(hidPrev);
      }
      if (next === SITE_MAP_TAB_ID) {
        const { nodes: sn, edges: se } = sitemapSnapshotRef.current;
        setNodes(cloneFlowNodes(sn));
        setEdges(cloneEdges(se));
        setActiveTab(next);
        syncBaselineForTab(next, cloneFlowNodes(sn), cloneEdges(se));
        return;
      }
      const c = pageBlockCacheRef.current;
      let hid: string | null = pageHostBlockRef.current[next] ?? null;
      if (!hid) {
        hid = await ensureHostBlockForPage(next);
      }
      if (!hid) {
        console.error("[canvas] No host block for page; staying on current tab:", next);
        return;
      }
      let draft =
        c?.[next] ?? emptyPageDraft(hid);
      if (!draft.nodes.length || !draft.nodes.some((n) => n.id === hid)) {
        draft = emptyPageDraft(hid);
        if (c) c[next] = draft;
      }
      setNodes(cloneNodes(draft.nodes) as FlowNode[]);
      setEdges(cloneEdges(draft.edges));
      setActiveTab(next);
      syncBaselineForTab(next, cloneNodes(draft.nodes) as FlowNode[], cloneEdges(draft.edges));
    },
    [
      activeTab,
      flush,
      clearHistory,
      nodes,
      edges,
      setNodes,
      setEdges,
      syncBaselineForTab,
      ensureHostBlockForPage,
    ]
  );

  const patchPageMeta = useCallback(
    (pageId: string, patch: { name?: string; description?: string }) => {
      setPagesMeta((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, ...patch } : p))
      );
      if (activeTab === SITE_MAP_TAB_ID) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === pageId && n.type === "page"
              ? { ...n, data: { ...n.data, ...patch } }
              : n
          )
        );
      }
    },
    [activeTab, setNodes]
  );

  const removePage = useCallback(
    async (pageId: string) => {
      await flush();
      const hid = pageHostBlockRef.current[pageId];
      const blockIds = hid ? [hid] : [];
      const { error } = await supabase.from("pages").delete().eq("id", pageId);
      if (error) return;
      const c = pageBlockCacheRef.current;
      if (c) delete c[pageId];
      delete pageHostBlockRef.current[pageId];
      setPagesMeta((prev) => prev.filter((p) => p.id !== pageId));
      setWireframeByBlockId((prev) => {
        const next = { ...prev };
        for (const bid of blockIds) delete next[bid];
        return next;
      });
      sitemapSnapshotRef.current.nodes = sitemapSnapshotRef.current.nodes.filter((n) => n.id !== pageId);
      sitemapSnapshotRef.current.edges = sitemapSnapshotRef.current.edges.filter(
        (e) => e.source !== pageId && e.target !== pageId
      );
      if (activeTab === pageId) {
        clearHistory();
        setActiveTab(SITE_MAP_TAB_ID);
        setNodes(cloneFlowNodes(sitemapSnapshotRef.current.nodes));
        setEdges(cloneEdges(sitemapSnapshotRef.current.edges));
        syncBaselineForTab(
          SITE_MAP_TAB_ID,
          sitemapSnapshotRef.current.nodes,
          sitemapSnapshotRef.current.edges
        );
        return;
      }
      if (activeTab === SITE_MAP_TAB_ID) {
        setNodes((nds) => nds.filter((n) => n.id !== pageId));
        setEdges((eds) => eds.filter((e) => e.source !== pageId && e.target !== pageId));
      }
      clearHistory();
    },
    [flush, activeTab, setNodes, setEdges, clearHistory, syncBaselineForTab, supabase]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey) {
        const t = e.target;
        if (
          t instanceof HTMLElement &&
          (t.tagName === "INPUT" ||
            t.tagName === "TEXTAREA" ||
            t.tagName === "SELECT" ||
            t.isContentEditable)
        ) {
          return;
        }
        if (!designPageId) return;
        if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, designPageId]);

  const onConnect = useCallback(
    (params: Connection) => {
      beforeMutate();
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: crypto.randomUUID(),
          },
          eds
        )
      );
    },
    [beforeMutate, setEdges]
  );

  const onPaneContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!onMap) return;
      e.preventDefault();
      const inst = rfInstance.current;
      if (!inst) return;
      const flow = inst.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setMenu({
        clientX: e.clientX,
        clientY: e.clientY,
        flowX: flow.x,
        flowY: flow.y,
      });
    },
    [onMap]
  );

  const applyTemplate = useCallback(
    (templateId: string) => {
      if (onMap || !designPageId) return;
      const hid = pageHostBlockRef.current[designPageId];
      if (!hid) return;
      beforeMutate();
      const t = TEMPLATES.find((x) => x.id === templateId);
      if (!t) return;
      const rows = flattenTemplateToWireRows(t, hid);
      setWireframeByBlockId((prev) => ({ ...prev, [hid]: rows }));
      const c = pageBlockCacheRef.current;
      if (c && designPageId) c[designPageId] = emptyPageDraft(hid);
      setNodes([makeHostCanvasNode(hid)] as FlowNode[]);
      setEdges([]);
    },
    [beforeMutate, onMap, designPageId, setNodes, setEdges]
  );

  const clearPageWireframe = useCallback(() => {
    if (onMap || !designPageId) return;
    const hid = pageHostBlockRef.current[designPageId];
    if (!hid) return;
    const els = wireframeByBlockId[hid] ?? [];
    if (els.length === 0) return;
    beforeMutate();
    setWireframeByBlockId((prev) => ({ ...prev, [hid]: [] }));
  }, [beforeMutate, onMap, designPageId, wireframeByBlockId, setWireframeByBlockId]);

  const openPageDesign = useCallback(
    (pageId: string) => {
      void selectTabFixed(pageId);
    },
    [selectTabFixed]
  );

  const beginAddPage = useCallback((flowX: number, flowY: number) => {
    pendingAddFlowRef.current = { x: flowX, y: flowY };
    setAddPageOpen(true);
  }, []);

  const confirmAddPage = useCallback(
    async (name: string, description: string) => {
      await flush();
      const maxOrder =
        pagesMeta.length === 0 ? -1 : Math.max(...pagesMeta.map((p) => p.order));
      const pos = pendingAddFlowRef.current;
      const { data: pageRow, error } = await supabase
        .from("pages")
        .insert({
          project_id: bundle.project.id,
          name,
          description,
          order: maxOrder + 1,
          sitemap_x: pos.x,
          sitemap_y: pos.y,
        })
        .select("id, name, order, description, sitemap_x, sitemap_y")
        .single();

      if (error || !pageRow) return;

      const pageId = pageRow.id as string;

      const { data: blk, error: bErr } = await supabase
        .from("blocks")
        .insert({
          page_id: pageId,
          type: "Custom",
          name: "Page layout",
          description: "",
          position_x: 0,
          position_y: 0,
        })
        .select("id")
        .single();

      if (bErr || !blk) return;

      const bid = blk.id as string;
      pageHostBlockRef.current[pageId] = bid;

      const newMeta = {
        id: pageId,
        name: pageRow.name as string,
        order: pageRow.order as number,
        description: (pageRow.description as string) ?? "",
        sitemap_x: pageRow.sitemap_x as number | null,
        sitemap_y: pageRow.sitemap_y as number | null,
      };
      setPagesMeta((prev) => [...prev, newMeta]);
      pageBlockCacheRef.current![pageId] = emptyPageDraft(bid);
      setWireframeByBlockId((prev) => ({ ...prev, [bid]: [] }));

      const flowNode: FlowNode = {
        id: pageId,
        type: "page",
        position: { x: pos.x, y: pos.y },
        data: { name: newMeta.name, description: newMeta.description },
      };

      if (activeTab === SITE_MAP_TAB_ID) {
        setNodes((nds) => [...nds, flowNode]);
      } else {
        sitemapSnapshotRef.current.nodes = [...sitemapSnapshotRef.current.nodes, flowNode];
      }
      clearHistory();
    },
    [flush, pagesMeta, bundle.project.id, activeTab, setNodes, clearHistory, supabase]
  );

  const navEdgesForExport =
    activeTab === SITE_MAP_TAB_ID ? edges : sitemapSnapshotRef.current.edges;

  const exportSnapshot: ExportSnapshot | null = useMemo(() => {
    if (!exportOpen || !pageBlockCacheRef.current) return null;
    const ordered = [...pagesMeta].sort((a, b) => a.order - b.order);
    const pageNavigation = navEdgesForExport.map((e) => ({
      id: e.id,
      source_page_id: e.source,
      target_page_id: e.target,
      label: typeof e.label === "string" && e.label ? e.label : null,
    }));
    const pages = ordered.map((meta) => {
      const draft = pageBlockCacheRef.current![meta.id] ?? {
        nodes: [] as Node<BlockNodeData>[],
        edges: [] as Edge[],
      };
      return {
        id: meta.id,
        name: meta.name,
        order: meta.order,
        description: meta.description,
        blocks: draft.nodes.map((n) => ({
          id: n.id,
          type: n.data.blockType,
          name: n.data.name,
          description: n.data.description,
          position_x: n.position.x,
          position_y: n.position.y,
          wireframe: [...(wireframeByBlockId[n.id] ?? [])]
            .sort((a, b) => a.frame_y - b.frame_y || a.frame_x - b.frame_x)
            .map((w) => ({
              element_type: w.element_type,
              label: w.label,
              frame_x: w.frame_x,
              frame_y: w.frame_y,
              frame_w: w.frame_w,
              frame_h: w.frame_h,
              meta: w.meta && Object.keys(w.meta).length ? w.meta : undefined,
            })),
        })),
        edges: draft.edges.map((e) => ({
          id: e.id,
          source_block_id: e.source,
          target_block_id: e.target,
          label: typeof e.label === "string" && e.label ? e.label : null,
        })),
      };
    });
    void nodes;
    void edges;
    void wireframeByBlockId;
    void navEdgesForExport;
    return { projectName, pages, pageNavigation };
  }, [exportOpen, pagesMeta, projectName, nodes, edges, wireframeByBlockId, navEdgesForExport]);

  const currentPageName =
    pagesMeta.find((p) => p.id === designPageId)?.name ?? "Page";

  const wireElementsCount = hostBlockId ? (wireframeByBlockId[hostBlockId] ?? []).length : 0;

  const siteMapActions = useMemo(
    () => ({
      patchPage: patchPageMeta,
      openPageDesign,
      removePage,
    }),
    [patchPageMeta, openPageDesign, removePage]
  );

  return (
    <CanvasHistoryContext.Provider value={{ beforeMutate }}>
      <SiteMapActionsProvider value={siteMapActions}>
        <div className="flex h-screen flex-col overflow-hidden bg-white">
          <TopBar
            backHref="/dashboard"
            projectName={projectName}
            onProjectNameChange={setProjectName}
            onProjectNameBlur={flushProjectName}
            saveStatus={barSaveStatus}
            center={
              <PageTabs
                pages={pagesMeta}
                currentPageId={activeTab}
                onSelect={(id) => void selectTabFixed(id)}
                onAdd={() => beginAddPage(120 + pagesMeta.length * 24, 120 + pagesMeta.length * 24)}
              />
            }
            footer={
              <>
                <div className="flex shrink-0 items-center justify-center gap-1 sm:gap-1.5">
                  <TeamInviteButton
                    isPro={isPro}
                    onPremiumClick={() =>
                      openPremium(
                        "Team collaboration is a Premium feature",
                        "Upgrade to be first in line for shared workspaces and invites."
                      )
                    }
                  />
                  <CanvasAppearancePicker
                    isPro={isPro}
                    value={appearance}
                    onChange={setAppearance}
                    onPremiumClick={() =>
                      openPremium(
                        "Canvas themes are a Premium feature",
                        "Upgrade to customize dot grid and connection line colors."
                      )
                    }
                  />
                  <Link
                    href="/help/how-tos"
                    className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 text-sm text-stone-600 hover:bg-white/80 hover:text-stone-900"
                    title="Help and how-tos"
                  >
                    <CircleHelp className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="hidden sm:inline">Help</span>
                  </Link>
                </div>
                <div className="flex shrink-0 items-center justify-center gap-1 px-1 sm:px-2">
                  <CanvasHistoryButtons
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onUndo={undo}
                    onRedo={redo}
                    onClearAll={
                      onMap
                        ? () => {
                            beforeMutate();
                            setEdges([]);
                          }
                        : clearPageWireframe
                    }
                    clearAllDisabled={onMap ? edges.length === 0 : wireElementsCount === 0}
                    clearAllLabel={onMap ? "Clear page links" : "Clear wireframe"}
                    clearAllConfirmDescription={
                      onMap
                        ? "All navigation links between pages will be removed from the site map."
                        : "All sections and elements on this page wireframe will be removed. You can use Undo afterward."
                    }
                  />
                </div>
                <div className="flex shrink-0 items-center justify-center gap-2">
                  <CanvasToolbar
                    onExport={() => setExportOpen(true)}
                    onTemplate={applyTemplate}
                    isPro={isPro}
                    disableTemplates={onMap}
                    onPremiumTemplates={() =>
                      openPremium(
                        "AI blueprints are a Premium feature",
                        "Upgrade for full SaaS, landing, mobile, and e‑commerce maps with rich wireframes."
                      )
                    }
                  />
                </div>
              </>
            }
          />

          <div className="relative min-h-0 flex-1 bg-canvas">
            {onMap ? (
              <>
                <ReactFlow
                  className="h-full w-full"
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChangeWrapped}
                  onEdgesChange={onEdgesChangeWrapped}
                  onConnect={onConnect}
                  onNodeDragStart={() => beforeMutate()}
                  onSelectionDragStart={() => beforeMutate()}
                  nodeTypes={flowNodeTypes}
                  onPaneContextMenu={onPaneContextMenu}
                  onInit={(inst) => {
                    rfInstance.current = inst;
                    inst.fitView({ padding: 0.2, duration: 0 });
                  }}
                  deleteKeyCode={["Backspace", "Delete"]}
                  defaultEdgeOptions={defaultEdgeOptions}
                  proOptions={flowProOptions}
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={14}
                    size={1}
                    color={appearance.dot}
                  />
                  <Controls showInteractive={false} className="!shadow-md" />
                </ReactFlow>

                {menu ? (
                  <SitemapContextMenu
                    x={menu.clientX}
                    y={menu.clientY}
                    onClose={() => setMenu(null)}
                    onAddPage={() => beginAddPage(menu.flowX, menu.flowY)}
                  />
                ) : null}
              </>
            ) : hostBlockId ? (
              <WireframeEditor
                pageSurface
                blockId={hostBlockId}
                blockName={currentPageName}
                elements={wireframeByBlockId[hostBlockId] ?? []}
                onChange={(next) =>
                  setWireframeByBlockId((prev) => ({
                    ...prev,
                    [hostBlockId]: next,
                  }))
                }
                onBack={() => void selectTabFixed(SITE_MAP_TAB_ID)}
                onOpenExport={() => setExportOpen(true)}
                onHistoryCheckpoint={beforeMutate}
                pageOptions={pagesMeta.map((p) => ({ id: p.id, name: p.name }))}
              />
            ) : null}
          </div>

          <AddPageModal
            open={addPageOpen}
            onClose={() => setAddPageOpen(false)}
            onCreate={(name, description) => {
              void confirmAddPage(name, description);
            }}
          />

          <ExportDrawer
            open={exportOpen}
            onClose={() => setExportOpen(false)}
            snapshot={exportSnapshot}
            activePageId={designPageId}
          />
          <PremiumModal
            open={premium !== null}
            onClose={() => setPremium(null)}
            title={premium?.title ?? ""}
            description={premium?.description ?? ""}
          />
        </div>
      </SiteMapActionsProvider>
    </CanvasHistoryContext.Provider>
  );
}

export function CanvasEditor({
  bundle,
  isPro,
}: {
  bundle: ProjectBundle;
  isPro: boolean;
}) {
  return (
    <ReactFlowProvider>
      <CanvasWorkspace bundle={bundle} isPro={isPro} />
    </ReactFlowProvider>
  );
}
