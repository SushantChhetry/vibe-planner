-- Page purpose + sitemap positions; inter-page navigation; wireframe JSON meta (links, form behavior)

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sitemap_x DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS sitemap_y DOUBLE PRECISION;

CREATE TABLE public.page_navigation_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  source_page_id UUID NOT NULL REFERENCES public.pages (id) ON DELETE CASCADE,
  target_page_id UUID NOT NULL REFERENCES public.pages (id) ON DELETE CASCADE,
  label TEXT
);

CREATE INDEX page_navigation_edges_project_id_idx
  ON public.page_navigation_edges (project_id);
CREATE INDEX page_navigation_edges_source_idx
  ON public.page_navigation_edges (source_page_id);
CREATE INDEX page_navigation_edges_target_idx
  ON public.page_navigation_edges (target_page_id);

ALTER TABLE public.page_navigation_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD page nav in own projects"
  ON public.page_navigation_edges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = page_navigation_edges.project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = page_navigation_edges.project_id AND p.user_id = auth.uid()
    )
  );

ALTER TABLE public.wireframe_elements
  ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}'::jsonb;
