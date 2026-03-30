"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ExportFormat, ExportSnapshot } from "@/lib/types";
import { Check, Copy, Download, FileDown, X } from "lucide-react";
import { buildExportContent, downloadFilename } from "@/lib/export";
import { Button } from "@/components/ui/Button";

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "markdown", label: "Markdown" },
  { value: "cursorrules", label: ".cursorrules" },
  { value: "claude", label: "CLAUDE.md" },
  { value: "json", label: "JSON" },
];

const FORMAT_HINTS: Record<ExportFormat, string> = {
  markdown: "Human-readable spec for docs, READMEs, and handoff notes.",
  cursorrules: "Drop into your repo root for Cursor and compatible assistants.",
  claude: "Project context file for Claude Code and similar tooling.",
  json: "Structured data for scripts, migrations, or other automation.",
};

export function ExportDrawer({
  open,
  onClose,
  snapshot,
}: {
  open: boolean;
  onClose: () => void;
  snapshot: ExportSnapshot | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [copied, setCopied] = useState(false);

  const content = useMemo(() => {
    if (!snapshot) return "";
    return buildExportContent(snapshot, format);
  }, [snapshot, format]);

  const suggestedFilename = useMemo(() => {
    if (!snapshot) return "";
    return downloadFilename(snapshot.projectName, format);
  }, [snapshot, format]);

  const previewStats = useMemo(() => {
    if (!snapshot) return null;
    const chars = content.length;
    const lines = chars === 0 ? 0 : content.split("\n").length;
    return { lines, chars };
  }, [snapshot, content]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open) {
      d.showModal();
    } else {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, [onClose]);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  useEffect(() => {
    setCopied(false);
  }, [format]);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
    };
  }, []);

  async function copy() {
    if (!snapshot) return;
    try {
      await navigator.clipboard.writeText(buildExportContent(snapshot, format));
      setCopied(true);
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
      copyResetRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function download() {
    if (!snapshot) return;
    const text = buildExportContent(snapshot, format);
    const name = downloadFilename(snapshot.projectName, format);
    const mime =
      format === "json" ? "application/json" : "text/markdown;charset=utf-8";
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasExport = Boolean(snapshot);

  return (
    <dialog
      ref={dialogRef}
      className="fixed right-0 top-0 z-[100] m-0 h-full max-h-full w-[min(100vw,440px)] max-w-full translate-x-0 border-l border-stone-200/90 bg-[#fafaf8] p-0 shadow-2xl shadow-stone-900/15 backdrop:bg-stone-900/25"
      aria-labelledby="export-drawer-title"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-stone-200/90 bg-white/90 px-4 py-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-700/10 text-teal-800">
                <FileDown className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2
                  id="export-drawer-title"
                  className="text-base font-semibold tracking-tight text-stone-900"
                >
                  Export
                </h2>
                {snapshot ? (
                  <p className="mt-0.5 truncate text-sm text-stone-600" title={snapshot.projectName}>
                    {snapshot.projectName}
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm text-stone-500">
                    Copy or download your plan for tools and teammates.
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="shrink-0 space-y-3 border-b border-stone-200/80 bg-white/60 px-4 py-4 backdrop-blur-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Format
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {FORMATS.map(({ value, label }) => {
                const active = format === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormat(value)}
                    className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${
                      active
                        ? "bg-stone-900 text-white shadow-sm"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-stone-500">
              {FORMAT_HINTS[format]}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex gap-2 border-b border-stone-200/80 bg-white/40 px-4 py-3">
          <Button
            type="button"
            variant="outline"
            disabled={!hasExport}
            className={`flex-1 !gap-2 transition-colors disabled:opacity-45 ${
              copied
                ? "!border-emerald-600 !bg-emerald-600 !text-white hover:!bg-emerald-700 disabled:!opacity-100"
                : ""
            }`}
            onClick={() => void copy()}
            aria-label={copied ? "Copied to clipboard" : "Copy export to clipboard"}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 shrink-0" aria-hidden />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 shrink-0" aria-hidden />
                Copy
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1 !gap-2"
            onClick={download}
            disabled={!hasExport}
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden />
            Download
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-4">
          {snapshot ? (
            <div className="flex h-full min-h-[200px] flex-col overflow-hidden rounded-xl border border-stone-200/90 bg-white shadow-sm shadow-stone-900/[0.04]">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-stone-100 bg-stone-50/80 px-3 py-2">
                <span className="truncate font-mono text-[11px] font-medium text-stone-700">
                  {suggestedFilename}
                </span>
                {previewStats ? (
                  <span className="shrink-0 tabular-nums text-[11px] text-stone-500">
                    {previewStats.lines.toLocaleString()} lines ·{" "}
                    {previewStats.chars.toLocaleString()} chars
                  </span>
                ) : null}
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <pre className="whitespace-pre-wrap break-words p-4 font-mono text-[11px] leading-relaxed text-stone-800 subpixel-antialiased">
                  {content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50 px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-200/60 text-stone-500">
                <FileDown className="h-6 w-6" aria-hidden />
              </div>
              <p className="mt-4 text-sm font-medium text-stone-800">Nothing to export yet</p>
              <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-stone-500">
                Open a project with pages or blocks. Your export preview will show up here.
              </p>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
