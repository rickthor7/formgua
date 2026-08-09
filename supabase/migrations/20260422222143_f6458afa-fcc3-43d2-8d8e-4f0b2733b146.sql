ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS layout_mode TEXT NOT NULL DEFAULT 'paginated';