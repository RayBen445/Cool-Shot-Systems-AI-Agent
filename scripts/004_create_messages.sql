-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  mode TEXT,
  metadata JSONB DEFAULT '{}',
  artifacts JSONB DEFAULT '[]',
  tool_calls JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages (user can only access messages in their own conversations)
CREATE POLICY "messages_select_own" ON public.messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_own" ON public.messages 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "messages_update_own" ON public.messages 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "messages_delete_own" ON public.messages 
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);
