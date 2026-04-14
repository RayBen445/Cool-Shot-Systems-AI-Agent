-- Create saved prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompts
CREATE POLICY "prompts_select_own" ON public.prompts 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "prompts_insert_own" ON public.prompts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prompts_update_own" ON public.prompts 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "prompts_delete_own" ON public.prompts 
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS prompts_user_id_idx ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS prompts_category_idx ON public.prompts(category);
CREATE INDEX IF NOT EXISTS prompts_is_favorite_idx ON public.prompts(is_favorite);
