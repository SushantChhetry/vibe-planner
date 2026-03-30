-- PuMi initial schema + RLS
-- Run in Supabase SQL editor or via Supabase CLI.

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled project',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX projects_user_id_idx ON public.projects (user_id);

CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Page',
  "order" INT NOT NULL DEFAULT 0
);

CREATE INDEX pages_project_id_idx ON public.pages (project_id);

CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages (id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX blocks_page_id_idx ON public.blocks (page_id);

CREATE TABLE public.edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages (id) ON DELETE CASCADE,
  source_block_id UUID NOT NULL REFERENCES public.blocks (id) ON DELETE CASCADE,
  target_block_id UUID NOT NULL REFERENCES public.blocks (id) ON DELETE CASCADE,
  label TEXT
);

CREATE INDEX edges_page_id_idx ON public.edges (page_id);
CREATE INDEX edges_source_idx ON public.edges (source_block_id);
CREATE INDEX edges_target_idx ON public.edges (target_block_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users CRUD own projects"
  ON public.projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users CRUD pages in own projects"
  ON public.pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = pages.project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = pages.project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users CRUD blocks in own pages"
  ON public.blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pages pg
      JOIN public.projects p ON p.id = pg.project_id
      WHERE pg.id = blocks.page_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pages pg
      JOIN public.projects p ON p.id = pg.project_id
      WHERE pg.id = blocks.page_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users CRUD edges in own pages"
  ON public.edges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pages pg
      JOIN public.projects p ON p.id = pg.project_id
      WHERE pg.id = edges.page_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pages pg
      JOIN public.projects p ON p.id = pg.project_id
      WHERE pg.id = edges.page_id AND p.user_id = auth.uid()
    )
  );
