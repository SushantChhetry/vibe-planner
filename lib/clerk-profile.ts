import { randomUUID } from "crypto";
import { clerkClient } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Ensures a profiles row exists for this Clerk user (service role). Returns internal profile UUID. */
export async function ensureClerkProfile(clerkUserId: string): Promise<string> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkUserId);
  const email =
    user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;

  const id = randomUUID();
  const { error } = await admin.from("profiles").insert({
    id,
    email,
    clerk_user_id: clerkUserId,
  });

  if (error) throw error;
  return id;
}
