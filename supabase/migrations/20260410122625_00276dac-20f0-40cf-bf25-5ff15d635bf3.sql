
-- Add slug column to forms table
ALTER TABLE public.forms ADD COLUMN slug TEXT UNIQUE;

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces/special chars with hyphens
  base_slug := lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  IF base_slug = '' THEN
    base_slug := 'form';
  END IF;
  
  final_slug := base_slug;
  
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.forms WHERE slug = final_slug) THEN
      RETURN final_slug;
    END IF;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
END;
$$;

-- Create trigger to auto-generate slug on insert
CREATE OR REPLACE FUNCTION public.set_form_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_form_slug
BEFORE INSERT ON public.forms
FOR EACH ROW
EXECUTE FUNCTION public.set_form_slug();

-- Generate slugs for existing forms
UPDATE public.forms SET slug = public.generate_slug(title) WHERE slug IS NULL;
