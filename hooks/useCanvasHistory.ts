"use client";

import { useCallback, useReducer, useRef } from "react";
import type { Edge, Node } from "reactflow";
import { serializePageSnapshot } from "@/lib/canvas-serial";
import type { BlockNodeData, WireframeElementRow } from "@/lib/types";
import {
  clonePageCache,
  cloneWireframeMap,
  pushHistoryEntry,
  type CanvasHistorySnapshot,
  type PageDraft,
} from "@/lib/canvas-history";

export function useCanvasHistory({
  pageId,
  setPageId,
  cacheRef,
  wireframeRef,
  setNodes,
  setEdges,
  setWireframeByBlockId,
  setBaselineSerial,
}: {
  /** Null on site map — undo and checkpoints are disabled. */
  pageId: string | null;
  setPageId: (id: string) => void;
  cacheRef: React.MutableRefObject<Record<string, PageDraft> | null>;
  wireframeRef: React.MutableRefObject<Record<string, WireframeElementRow[]>>;
  setNodes: (v: Node<BlockNodeData>[] | ((n: Node<BlockNodeData>[]) => Node<BlockNodeData>[])) => void;
  setEdges: (v: Edge[] | ((e: Edge[]) => Edge[])) => void;
  setWireframeByBlockId: (
    v:
      | Record<string, WireframeElementRow[]>
      | ((p: Record<string, WireframeElementRow[]>) => Record<string, WireframeElementRow[]>)
  ) => void;
  setBaselineSerial: (s: string) => void;
}) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const pageIdRef = useRef(pageId);
  pageIdRef.current = pageId;
  const pastRef = useRef<CanvasHistorySnapshot[]>([]);
  const futureRef = useRef<CanvasHistorySnapshot[]>([]);
  const restoringRef = useRef(false);

  const takeSnapshot = useCallback((): CanvasHistorySnapshot | null => {
    const pid = pageIdRef.current;
    if (!pid) return null;
    const c = cacheRef.current;
    if (!c) return null;
    return {
      pageId: pid,
      cache: clonePageCache(c),
      wireframeByBlockId: cloneWireframeMap(wireframeRef.current),
    };
  }, [cacheRef, wireframeRef]);

  const applySnapshot = useCallback(
    (s: CanvasHistorySnapshot) => {
      restoringRef.current = true;
      cacheRef.current = clonePageCache(s.cache);
      const draft = cacheRef.current[s.pageId] ?? { nodes: [] as Node<BlockNodeData>[], edges: [] as Edge[] };
      setPageId(s.pageId);
      setNodes(draft.nodes);
      setEdges(draft.edges);
      setWireframeByBlockId(cloneWireframeMap(s.wireframeByBlockId));
      setBaselineSerial(
        serializePageSnapshot(s.pageId, draft.nodes, draft.edges, s.wireframeByBlockId)
      );
      requestAnimationFrame(() => {
        restoringRef.current = false;
      });
    },
    [cacheRef, setPageId, setNodes, setEdges, setWireframeByBlockId, setBaselineSerial]
  );

  const beforeMutate = useCallback(() => {
    if (restoringRef.current || !pageIdRef.current) return;
    const snap = takeSnapshot();
    if (!snap) return;
    pushHistoryEntry(pastRef.current, snap);
    futureRef.current = [];
    bump();
  }, [takeSnapshot]);

  const undo = useCallback(() => {
    if (!pageIdRef.current || pastRef.current.length === 0) return;
    const cur = takeSnapshot();
    if (!cur) return;
    const prev = pastRef.current.pop()!;
    futureRef.current.push(cur);
    applySnapshot(prev);
    bump();
  }, [takeSnapshot, applySnapshot]);

  const redo = useCallback(() => {
    if (!pageIdRef.current || futureRef.current.length === 0) return;
    const cur = takeSnapshot();
    if (!cur) return;
    const next = futureRef.current.pop()!;
    pastRef.current.push(cur);
    applySnapshot(next);
    bump();
  }, [takeSnapshot, applySnapshot]);

  const clearHistory = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    bump();
  }, [bump]);

  const canHistory = Boolean(pageId);

  return {
    beforeMutate,
    undo,
    redo,
    clearHistory,
    canUndo: canHistory && pastRef.current.length > 0,
    canRedo: canHistory && futureRef.current.length > 0,
  };
}
