"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const err = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-8 sm:pt-12 md:pt-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-stretch lg:gap-12">
        <div className="relative hidden overflow-hidden rounded-2xl border border-stone-200/80 bg-gradient-to-br from-teal-800 via-teal-700 to-stone-800 p-10 text-white shadow-xl shadow-stone-900/15 lg:flex lg:flex-col lg:justify-between">
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-teal-400/20 blur-3xl"
            aria-hidden
          />
          <div className="relative">
            <div className="relative max-w-[11rem] drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
              <BrandLogo className="h-8 w-auto sm:h-9" priority />
            </div>
            <p className="mt-6 text-2xl font-semibold leading-snug tracking-tight text-white">
              One map. Clear handoff. Less rework.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-teal-100/85">
              Sign in with email—we&apos;ll send a magic link. No password to forget.
            </p>
          </div>
          <p className="relative text-xs text-teal-200/70">
            After you confirm, you&apos;ll return to your projects.
          </p>
        </div>

        <div className="flex flex-col justify-center">
          <Link
            href="/"
            className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-stone-600 transition hover:text-stone-900 lg:mb-8"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Back to home
          </Link>

          <div className="rounded-2xl border border-stone-200/80 bg-white/80 p-8 shadow-xl shadow-stone-900/8 backdrop-blur-md sm:p-9">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700/10 text-teal-800">
              <Mail className="h-5 w-5" aria-hidden />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-stone-900">Sign in</h1>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Enter your email and we&apos;ll send a one-time link. No password.
            </p>

            {err ? (
              <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                Something went wrong confirming your email. Try again.
              </p>
            ) : null}

            {status === "sent" ? (
              <p className="mt-6 rounded-xl border border-teal-200/80 bg-teal-50/80 px-4 py-3 text-sm text-teal-900">
                Check your inbox for the link to continue.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <label className="block text-sm font-medium text-stone-800">
                  Email
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 outline-none ring-teal-600/0 transition placeholder:text-stone-400 focus:border-teal-600/50 focus:ring-2 focus:ring-teal-600/30"
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                </label>
                <Button type="submit" disabled={status === "sending"} className="w-full rounded-xl py-2.5 font-semibold">
                  {status === "sending" ? "Sending…" : "Email me a link"}
                </Button>
                {status === "error" ? (
                  <p className="text-sm text-red-600">Could not send link. Try again.</p>
                ) : null}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
