-- Wireframe elements nested under section blocks (stack order, low-fi types)

CREATE TABLE public.wireframe_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_block_id UUID NOT NULL REFERENCES public.blocks (id) ON DELETE CASCADE,
  element_type TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX wireframe_elements_parent_block_id_idx
  ON public.wireframe_elements (parent_block_id);

CREATE INDEX wireframe_elements_parent_sort_idx
  ON public.wireframe_elements (parent_block_id, sort_order);

ALTER TABLE public.wireframe_elements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD wireframe elements in own blocks"
  ON public.wireframe_elements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.blocks b
      JOIN public.pages pg ON pg.id = b.page_id
      JOIN public.projects p ON p.id = pg.project_id
      WHERE b.id = wireframe_elements.parent_block_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.blocks b
      JOIN public.pages pg ON pg.id = b.page_id
      JOIN public.projects p ON p.id = pg.project_id
      WHERE b.id = wireframe_elements.parent_block_id AND p.user_id = auth.uid()
    )
  );
