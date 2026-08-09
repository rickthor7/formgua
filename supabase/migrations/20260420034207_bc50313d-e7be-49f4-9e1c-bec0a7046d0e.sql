-- Add giveaway mode and amount fields
ALTER TABLE public.forms 
  ADD COLUMN IF NOT EXISTS giveaway_mode text NOT NULL DEFAULT 'equal',
  ADD COLUMN IF NOT EXISTS giveaway_total_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS giveaway_winner_count integer NOT NULL DEFAULT 1;

ALTER TABLE public.giveaway_entries
  ADD COLUMN IF NOT EXISTS amount_won integer;