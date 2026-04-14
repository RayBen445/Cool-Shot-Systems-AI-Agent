-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  mode TEXT DEFAULT 'chat',
  is_pinned BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "conversations_select_own" ON public.conversations 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "conversations_insert_own" ON public.conversations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversations_update_own" ON public.conversations 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "conversations_delete_own" ON public.conversations 
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS conversations_is_pinned_idx ON public.conversations(is_pinned);
