
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;
ALTER TABLE public.form_responses ADD COLUMN IF NOT EXISTS participant_name TEXT;

CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE code TEXT; attempts INT := 0;
BEGIN
  LOOP
    code := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
    IF NOT EXISTS (SELECT 1 FROM public.forms WHERE join_code = code) THEN
      RETURN code;
    END IF;
    attempts := attempts + 1;
    IF attempts > 20 THEN
      RETURN lpad((floor(random() * 9000000) + 1000000)::int::text, 7, '0');
    END IF;
  END LOOP;
END; $$;

CREATE OR REPLACE FUNCTION public.set_form_join_code()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.join_code IS NULL AND NEW.form_type = 'ujian' THEN
    NEW.join_code := public.generate_join_code();
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS set_form_join_code_trigger ON public.forms;
CREATE TRIGGER set_form_join_code_trigger
BEFORE INSERT OR UPDATE ON public.forms
FOR EACH ROW EXECUTE FUNCTION public.set_form_join_code();

UPDATE public.forms SET join_code = public.generate_join_code()
WHERE form_type = 'ujian' AND join_code IS NULL;

DROP POLICY IF EXISTS "Public can read leaderboard" ON public.form_responses;
CREATE POLICY "Public can read leaderboard"
ON public.form_responses FOR SELECT
TO anon, authenticated
USING (completed = true);
