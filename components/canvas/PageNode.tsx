"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Handle, Position, useNodeId, useReactFlow, type NodeProps } from "reactflow";
import { LayoutPanelTop, Trash2 } from "lucide-react";
import type { PageNodeData } from "@/lib/types";
import { useSiteMapActions } from "@/components/canvas/SiteMapActionsContext";

function PageNodeInner({ data, selected }: NodeProps<PageNodeData>) {
  const id = useNodeId();
  const { setNodes } = useReactFlow();
  const actions = useSiteMapActions();
  const [editingName, setEditingName] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName) nameRef.current?.focus();
  }, [editingName]);

  const endNameEdit = useCallback(() => setEditingName(false), []);

  useEffect(() => {
    if (!editingName) return;
    function onMouseDown(e: MouseEvent) {
      const el = nameRef.current;
      if (!el) return;
      const t = e.target;
      if (t instanceof HTMLElement && el.contains(t)) return;
      setEditingName(false);
    }
    document.addEventListener("mousedown", onMouseDown, true);
    return () => document.removeEventListener("mousedown", onMouseDown, true);
  }, [editingName]);

  const syncData = useCallback(
    (partial: Partial<PageNodeData>) => {
      if (!id) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...partial } } : n
        )
      );
      if (partial.name !== undefined || partial.description !== undefined) {
        actions?.patchPage(id, {
          ...(partial.name !== undefined ? { name: partial.name } : {}),
          ...(partial.description !== undefined ? { description: partial.description } : {}),
        });
      }
    },
    [id, setNodes, actions]
  );

  const openDesign = useCallback(() => {
    if (id) actions?.openPageDesign(id);
  }, [id, actions]);

  const remove = useCallback(() => {
    if (!id) return;
    actions?.removePage(id);
  }, [id, actions]);

  return (
    <div
      className={`w-72 rounded-lg border bg-white shadow-sm ${
        selected ? "border-violet-600 ring-2 ring-violet-600/20" : "border-stone-200"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-none !bg-violet-400"
      />
      <div className="border-b border-stone-100 px-3 py-2">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-violet-600/90">
          Page
        </p>
        <div className="mt-1 flex items-start gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            {editingName ? (
              <input
                ref={nameRef}
                className="w-full rounded border border-stone-200 px-1.5 py-0.5 text-sm font-medium text-stone-900"
                value={data.name}
                onChange={(e) => syncData({ name: e.target.value })}
                onBlur={endNameEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") endNameEdit();
                }}
                aria-label="Page name"
              />
            ) : (
              <button
                type="button"
                className="w-full truncate text-left text-sm font-medium text-stone-900"
                onDoubleClick={() => setEditingName(true)}
              >
                {data.name || "Untitled page"}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={remove}
            className="shrink-0 rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-red-600"
            aria-label="Delete page"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
      <div className="space-y-2 p-3">
        <label className="block">
          <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-wide text-stone-500">
            What this page is for
          </span>
          <textarea
            className="min-h-[72px] w-full resize-y rounded border border-transparent bg-stone-50/80 px-2 py-1.5 text-sm text-stone-700 outline-none focus:border-stone-200"
            placeholder="Purpose, audience, key jobs-to-be-done…"
            value={data.description}
            onChange={(e) => syncData({ description: e.target.value })}
            rows={3}
          />
        </label>
        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded border border-violet-300 bg-violet-50/80 py-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-violet-950 hover:bg-violet-100"
          onClick={openDesign}
        >
          <LayoutPanelTop className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Open wireframe
        </button>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-none !bg-violet-400"
      />
    </div>
  );
}

export const PageNode = memo(PageNodeInner);
