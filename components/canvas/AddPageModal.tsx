"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export function AddPageModal({
  open,
  title = "New page",
  confirmLabel = "Create page",
  onClose,
  onCreate,
}: {
  open: boolean;
  title?: string;
  confirmLabel?: string;
  onClose: () => void;
  onCreate: (name: string, description: string) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
    setSubmitting(false);
    const t = window.setTimeout(() => nameInputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-page-title"
      aria-busy={submitting}
      onMouseDown={(e) => {
        if (submitting) return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-5 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="add-page-title" className="text-lg font-semibold text-stone-900">
          {title}
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Name the screen and describe why it exists — you&apos;ll link pages together on the site map.
        </p>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-stone-500">Page name</span>
            <input
              ref={nameInputRef}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-500 disabled:bg-stone-50 disabled:text-stone-500"
              value={name}
              disabled={submitting}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pricing, Dashboard, Sign in"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-stone-500">What this page is for</span>
            <textarea
              className="mt-1 w-full resize-y rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-500 disabled:bg-stone-50 disabled:text-stone-500"
              value={description}
              disabled={submitting}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Purpose, main content, who lands here…"
              rows={4}
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            className="!text-stone-700"
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={() => {
              const n = name.trim() || "Untitled page";
              setSubmitting(true);
              void Promise.resolve(onCreate(n, description.trim()))
                .then(() => onClose())
                .catch(() => {})
                .finally(() => setSubmitting(false));
            }}
          >
            {submitting ? "Creating…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
