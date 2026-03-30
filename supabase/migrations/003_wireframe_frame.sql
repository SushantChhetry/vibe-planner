-- Free-form wireframe layout: each element has a bounding box on an artboard

ALTER TABLE public.wireframe_elements
  ADD COLUMN IF NOT EXISTS frame_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frame_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frame_w DOUBLE PRECISION NOT NULL DEFAULT 160,
  ADD COLUMN IF NOT EXISTS frame_h DOUBLE PRECISION NOT NULL DEFAULT 48;

-- Spread legacy stack order into vertical layout so old projects open sensibly
WITH ranked AS (
  SELECT
    id,
    24::double precision AS nx,
    ((ROW_NUMBER() OVER (PARTITION BY parent_block_id ORDER BY sort_order, id) - 1) * 72 + 24)::double precision AS ny
  FROM public.wireframe_elements
)
UPDATE public.wireframe_elements w
SET
  frame_x = ranked.nx,
  frame_y = ranked.ny
FROM ranked
WHERE w.id = ranked.id
  AND w.frame_x = 0
  AND w.frame_y = 0;
