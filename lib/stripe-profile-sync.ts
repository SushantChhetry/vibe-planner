import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function customerId(sub: Stripe.Subscription): string {
  return typeof sub.customer === "string" ? sub.customer : sub.customer.id;
}

/** Resolve Supabase user id from subscription metadata or existing profile row. */
async function resolveUserId(
  admin: ReturnType<typeof createAdminClient>,
  sub: Stripe.Subscription
): Promise<string | null> {
  const metaUid = sub.metadata?.supabase_user_id;
  if (metaUid) return metaUid;

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
  const userId = await resolveUserId(admin, sub);
  if (!userId) {
    console.error("[stripe sync] No user for subscription", sub.id);
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
    .eq("id", userId);

  if (error) {
    console.error("[stripe sync] profiles update failed", error);
  }
}
