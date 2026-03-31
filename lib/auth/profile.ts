import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ensureClerkProfile } from "@/lib/clerk-profile";

export async function requireProfileId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  return ensureClerkProfile(userId);
}
