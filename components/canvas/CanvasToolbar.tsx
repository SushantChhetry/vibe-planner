"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { FileDown, Redo2, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TemplateLoader } from "@/components/canvas/TemplateLoader";

export function CanvasHistoryButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearAll,
  clearAllDisabled,
  clearAllLabel = "Clear all",
  clearAllConfirmDescription = "All blocks and connections on this page will be removed. You can use Undo afterward.",
}: {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearAll: () => void;
  clearAllDisabled?: boolean;
  clearAllLabel?: string;
  clearAllConfirmDescription?: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const titleId = useId();
  const descId = useId();

  const closeConfirm = useCallback(() => setConfirmOpen(false), []);

  useEffect(() => {
    if (!confirmOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeConfirm();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen, closeConfirm]);

  const requestClear = () => setConfirmOpen(true);
  const confirmClear = () => {
    setConfirmOpen(false);
    onClearAll();
  };

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <Button
        type="button"
        variant="outline"
        className="!gap-1 !px-2 !py-1.5 !text-sm sm:!px-2.5"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo (⌘Z)"
      >
        <Undo2 className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Undo</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        className="!gap-1 !px-2 !py-1.5 !text-sm sm:!px-2.5"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo (⌘⇧Z)"
      >
        <Redo2 className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Redo</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        className="!gap-1 !px-2 !py-1.5 !text-sm text-stone-800 sm:!px-2.5"
        onClick={requestClear}
        disabled={clearAllDisabled}
        aria-label={clearAllLabel}
        title={clearAllLabel}
        aria-haspopup="dialog"
        aria-expanded={confirmOpen}
      >
        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden min-[380px]:inline">{clearAllLabel}</span>
      </Button>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={closeConfirm}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={titleId} className="text-base font-semibold text-stone-900">
              Are you sure?
            </h2>
            <p id={descId} className="mt-2 text-sm text-stone-600">
              {clearAllConfirmDescription}
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeConfirm}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={confirmClear}>
                {clearAllLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CanvasToolbar({
  onExport,
  onTemplate,
  isPro,
  onPremiumTemplates,
  disableTemplates = false,
}: {
  onExport: () => void;
  onTemplate: (templateId: string) => void;
  isPro: boolean;
  onPremiumTemplates: () => void;
  /** Hide starter/AI templates on the site map. */
  disableTemplates?: boolean;
}) {
  return (
    <div className="flex flex-nowrap items-center justify-end gap-2">
      {disableTemplates ? (
        <span className="hidden max-w-[10rem] truncate text-xs text-stone-500 sm:inline">
          Open a page tab to use templates
        </span>
      ) : (
        <TemplateLoader isPro={isPro} onPremiumClick={onPremiumTemplates} onApply={onTemplate} />
      )}
      <Button
        type="button"
        variant="primary"
        className="!gap-2 !py-1.5 !text-sm"
        onClick={onExport}
      >
        <FileDown className="h-4 w-4 shrink-0" aria-hidden />
        Export
      </Button>
    </div>
  );
}
