import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { NewProjectButton } from "@/components/dashboard/NewProjectButton";
import { getSubscriptionState } from "@/lib/subscription";

type ProjectRow = {
  id: string;
  name: string;
  updated_at: string;
  pages: { id: string; blocks: { id: string }[] }[];
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = createClient();
  const err = typeof searchParams?.error === "string" ? searchParams.error : undefined;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { isPro } = await getSubscriptionState(supabase, user.id);

  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      updated_at,
      pages (
        id,
        blocks ( id )
      )
    `
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-red-600">
        Could not load projects.
      </div>
    );
  }

  const list = (projects ?? []) as unknown as ProjectRow[];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                Home
              </Link>
              <Link
                href="/help"
                className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800"
              >
                <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                Help &amp; onboarding
              </Link>
              <Link
                href="/settings/billing"
                className="text-sm text-stone-500 hover:text-stone-800"
              >
                {isPro ? "Billing" : "Upgrade"}
              </Link>
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-stone-900">Projects</h1>
            <p className="mt-1 text-sm text-stone-500">
              {isPro ? (
                <span className="text-teal-700">Premium</span>
              ) : (
                <>Free plan — 1 project. <Link href="/settings/billing" className="text-teal-700 underline">Upgrade</Link> for more.</>
              )}
            </p>
          </div>
          <NewProjectButton isPro={isPro} projectCount={list.length} />
        </div>

        {err === "premium_project_limit" && (
          <div className="mt-6 flex gap-3 rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-white to-teal-50/50 px-4 py-3.5 shadow-sm ring-1 ring-amber-100/60">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-amber-100">
              <Sparkles className="h-4 w-4 text-amber-700" aria-hidden />
            </span>
            <p className="min-w-0 text-sm leading-relaxed text-amber-950">
              You&apos;ve reached the free plan limit (1 project).{" "}
              <Link
                href="/settings/billing"
                className="font-semibold text-teal-800 underline decoration-teal-800/30 underline-offset-2 transition hover:decoration-teal-800"
              >
                Upgrade to Premium
              </Link>{" "}
              for unlimited projects and Pro features.
            </p>
          </div>
        )}

        {err === "delete" && (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Could not delete that project. Try again or refresh the page.
          </p>
        )}

        {list.length === 0 ? (
          <p className="mt-16 text-center text-stone-600">
            No projects yet. Create one to start planning.
          </p>
        ) : (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {list.map((p) => {
              const pageCount = p.pages?.length ?? 0;
              const blockCount =
                p.pages?.reduce((acc, page) => acc + (page.blocks?.length ?? 0), 0) ?? 0;
              return (
                <li key={p.id}>
                  <ProjectCard
                    project={{
                      id: p.id,
                      name: p.name,
                      updated_at: p.updated_at,
                    }}
                    pageCount={pageCount}
                    blockCount={blockCount}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
