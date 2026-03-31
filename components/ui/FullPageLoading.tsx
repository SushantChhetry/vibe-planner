import { Loader2 } from "lucide-react";

export function FullPageLoading({ label }: { label: string }) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-stone-600"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-8 w-8 shrink-0 animate-spin text-teal-700" aria-hidden />
      <p className="text-sm font-medium text-stone-700">{label}</p>
    </div>
  );
}
