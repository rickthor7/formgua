
-- Create forms table
CREATE TABLE public.forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'closed')),
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form_responses table
CREATE TABLE public.form_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- Forms: anyone can read active forms, anyone can manage (for demo, no auth yet)
CREATE POLICY "Anyone can read forms" ON public.forms FOR SELECT USING (true);
CREATE POLICY "Anyone can create forms" ON public.forms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update forms" ON public.forms FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete forms" ON public.forms FOR DELETE USING (true);

-- Responses: anyone can read and create
CREATE POLICY "Anyone can read responses" ON public.form_responses FOR SELECT USING (true);
CREATE POLICY "Anyone can submit responses" ON public.form_responses FOR INSERT WITH CHECK (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON public.forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
