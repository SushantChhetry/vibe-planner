import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSubscriptionState } from "@/lib/subscription";
import { BillingActions } from "@/components/billing/BillingActions";

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/settings/billing");
  }

  const { isPro, stripeCustomerId } = await getSubscriptionState(supabase, user.id);
  const checkout = typeof searchParams?.checkout === "string" ? searchParams.checkout : undefined;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-lg px-6 py-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Dashboard
        </Link>

        <h1 className="mt-6 text-2xl font-semibold text-stone-900">Billing</h1>
        <p className="mt-2 text-sm text-stone-600">
          {isPro
            ? "You have an active Premium subscription."
            : "You’re on the free plan: one project, all export formats, default canvas theme."}
        </p>

        {checkout === "success" ? (
          <p className="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
            Payment received. If your account doesn’t show Premium yet, wait a few seconds and
            refresh — we sync from Stripe in the background.
          </p>
        ) : null}
        {checkout === "canceled" ? (
          <p className="mt-4 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
            Checkout was canceled. You can try again anytime.
          </p>
        ) : null}

        <div className="mt-8 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-stone-900">Plan</h2>
          <p className="mt-1 text-sm text-stone-600">
            {isPro ? (
              <span className="font-medium text-teal-800">Premium</span>
            ) : (
              <span>Free</span>
            )}
          </p>
          <div className="mt-5">
            <BillingActions isPro={isPro} hasStripeCustomer={Boolean(stripeCustomerId)} />
          </div>
        </div>

        <p className="mt-8 text-xs text-stone-500">
          Set <code className="rounded bg-stone-100 px-1">STRIPE_PRICE_PRO</code>,{" "}
          <code className="rounded bg-stone-100 px-1">STRIPE_SECRET_KEY</code>, and{" "}
          <code className="rounded bg-stone-100 px-1">STRIPE_WEBHOOK_SECRET</code> in your
          environment. Use the Stripe CLI to forward webhooks locally.
        </p>
      </div>
    </div>
  );
}
