import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function customerId(sub: Stripe.Subscription): string {
  return typeof sub.customer === "string" ? sub.customer : sub.customer.id;
}

/** Resolve internal profile UUID from subscription metadata or existing profile row. */
async function resolveProfileId(
  admin: ReturnType<typeof createAdminClient>,
  sub: Stripe.Subscription
): Promise<string | null> {
  const metaId = sub.metadata?.profile_id;
  if (metaId) return metaId;

  const cid = customerId(sub);
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", cid)
    .maybeSingle();

  return data?.id ?? null;
}

export async function syncProfileFromStripeSubscription(sub: Stripe.Subscription) {
  const admin = createAdminClient();
  const profileId = await resolveProfileId(admin, sub);
  if (!profileId) {
    console.error("[stripe sync] No profile for subscription", sub.id);
    return;
  }

  const cid = customerId(sub);
  const { error } = await admin
    .from("profiles")
    .update({
      stripe_customer_id: cid,
      stripe_subscription_id: sub.id,
      subscription_status: sub.status,
    })
    .eq("id", profileId);

  if (error) {
    console.error("[stripe sync] profiles update failed", error);
  }
}
