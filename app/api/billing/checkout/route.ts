import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { requireProfileId } from "@/lib/auth/profile";

export async function POST() {
  const profileId = await requireProfileId();
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRICE_PRO;
  if (!priceId) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", profileId)
    .single();

  const stripeCustomerId = profile?.stripe_customer_id as string | null | undefined;
  const email = user.primaryEmailAddress?.emailAddress ?? undefined;

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ...(stripeCustomerId
      ? { customer: stripeCustomerId }
      : { customer_email: email }),
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings/billing?checkout=success`,
    cancel_url: `${origin}/settings/billing?checkout=canceled`,
    metadata: { profile_id: profileId },
    subscription_data: {
      metadata: { profile_id: profileId },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
