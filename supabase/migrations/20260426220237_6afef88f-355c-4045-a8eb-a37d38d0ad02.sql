-- 1. Add owner_id to forms (nullable: existing forms remain guest)
ALTER TABLE public.forms
ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_forms_owner_id ON public.forms(owner_id);

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Update RLS on forms: owners-only for owned forms, public for guest forms
DROP POLICY IF EXISTS "Anyone can update forms" ON public.forms;
DROP POLICY IF EXISTS "Anyone can delete forms" ON public.forms;
DROP POLICY IF EXISTS "Anyone can create forms" ON public.forms;

-- Read stays public (forms must be fillable by anyone)
-- Insert: anyone can insert; owner_id must match auth.uid() if set, or be null
CREATE POLICY "Anyone can create forms"
ON public.forms FOR INSERT
WITH CHECK (
  owner_id IS NULL OR owner_id = auth.uid()
);

-- Update: owner only if owner_id set; anyone if owner_id is null (guest form)
CREATE POLICY "Owners or guests can update forms"
ON public.forms FOR UPDATE
USING (
  owner_id IS NULL OR owner_id = auth.uid()
);

-- Delete: same rule
CREATE POLICY "Owners or guests can delete forms"
ON public.forms FOR DELETE
USING (
  owner_id IS NULL OR owner_id = auth.uid()
);