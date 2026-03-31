"use client";

import Link from "next/link";
import { CircleHelp, LayoutDashboard } from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";

export function SiteAuthNav() {
  return (
    <>
      <Link
        href="/help"
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-200/50 hover:text-stone-900"
      >
        <CircleHelp className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        <span className="hidden sm:inline">Help</span>
      </Link>
      <Show when="signed-out">
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-900 shadow-sm transition hover:bg-stone-50"
        >
          Sign up
        </Link>
      </Show>
      <Show when="signed-in">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-900 shadow-sm shadow-stone-900/5 transition hover:border-stone-300 hover:bg-stone-50"
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
          Dashboard
        </Link>
        <UserButton
          appearance={{
            elements: { userButtonAvatarBox: "h-9 w-9" },
          }}
        />
      </Show>
    </>
  );
}
