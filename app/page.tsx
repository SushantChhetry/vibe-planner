import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileOutput, LayoutGrid, Sparkles } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { AbstractCanvasPreview } from "@/components/marketing/AbstractCanvasPreview";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { MADE_FOR_LOGOS } from "@/lib/made-for-logos";

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
              Skip the endless prompt tennis. Map a low-fidelity wireframe—screens, flows,
              and blocks you can actually design and build on top of.
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
            <AbstractCanvasPreview />
          </div>
        </div>

        <section className="mt-16 md:mt-20" aria-labelledby="made-for-heading">
          <div className="rounded-2xl border border-stone-200/80 bg-white/50 px-6 py-10 shadow-sm shadow-stone-900/5 backdrop-blur-sm sm:px-10">
            <h2
              id="made-for-heading"
              className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-stone-500"
            >
              Made for
            </h2>
            <ul
              className="mt-8 flex list-none flex-wrap items-center justify-center gap-x-8 gap-y-6 sm:gap-x-10"
              aria-label="Tools and platforms"
            >
              {MADE_FOR_LOGOS.map((logo) => (
                <li key={logo.src} className="flex items-center justify-center">
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={132}
                    height={40}
                    unoptimized
                    className="h-7 w-auto max-w-[6.5rem] object-contain object-center opacity-[0.88] transition hover:opacity-100 sm:h-8 sm:max-w-[7.5rem]"
                  />
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center text-xs text-stone-400">
              Trademarks belong to their owners. Marks from{" "}
              <a
                href="https://simpleicons.org/"
                className="underline decoration-stone-300 underline-offset-2 hover:text-stone-600"
                rel="noreferrer"
                target="_blank"
              >
                Simple Icons
              </a>{" "}
              (CC0) and vendor brand pages where applicable.
            </p>
          </div>
        </section>

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
      </main>
    </div>
  );
}
