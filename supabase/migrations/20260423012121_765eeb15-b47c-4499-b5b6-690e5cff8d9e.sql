-- Create public bucket for form file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('form-uploads', 'form-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload (public forms)
CREATE POLICY "Anyone can upload to form-uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'form-uploads');

-- Allow anyone to read (so dashboard can preview/download)
CREATE POLICY "Anyone can read form-uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'form-uploads');