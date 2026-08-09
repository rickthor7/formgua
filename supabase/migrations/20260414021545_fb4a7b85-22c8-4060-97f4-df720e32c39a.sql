ALTER TABLE public.forms ADD COLUMN notify_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.forms ADD COLUMN notify_email text DEFAULT NULL;