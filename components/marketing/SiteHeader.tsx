import Link from "next/link";
import { CircleHelp, LayoutDashboard } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

type Props = {
  signedIn: boolean;
};

export function SiteHeader({ signedIn }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-[var(--background)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="block transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 rounded-sm"
        >
          <BrandLogo className="h-7 w-auto sm:h-8" priority />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Site">
          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-200/50 hover:text-stone-900"
          >
            <CircleHelp className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <span className="hidden sm:inline">Help</span>
          </Link>
          {signedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-900 shadow-sm shadow-stone-900/5 transition hover:border-stone-300 hover:bg-stone-50"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
