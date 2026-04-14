-- Create artifacts table for generated code/documents
CREATE TABLE IF NOT EXISTS public.artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('code', 'document', 'image', 'diagram', 'chart')),
  language TEXT,
  content TEXT NOT NULL,
  is_saved BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artifacts
CREATE POLICY "artifacts_select_own" ON public.artifacts 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "artifacts_insert_own" ON public.artifacts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "artifacts_update_own" ON public.artifacts 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "artifacts_delete_own" ON public.artifacts 
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS artifacts_user_id_idx ON public.artifacts(user_id);
CREATE INDEX IF NOT EXISTS artifacts_message_id_idx ON public.artifacts(message_id);
CREATE INDEX IF NOT EXISTS artifacts_type_idx ON public.artifacts(type);
CREATE INDEX IF NOT EXISTS artifacts_is_saved_idx ON public.artifacts(is_saved);
