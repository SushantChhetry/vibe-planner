-- Clerk-only auth: profiles no longer reference auth.users; RLS uses JWT sub (Clerk user id).
-- Run after enabling Clerk as a third-party auth provider in Supabase (Authentication → Sign In / Up → Clerk).

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_clerk_user_id_uidx
  ON public.profiles (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users CRUD own projects" ON public.projects;
DROP POLICY IF EXISTS "Users CRUD pages in own projects" ON public.pages;
DROP POLICY IF EXISTS "Users CRUD blocks in own pages" ON public.blocks;
DROP POLICY IF EXISTS "Users CRUD edges in own pages" ON public.edges;
DROP POLICY IF EXISTS "Users CRUD wireframe elements in own blocks" ON public.wireframe_elements;
DROP POLICY IF EXISTS "Users CRUD page nav in own projects" ON public.page_navigation_edges;

CREATE OR REPLACE FUNCTION public.profile_owned_by_jwt(profile_pk uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = profile_pk
      AND p.clerk_user_id IS NOT NULL
      AND (SELECT auth.jwt()->>'sub') = p.clerk_user_id
  );
$$;

CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (profile_owned_by_jwt(id));

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (profile_owned_by_jwt(id));

CREATE POLICY "Users CRUD own projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (profile_owned_by_jwt(user_id))
  WITH CHECK (profile_owned_by_jwt(user_id));

CREATE POLICY "Users CRUD pages in own projects"
  ON public.pages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = pages.project_id AND profile_owned_by_jwt(p.user_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = pages.project_id AND profile_owned_by_jwt(p.user_id)
    )
  );

CREATE POLICY "Users CRUD blocks in own pages"
  ON public.blocks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pages pg
      JOIN public.projects p ON p.id = pg.project_id
      WHERE pg.id = blocks.page_id AND profile_owned_by_jwt(p.user_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pages pg
      JOIN public.projects p ON p.id = pg.project_id
      WHERE pg.id = blocks.page_id AND profile_owned_by_jwt(p.user_id)
    )
  );

CREATE POLICY "Users CRUD edges in own pages"
  ON public.edges FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pages pg
      JOIN public.projects p ON p.id = pg.project_id
      WHERE pg.id = edges.page_id AND profile_owned_by_jwt(p.user_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pages pg
      JOIN public.projects p ON p.id = pg.project_id
      WHERE pg.id = edges.page_id AND profile_owned_by_jwt(p.user_id)
    )
  );

CREATE POLICY "Users CRUD wireframe elements in own blocks"
  ON public.wireframe_elements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.blocks b
      JOIN public.pages pg ON pg.id = b.page_id
      JOIN public.projects p ON p.id = pg.project_id
      WHERE b.id = wireframe_elements.parent_block_id AND profile_owned_by_jwt(p.user_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.blocks b
      JOIN public.pages pg ON pg.id = b.page_id
      JOIN public.projects p ON p.id = pg.project_id
      WHERE b.id = wireframe_elements.parent_block_id AND profile_owned_by_jwt(p.user_id)
    )
  );

CREATE POLICY "Users CRUD page nav in own projects"
  ON public.page_navigation_edges FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = page_navigation_edges.project_id AND profile_owned_by_jwt(p.user_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = page_navigation_edges.project_id AND profile_owned_by_jwt(p.user_id)
    )
  );
