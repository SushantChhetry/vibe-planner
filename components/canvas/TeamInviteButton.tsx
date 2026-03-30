"use client";

import { useEffect, useId, useState } from "react";
import { Users, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PremiumBadge } from "@/components/billing/PremiumBadge";

export function TeamInviteButton({
  isPro,
  onPremiumClick,
}: {
  isPro: boolean;
  onPremiumClick: () => void;
}) {
  const [comingOpen, setComingOpen] = useState(false);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!comingOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setComingOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [comingOpen]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="!gap-1.5 !py-1.5 !text-sm whitespace-nowrap"
        onClick={() => {
          if (!isPro) onPremiumClick();
          else setComingOpen(true);
        }}
        title="Team"
      >
        <Users className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Team</span>
        {!isPro ? <PremiumBadge /> : null}
      </Button>

      {comingOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-[3px]"
          role="presentation"
          onClick={() => setComingOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="relative w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-stone-900/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="h-1.5 bg-gradient-to-r from-teal-500 via-teal-600 to-stone-400"
              aria-hidden
            />
            <button
              type="button"
              className="absolute right-3 top-5 z-10 rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              onClick={() => setComingOpen(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
            <div className="px-6 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-stone-100 ring-1 ring-stone-200/80">
                <Users className="h-5 w-5 text-teal-800" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
                Coming soon
              </p>
              <h2
                id={titleId}
                className="mt-1.5 text-balance text-xl font-semibold tracking-tight text-stone-900"
              >
                Team collaboration
              </h2>
              <p id={descId} className="mt-3 text-sm leading-relaxed text-stone-600">
                Shared workspaces and invites are on the roadmap. Thanks for being a Premium member —
                you&apos;ll get early access when it ships.
              </p>
              <div className="mt-7 flex justify-end">
                <Button type="button" variant="primary" onClick={() => setComingOpen(false)}>
                  Got it
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
