-- Tambahkan kolom form_type untuk membedakan tipe form (bebas/responden/ujian)
ALTER TABLE public.forms 
  ADD COLUMN IF NOT EXISTS form_type TEXT NOT NULL DEFAULT 'bebas';

-- Tambahkan kolom untuk menyimpan skor pada respons (khusus form ujian)
ALTER TABLE public.form_responses
  ADD COLUMN IF NOT EXISTS score INTEGER,
  ADD COLUMN IF NOT EXISTS max_score INTEGER,
  ADD COLUMN IF NOT EXISTS correct_count INTEGER,
  ADD COLUMN IF NOT EXISTS wrong_count INTEGER;