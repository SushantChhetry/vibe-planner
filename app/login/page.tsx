import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export default function LoginPage() {
  return (
    <div className="marketing-mesh min-h-screen text-[var(--foreground)]">
      <SiteHeader signedIn={false} />
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center text-stone-500">
            Loading…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
