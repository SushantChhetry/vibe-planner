import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SupportNav } from "@/components/support/SupportNav";

export function SupportShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100/35 via-[var(--background)] to-stone-100/50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <BrandLogo className="h-6 w-auto sm:h-7" />
            <p className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-[1.65rem]">
              Help center
            </p>
            <p className="max-w-md text-sm leading-relaxed text-stone-600">
              Guides, answers, and workflows—everything in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-stone-200/80 pt-4 sm:border-t-0 sm:pt-0">
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-200/90 bg-white/80 px-3 text-sm font-medium text-stone-700 shadow-sm shadow-stone-900/5 transition hover:border-stone-300 hover:bg-white hover:text-stone-900"
            >
              <ArrowLeft className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              Home
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-200/90 bg-white/80 px-3 text-sm font-medium text-stone-700 shadow-sm shadow-stone-900/5 transition hover:border-teal-200 hover:bg-teal-50/60 hover:text-teal-900"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              Dashboard
            </Link>
          </div>
        </header>

        <div className="mt-8">
          <SupportNav />
        </div>

        <article className="prose prose-stone mt-8 max-w-none rounded-2xl border border-[var(--support-border)] bg-[var(--support-surface)] px-6 py-8 shadow-[0_2px_8px_-2px_rgba(28,25,23,0.06),0_1px_2px_rgba(28,25,23,0.04)] backdrop-blur-md prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:tracking-tight prose-h1:mb-3 prose-h1:mt-0 prose-h1:text-2xl prose-h1:text-balance prose-h1:font-semibold prose-h1:leading-snug prose-h2:mb-3 prose-h2:mt-10 prose-h2:border-b prose-h2:border-stone-200/80 prose-h2:pb-2 prose-h2:text-xl prose-h2:font-semibold prose-h3:mb-2 prose-h3:mt-8 prose-h3:text-lg prose-p:leading-relaxed prose-p:text-stone-700 prose-a:no-underline prose-strong:font-semibold prose-strong:text-stone-900 prose-li:marker:text-teal-700/80 prose-pre:bg-transparent prose-pre:p-0 sm:px-10 sm:py-10">
          {children}
        </article>
      </div>
    </div>
  );
}
