-- Chat messages between user & admin
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,         -- the end-user this thread belongs to
  sender_id uuid NOT NULL,       -- whoever sent the message (user or admin)
  is_admin boolean NOT NULL DEFAULT false,
  message text,
  image_url text,
  read_by_admin boolean NOT NULL DEFAULT false,
  read_by_user boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_user_created ON public.chat_messages (user_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users see their own thread; admins see all
CREATE POLICY "Users view own thread or admin all"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- Users insert into own thread as themselves (non-admin flag)
CREATE POLICY "Users send to own thread"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND sender_id = auth.uid()
    AND is_admin = false
  );

-- Admins can insert into any thread as admin
CREATE POLICY "Admin reply to any thread"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND sender_id = auth.uid()
    AND is_admin = true
  );

-- Allow updating read flags (user marks own thread read; admin marks any read)
CREATE POLICY "Update read flags"
  ON public.chat_messages FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- Storage bucket for chat images (public read for simplicity)
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Chat images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');

CREATE POLICY "Authenticated upload chat images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-images');
