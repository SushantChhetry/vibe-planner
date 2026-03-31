import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SiteAuthNav } from "@/components/marketing/SiteAuthNav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-[var(--background)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="block rounded-sm transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        >
          <BrandLogo className="h-7 w-auto sm:h-8" priority />
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2" aria-label="Site">
          <SiteAuthNav />
        </nav>
      </div>
    </header>
  );
}
