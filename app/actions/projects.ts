"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscriptionState } from "@/lib/subscription";
import { requireProfileId } from "@/lib/auth/profile";

export async function createProjectAndRedirect() {
  const profileId = await requireProfileId();
  const supabase = await createClient();
  const admin = createAdminClient();

  const { isPro } = await getSubscriptionState(supabase, profileId);
  if (!isPro) {
    const { count, error: cErr } = await admin
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileId);
    if (!cErr && (count ?? 0) >= 1) {
      redirect("/dashboard?error=premium_project_limit");
    }
  }

  // Service role: creation must succeed after Clerk-verified profileId (RLS + user JWT often misconfigured outside Canvas).
  const { data: project, error: pErr } = await admin
    .from("projects")
    .insert({ user_id: profileId, name: "Untitled project" })
    .select("id")
    .single();

  if (pErr || !project) {
    console.error("[createProjectAndRedirect] project insert:", pErr);
    redirect("/dashboard?error=create");
  }

  const { error: pgErr } = await admin.from("pages").insert({
    project_id: project.id,
    name: "Page 1",
    order: 0,
    description: "",
  });

  if (pgErr) {
    console.error("[createProjectAndRedirect] page insert:", pgErr);
    redirect("/dashboard?error=page");
  }

  redirect(`/canvas/${project.id}`);
}

export async function deleteProject(projectId: string) {
  const profileId = await requireProfileId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .select("id");

  if (error || !data?.length) {
    redirect("/dashboard?error=delete");
  }

  revalidatePath("/dashboard");
  revalidatePath(`/canvas/${projectId}`);
  redirect("/dashboard");
}

export async function renameProject(
  projectId: string,
  name: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireProfileId();
  const supabase = await createClient();

  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Name cannot be empty." };
  }
  if (trimmed.length > 200) {
    return { ok: false, error: "Name is too long (max 200 characters)." };
  }

  const { data, error } = await supabase
    .from("projects")
    .update({ name: trimmed })
    .eq("id", projectId)
    .select("id");

  if (error || !data?.length) {
    return { ok: false, error: "Could not rename project." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/canvas/${projectId}`);
  return { ok: true };
}
