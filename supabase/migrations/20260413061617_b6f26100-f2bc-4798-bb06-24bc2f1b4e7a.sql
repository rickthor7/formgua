
-- Add giveaway columns to forms table
ALTER TABLE public.forms ADD COLUMN giveaway_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.forms ADD COLUMN giveaway_ewallets text[] NOT NULL DEFAULT '{}';

-- Create giveaway_entries table
CREATE TABLE public.giveaway_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  response_id uuid REFERENCES public.form_responses(id) ON DELETE CASCADE,
  phone text NOT NULL,
  ewallet text NOT NULL,
  is_winner boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read giveaway entries" ON public.giveaway_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert giveaway entries" ON public.giveaway_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update giveaway entries" ON public.giveaway_entries FOR UPDATE USING (true);
