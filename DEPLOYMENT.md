# Deploying PuMi

## Environment variables

Set these in Vercel (Project → Settings → Environment Variables) and in local `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous (public) key

## Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL migrations in order in the SQL Editor (or `npx supabase db push`): [`001_initial.sql`](supabase/migrations/001_initial.sql) through [`005_sitemap_and_wireframe_meta.sql`](supabase/migrations/005_sitemap_and_wireframe_meta.sql) (includes [`004_profiles_billing.sql`](supabase/migrations/004_profiles_billing.sql) for Stripe fields).
3. **Authentication → URL configuration**
   - **Site URL**: your production app URL (e.g. `https://your-app.vercel.app`).
   - **Redirect URLs**: add  
     `http://localhost:3000/auth/callback`  
     `https://your-app.vercel.app/auth/callback`
4. Enable the **Email** provider for magic links (Auth → Providers → Email).

## Vercel

1. Connect the repo and deploy.
2. Add the same `NEXT_PUBLIC_*` variables as above.
3. Redeploy after changing env vars.

Ensure production Supabase redirect URLs match your deployed domain exactly.
