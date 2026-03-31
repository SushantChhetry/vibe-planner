import Link from "next/link";
import { ArrowRight, FileOutput, LayoutGrid, Sparkles } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export default async function HomePage() {
  const { userId } = await auth();
  const signedIn = Boolean(userId);
  const ctaHref = signedIn ? "/canvas/new" : "/login?next=/canvas/new";

  return (
    <div className="marketing-mesh min-h-screen text-[var(--foreground)]">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 sm:pt-16 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800/90">
              Structure before code
            </p>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl md:text-[2.75rem] md:leading-[1.08]">
              Map your app before you build it.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-stone-600">
              A free-form canvas for screens, blocks, and navigation. Export Markdown,{" "}
              <code className="rounded-md border border-stone-200/80 bg-white px-1.5 py-0.5 font-mono text-[0.9em] text-stone-800">
                .cursorrules
              </code>
              ,{" "}
              <code className="rounded-md border border-stone-200/80 bg-white px-1.5 py-0.5 font-mono text-[0.9em] text-stone-800">
                CLAUDE.md
              </code>
              , or JSON for Cursor, Claude, and your toolchain.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              >
                {signedIn ? "New canvas" : "Start free"}
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white/80 px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm shadow-stone-900/5 backdrop-blur-sm transition hover:border-stone-400 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              >
                How it works
              </Link>
            </div>
          </div>

          <div
            className="relative isolate overflow-hidden rounded-2xl border border-stone-200/80 bg-white/60 p-6 shadow-xl shadow-stone-900/5 ring-1 ring-stone-200/50 backdrop-blur-sm sm:p-8"
            aria-hidden
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom_right,transparent_40%,rgba(15,118,110,0.04)_100%)]" />
            <div className="relative grid grid-cols-6 gap-2 sm:grid-cols-8 sm:gap-2.5">
              {[
                "col-span-4 row-span-1 h-14 rounded-lg border border-dashed border-stone-300/90 bg-stone-50/80",
                "col-span-2 h-14 rounded-lg border border-stone-200 bg-white",
                "col-span-3 h-24 rounded-lg border border-stone-200 bg-white shadow-sm",
                "col-span-3 h-24 rounded-lg border border-stone-200 bg-white/90",
                "col-span-2 h-16 rounded-lg border border-stone-200 bg-stone-50/90",
                "col-span-4 h-16 rounded-lg border border-dashed border-teal-700/25 bg-teal-50/40",
                "col-span-5 h-20 rounded-lg border border-stone-200 bg-white",
                "col-span-3 h-20 rounded-lg border border-stone-200/90 bg-stone-50/70",
              ].map((cls, i) => (
                <div key={i} className={cls} />
              ))}
            </div>
            <p className="relative mt-6 text-center text-xs font-medium uppercase tracking-wider text-stone-500">
              Abstract canvas preview
            </p>
          </div>
        </div>

        <section className="mt-20 md:mt-28">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-stone-500">
            Built for the handoff
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-6 shadow-sm shadow-stone-900/5 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700/10 text-teal-800">
                <LayoutGrid className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-stone-900">Canvas-first</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Pages, blocks, and edges so your IA stays legible while you iterate.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-6 shadow-sm shadow-stone-900/5 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700/10 text-teal-800">
                <FileOutput className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-stone-900">Export you can paste</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Markdown specs and project rules ready for tickets, docs, or AI context.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-6 shadow-sm shadow-stone-900/5 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700/10 text-teal-800">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-stone-900">Vibe-coding ready</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Give models a single source of truth instead of a wall of chat history.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-20 md:mt-28">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-xl font-semibold text-stone-900">Example exports</h2>
            <p className="text-sm text-stone-600">What you might copy out of a project.</p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <pre className="overflow-x-auto rounded-2xl border border-stone-200/80 bg-white/80 p-5 text-sm leading-relaxed text-stone-800 shadow-sm shadow-stone-900/5 backdrop-blur-sm">
              {`# My product
## Landing
- **Hero** (Hero)
  - Headline and primary CTA

### Navigation
- Navbar → Form — _Sign up CTA_`}
            </pre>
            <pre className="overflow-x-auto rounded-2xl border border-stone-200/80 bg-white/80 p-5 text-sm leading-relaxed text-stone-800 shadow-sm shadow-stone-900/5 backdrop-blur-sm">
              {`# App structure (from PuMi)
Project: My product
...
Rules:
- Follow this structure exactly when generating or modifying code.`}
            </pre>
          </div>
        </section>
      </main>
    </div>
  );
}
