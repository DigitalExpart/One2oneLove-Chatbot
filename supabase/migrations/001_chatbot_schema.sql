-- One2One Love Chatbot Database Schema

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Chatbot Conversations Table
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot Messages Table
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- Store context, feature triggers, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot Knowledge Base (for RAG)
CREATE TABLE IF NOT EXISTS chatbot_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- 'feature', 'article', 'faq', 'tip', 'advice'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002 or similar
  metadata JSONB DEFAULT '{}'::jsonb, -- language, tags, subscription_tier, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON chatbot_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON chatbot_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_content_type ON chatbot_knowledge(content_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON chatbot_knowledge USING ivfflat (embedding vector_cosine_ops);

-- Row Level Security (RLS) Policies
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_knowledge ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
  ON chatbot_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON chatbot_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON chatbot_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON chatbot_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Users can only see messages in their conversations
CREATE POLICY "Users can view own messages"
  ON chatbot_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chatbot_conversations
      WHERE chatbot_conversations.id = chatbot_messages.conversation_id
      AND chatbot_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON chatbot_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chatbot_conversations
      WHERE chatbot_conversations.id = chatbot_messages.conversation_id
      AND chatbot_conversations.user_id = auth.uid()
    )
  );

-- Knowledge base is readable by all authenticated users
CREATE POLICY "Authenticated users can view knowledge base"
  ON chatbot_knowledge FOR SELECT
  USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON chatbot_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_updated_at
  BEFORE UPDATE ON chatbot_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get conversation context (recent messages)
CREATE OR REPLACE FUNCTION get_conversation_context(
  p_conversation_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  role TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.role,
    cm.content,
    cm.created_at
  FROM chatbot_messages cm
  WHERE cm.conversation_id = p_conversation_id
  ORDER BY cm.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

