import { SignUp } from "@clerk/nextjs";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : "/dashboard";

  return (
    <div className="marketing-mesh min-h-screen text-[var(--foreground)]">
      <SiteHeader />
      <div className="mx-auto flex max-w-md justify-center px-6 py-16">
        <SignUp
          routing="path"
          path="/sign-up"
          fallbackRedirectUrl={next}
          signInUrl="/login"
        />
      </div>
    </div>
  );
}
