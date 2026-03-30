"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionState } from "@/lib/subscription";

export async function createProjectAndRedirect() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/canvas/new");

  const { isPro } = await getSubscriptionState(supabase, user.id);
  if (!isPro) {
    const { count, error: cErr } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (!cErr && (count ?? 0) >= 1) {
      redirect("/dashboard?error=premium_project_limit");
    }
  }

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .insert({ user_id: user.id, name: "Untitled project" })
    .select("id")
    .single();

  if (pErr || !project) {
    redirect("/dashboard?error=create");
  }

  const { error: pgErr } = await supabase.from("pages").insert({
    project_id: project.id,
    name: "Page 1",
    order: 0,
    description: "",
  });

  if (pgErr) {
    redirect("/dashboard?error=page");
  }

  redirect(`/canvas/${project.id}`);
}

export async function deleteProject(projectId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
