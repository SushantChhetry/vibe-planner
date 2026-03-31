import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { requireProfileId } from "@/lib/auth/profile";

export async function POST() {
  const profileId = await requireProfileId();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", profileId)
    .single();

  const stripeCustomerId = profile?.stripe_customer_id as string | null | undefined;
  if (!stripeCustomerId) {
    return NextResponse.json({ error: "No billing account" }, { status: 400 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const stripe = getStripe();

  const portal = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${origin}/settings/billing`,
  });

  if (!portal.url) {
    return NextResponse.json({ error: "Could not create portal session" }, { status: 500 });
  }

  return NextResponse.json({ url: portal.url });
}
