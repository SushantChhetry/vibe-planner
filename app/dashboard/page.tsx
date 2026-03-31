import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { NewProjectButton } from "@/components/dashboard/NewProjectButton";
import { getSubscriptionState } from "@/lib/subscription";
import { requireProfileId } from "@/lib/auth/profile";

type ProjectRow = {
  id: string;
  name: string;
  updated_at: string;
  pages: { id: string; blocks: { id: string }[] }[];
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profileId = await requireProfileId();
  const supabase = await createClient();
  const sp = await searchParams;
  const err = typeof sp.error === "string" ? sp.error : undefined;

  const { isPro } = await getSubscriptionState(supabase, profileId);

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
    .eq("user_id", profileId)
    .order("updated_at", { ascending: false });

  if (error) {
    const isSchemaCache =
      error.code === "PGRST204" &&
      typeof error.message === "string" &&
      error.message.includes("clerk_user_id");
    const isJwtVerifyFailure =
      error.code === "PGRST301" ||
      (typeof error.message === "string" &&
        error.message.toLowerCase().includes("no suitable key"));
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-red-600">
        <p className="font-medium">Could not load projects.</p>
        <p className="mt-2 text-sm font-normal text-stone-700">{error.message}</p>
        {isJwtVerifyFailure && (
          <div className="mt-4 space-y-3 text-sm font-normal text-stone-600">
            <p>
              Supabase could not verify your Clerk session token (JWT). Fix the integration, then
              refresh:
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                In{" "}
                <a
                  className="text-teal-800 underline"
                  href="https://dashboard.clerk.com/setup/supabase"
                  target="_blank"
                  rel="noreferrer"
                >
                  Clerk → Connect with Supabase
                </a>
                , finish setup so session tokens include the{" "}
                <code className="rounded bg-stone-100 px-1 text-stone-800">role</code> claim (
                <code className="rounded bg-stone-100 px-1 text-stone-800">authenticated</code>).
              </li>
              <li>
                In Supabase → Authentication → Sign In / Up →{" "}
                <strong>Third-party Clerk</strong>, add your Clerk domain (same instance as the app).
              </li>
              <li>
                In <code className="rounded bg-stone-100 px-1 text-stone-800">.env.local</code>, set{" "}
                <code className="rounded bg-stone-100 px-1 text-stone-800">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>{" "}
                to the project&apos;s <strong>anon</strong> or <strong>publishable</strong> key from
                Settings → API / API Keys — not the <code className="rounded bg-stone-100 px-1 text-stone-800">service_role</code>{" "}
                / secret key.
              </li>
            </ol>
          </div>
        )}
        {isSchemaCache && (
          <p className="mt-4 text-sm font-normal text-stone-600">
            If you just ran migration 006, the API may need a schema refresh. In the Supabase SQL
            editor run:{" "}
            <code className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-800">
              NOTIFY pgrst, &apos;reload schema&apos;;
            </code>
            Or wait a minute and refresh. Also confirm Clerk is added under Authentication → Sign In /
            Up → Third Party → Clerk with your Clerk domain.
          </p>
        )}
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

        {err === "create" && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            <p className="font-medium">Could not create the project.</p>
            <p className="mt-2 font-normal text-red-800/95">
              If this keeps happening, confirm{" "}
              <a
                className="font-medium underline"
                href="https://dashboard.clerk.com/setup/supabase"
                target="_blank"
                rel="noreferrer"
              >
                Clerk → Supabase
              </a>{" "}
              is set up and{" "}
              <code className="rounded bg-red-100 px-1 text-red-950">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
              is present in your server env (needed for secure server-side creates).
            </p>
          </div>
        )}

        {err === "page" && (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            The project was created but the first page could not be saved. Try deleting the project or contact support.
          </p>
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
