import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Check, Loader2 } from "lucide-react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

function SaveLabel({ status }: { status: SaveStatus }) {
  if (status === "saving")
    return (
      <span className="inline-flex items-center gap-1.5 text-stone-500">
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
        Saving…
      </span>
    );
  if (status === "saved")
    return (
      <span className="inline-flex items-center gap-1.5 text-stone-500">
        <Check className="h-3.5 w-3.5 shrink-0 text-teal-600" aria-hidden />
        Saved
      </span>
    );
  if (status === "error")
    return (
      <span className="inline-flex items-center gap-1.5 text-red-600">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Save failed
      </span>
    );
  return <span className="text-stone-400">&nbsp;</span>;
}

export function TopBar({
  backHref,
  projectName,
  onProjectNameChange,
  onProjectNameBlur,
  saveStatus,
  center,
  right,
  footer,
}: {
  backHref: string;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onProjectNameBlur?: () => void;
  saveStatus: SaveStatus;
  center: ReactNode;
  right?: ReactNode;
  /** Second row below the title bar (e.g. full-width tool strip). */
  footer?: ReactNode;
}) {
  return (
    <header className="flex shrink-0 flex-col border-b border-stone-200 bg-white">
      <div className="flex h-12 min-h-12 min-w-0 items-center gap-2 px-2 sm:gap-3 sm:px-3">
        <div className="flex min-w-0 max-w-[min(46vw,13.5rem)] items-center gap-2 sm:max-w-none sm:gap-3">
          <Link
            href={backHref}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          <input
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            onBlur={() => onProjectNameBlur?.()}
            className="min-w-0 max-w-[7.5rem] border-0 bg-transparent text-sm font-medium text-stone-900 outline-none focus:ring-0 min-[400px]:max-w-[11rem] sm:max-w-xs"
            aria-label="Project name"
          />
          <div className="hidden w-[8.25rem] shrink-0 text-sm sm:block">
            <SaveLabel status={saveStatus} />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 justify-center overflow-hidden px-1">
          {center}
        </div>
        {right != null ? (
          <div className="flex shrink-0 items-center justify-end gap-2">{right}</div>
        ) : (
          <div className="w-0 shrink-0 sm:w-2" aria-hidden />
        )}
      </div>
      {footer != null ? (
        <div className="border-t border-stone-100 bg-gradient-to-b from-stone-50/90 to-stone-50/50">
          <div className="flex min-h-11 w-full max-w-full items-center justify-evenly gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-3 py-1.5 [scrollbar-width:thin] sm:gap-6 sm:px-4">
            {footer}
          </div>
        </div>
      ) : null}
    </header>
  );
}
