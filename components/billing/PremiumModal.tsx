"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";

const DEFAULT_PERKS = [
  "Unlimited projects",
  "Full AI blueprints (beyond starter templates)",
  "Canvas themes & accent colors",
  "First access to team collaboration",
];

export function PremiumModal({
  open,
  onClose,
  title,
  description,
  perks = DEFAULT_PERKS,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  /** Shown below the description; defaults to full Premium value list. */
  perks?: string[];
}) {
  const titleId = useId();
  const descId = useId();
  const listId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const startCheckout = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not start checkout");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("No checkout URL returned");
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-[3px]"
      role="presentation"
      onClick={onClose}
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
          className="h-1.5 bg-gradient-to-r from-teal-500 via-teal-600 to-amber-500"
          aria-hidden
        />

        <button
          type="button"
          className="absolute right-3 top-5 z-10 rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="px-6 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
          <BrandLogo className="h-10 w-auto max-w-[9.5rem]" />

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
            Premium
          </p>
          <h2
            id={titleId}
            className="mt-1.5 text-balance text-xl font-semibold tracking-tight text-stone-900 sm:text-[1.35rem]"
          >
            {title}
          </h2>
          <p id={descId} className="mt-3 text-sm leading-relaxed text-stone-600">
            {description}
          </p>

          <ul
            id={listId}
            className="mt-5 space-y-2.5 rounded-xl border border-stone-100 bg-stone-50/80 px-4 py-3.5"
            aria-label="Included with Premium"
          >
            {perks.map((line) => (
              <li key={line} className="flex gap-2.5 text-sm text-stone-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                </span>
                <span className="leading-snug">{line}</span>
              </li>
            ))}
          </ul>

          {error ? (
            <p
              className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              className="w-full border-0 sm:w-auto"
              onClick={onClose}
              disabled={busy}
            >
              Maybe later
            </Button>
            <Button
              type="button"
              variant="primary"
              className="w-full !gap-2 !py-2.5 shadow-sm sm:w-auto"
              onClick={() => void startCheckout()}
              disabled={busy}
            >
              {busy ? (
                "Redirecting…"
              ) : (
                <>
                  Upgrade
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                </>
              )}
            </Button>
          </div>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-stone-400 sm:text-left">
            Secure checkout with Stripe. Cancel anytime from billing settings.
          </p>
        </div>
      </div>
    </div>
  );
}
