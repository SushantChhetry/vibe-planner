"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";

export function BillingActions({
  isPro,
  hasStripeCustomer,
}: {
  isPro: boolean;
  hasStripeCustomer: boolean;
}) {
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkout = useCallback(async () => {
    setError(null);
    setBusy("checkout");
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not start checkout");
        return;
      }
      if (data.url) window.location.href = data.url;
      else setError("No checkout URL");
    } catch {
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }, []);

  const portal = useCallback(async () => {
    setError(null);
    setBusy("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not open billing portal");
        return;
      }
      if (data.url) window.location.href = data.url;
      else setError("No portal URL");
    } catch {
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }, []);

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {isPro && hasStripeCustomer ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void portal()}
          >
            {busy === "portal" ? "Opening…" : "Manage subscription"}
          </Button>
        ) : null}
        {!isPro ? (
          <Button
            type="button"
            variant="primary"
            disabled={busy !== null}
            onClick={() => void checkout()}
          >
            {busy === "checkout" ? "Redirecting…" : "Upgrade to Premium"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
