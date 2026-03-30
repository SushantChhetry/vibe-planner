import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin: urlOrigin } = requestUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const supabaseErr = searchParams.get("error_description") ?? searchParams.get("error");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const isLocal = Boolean(host?.includes("localhost") || host?.includes("127.0.0.1"));
  const redirectOrigin =
    forwardedHost && !isLocal
      ? `https://${forwardedHost}`
      : urlOrigin;

  if (supabaseErr) {
    const q = new URLSearchParams({ error: "auth", reason: supabaseErr.slice(0, 200) });
    return NextResponse.redirect(`${redirectOrigin}/login?${q}`);
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              /* ignore */
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${redirectOrigin}${next.startsWith("/") ? next : `/${next}`}`);
    }

    const q = new URLSearchParams({
      error: "auth",
      reason: (error.message ?? "exchange_failed").slice(0, 200),
    });
    return NextResponse.redirect(`${redirectOrigin}/login?${q}`);
  }

  return NextResponse.redirect(`${redirectOrigin}/login?error=auth`);
}
