import { SignIn } from "@clerk/nextjs";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export default async function LoginPage({
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
        <SignIn
          routing="path"
          path="/login"
          fallbackRedirectUrl={next}
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}
