"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Handle, Position, useNodeId, useReactFlow, type NodeProps } from "reactflow";
import { LayoutPanelTop, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { BlockNodeData } from "@/lib/types";
import { useCanvasHistoryContext } from "@/components/canvas/CanvasHistoryContext";
import { useWireframeMode } from "@/components/canvas/WireframeModeContext";

function BlockNodeInner({ data, selected }: NodeProps<BlockNodeData>) {
  const id = useNodeId();
  const { setNodes, setEdges } = useReactFlow();
  const wireMode = useWireframeMode();
  const history = useCanvasHistoryContext();
  const [editingName, setEditingName] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName) nameRef.current?.focus();
  }, [editingName]);

  const endNameEdit = useCallback(() => {
    setEditingName(false);
  }, []);

  useEffect(() => {
    if (!editingName) return;
    function onMouseDown(e: MouseEvent) {
      const el = nameRef.current;
      if (!el) return;
      const t = e.target;
      if (t instanceof Node && el.contains(t)) return;
      setEditingName(false);
    }
    document.addEventListener("mousedown", onMouseDown, true);
    return () => document.removeEventListener("mousedown", onMouseDown, true);
  }, [editingName]);

  const patch = useCallback(
    (partial: Partial<Pick<BlockNodeData, "name" | "description">>) => {
      if (!id) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id
            ? { ...n, data: { ...n.data, ...partial } }
            : n
        )
      );
    },
    [id, setNodes]
  );

  const onTextFieldHistoryFocus = useCallback(() => {
    history?.beforeMutate();
  }, [history]);

  const remove = useCallback(() => {
    if (!id) return;
    history?.beforeMutate();
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setNodes((nds) => nds.filter((n) => n.id !== id));
  }, [id, history, setEdges, setNodes]);

  return (
    <div
      className={`w-64 rounded-lg border bg-white shadow-sm ${
        selected ? "border-teal-600 ring-2 ring-teal-600/20" : "border-stone-200"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-none !bg-stone-400"
      />
      <div className="flex items-start gap-2 border-b border-stone-100 px-3 py-2">
        <div className="min-w-0 flex-1 space-y-1">
          <Badge type={data.blockType} />
          {editingName ? (
            <input
              ref={nameRef}
              className="w-full rounded border border-stone-200 px-1.5 py-0.5 text-sm font-medium text-stone-900"
              value={data.name}
              onChange={(e) => patch({ name: e.target.value })}
              onFocus={onTextFieldHistoryFocus}
              onBlur={endNameEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") endNameEdit();
              }}
              aria-label="Block name"
            />
          ) : (
            <button
              type="button"
              className="w-full truncate text-left text-sm font-medium text-stone-900"
              onDoubleClick={() => setEditingName(true)}
            >
              {data.name || "Untitled block"}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={remove}
          className="shrink-0 rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-red-600"
          aria-label="Delete block"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <div className="p-3">
        <textarea
          className="min-h-[72px] w-full resize-y rounded border border-transparent bg-stone-50/80 px-2 py-1.5 text-sm text-stone-700 outline-none focus:border-stone-200"
          placeholder="What does this do?"
          value={data.description}
          onChange={(e) => patch({ description: e.target.value })}
          onFocus={onTextFieldHistoryFocus}
          rows={3}
        />
        {wireMode && id ? (
          <button
            type="button"
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-stone-400 bg-stone-50/80 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-stone-800 hover:bg-stone-100"
            onClick={() => wireMode.openWireframe(id)}
          >
            <LayoutPanelTop className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Lo-fi layout
          </button>
        ) : null}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-none !bg-stone-400"
      />
    </div>
  );
}

export const BlockNode = memo(BlockNodeInner);
