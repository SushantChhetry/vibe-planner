"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CircleHelp, ListOrdered, Sparkles } from "lucide-react";

const base =
  "inline-flex min-h-[2.25rem] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm transition";

function linkClass(href: string, pathname: string) {
  const active =
    href === "/help"
      ? pathname === "/help"
      : pathname === href || pathname.startsWith(`${href}/`);
  return `${base} ${
    active
      ? "bg-white font-medium text-stone-900 shadow-sm shadow-stone-900/8 ring-1 ring-stone-200/90"
      : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
  }`;
}

export function SupportNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Help sections"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-stone-500 sm:sr-only">
        Browse
      </p>
      <div className="flex flex-wrap gap-1 rounded-xl bg-stone-200/40 p-1.5 ring-1 ring-stone-200/50">
        <Link href="/help" className={linkClass("/help", pathname)}>
          <BookOpen className="h-4 w-4 shrink-0 text-teal-700/90" aria-hidden />
          Overview
        </Link>
        <Link href="/onboarding" className={linkClass("/onboarding", pathname)}>
          <Sparkles className="h-4 w-4 shrink-0 text-teal-700/90" aria-hidden />
          Getting started
        </Link>
        <Link href="/help/faq" className={linkClass("/help/faq", pathname)}>
          <CircleHelp className="h-4 w-4 shrink-0 text-teal-700/90" aria-hidden />
          FAQ
        </Link>
        <Link href="/help/how-tos" className={linkClass("/help/how-tos", pathname)}>
          <ListOrdered className="h-4 w-4 shrink-0 text-teal-700/90" aria-hidden />
          How-tos
        </Link>
      </div>
    </nav>
  );
}
