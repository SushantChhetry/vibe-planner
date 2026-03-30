"use client";

import { Sparkles } from "lucide-react";

export function PremiumBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-50 to-amber-100/90 px-1.5 py-0.5 ring-1 ring-amber-200/70 ${className}`}
      title="Premium feature"
    >
      <Sparkles className="h-3 w-3 text-amber-700" strokeWidth={2} aria-hidden />
      <span className="sr-only">Premium</span>
    </span>
  );
}
