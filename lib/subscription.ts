import type { SupabaseClient } from "@supabase/supabase-js";

export async function getSubscriptionState(
  supabase: SupabaseClient,
  userId: string
): Promise<{ isPro: boolean; stripeCustomerId: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("subscription_status, stripe_customer_id")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return { isPro: false, stripeCustomerId: null };
  }

  const status = data.subscription_status as string | null;
  const isPro = status === "active" || status === "trialing";
  return {
    isPro,
    stripeCustomerId: (data.stripe_customer_id as string | null) ?? null,
  };
}
