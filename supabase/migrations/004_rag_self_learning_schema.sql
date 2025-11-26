-- RAG Self-Learning System Schema
-- Allows chatbot to learn from conversations and update knowledge base

-- Learning Insights Table - Stores patterns and insights from conversations
CREATE TABLE IF NOT EXISTS chatbot_learning_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID REFERENCES chatbot_platforms(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'pattern', 'question', 'answer', 'feature_usage', 'improvement'
  content TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb, -- Original conversation context, user info, etc.
  confidence_score NUMERIC(3,2) DEFAULT 0.5, -- How confident we are in this insight (0-1)
  usage_count INTEGER DEFAULT 1, -- How many times this insight was useful
  is_approved BOOLEAN DEFAULT false, -- Whether this has been reviewed/approved
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Feedback Table - User feedback on responses
CREATE TABLE IF NOT EXISTS chatbot_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chatbot_messages(id) ON DELETE CASCADE,
  feedback_type TEXT CHECK (feedback_type IN ('helpful', 'not_helpful', 'incorrect', 'suggestion')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
  comment TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge Base Updates Log - Tracks automatic updates
CREATE TABLE IF NOT EXISTS chatbot_knowledge_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_id UUID REFERENCES chatbot_knowledge(id) ON DELETE CASCADE,
  update_type TEXT CHECK (update_type IN ('auto_created', 'auto_updated', 'auto_enhanced')),
  old_content TEXT,
  new_content TEXT,
  source_insight_id UUID REFERENCES chatbot_learning_insights(id),
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Query Patterns Table - Common query patterns for better matching
CREATE TABLE IF NOT EXISTS chatbot_query_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID REFERENCES chatbot_platforms(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL, -- The query pattern (e.g., "how do i send a love note")
  category TEXT NOT NULL, -- 'feature_help', 'relationship_advice', 'date_ideas', etc.
  response_template TEXT, -- Which template to use
  success_count INTEGER DEFAULT 1, -- How many times this pattern led to helpful responses
  total_uses INTEGER DEFAULT 1,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_insights_platform ON chatbot_learning_insights(platform_id);
CREATE INDEX IF NOT EXISTS idx_learning_insights_type ON chatbot_learning_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_learning_insights_confidence ON chatbot_learning_insights(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_conversation ON chatbot_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_message ON chatbot_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON chatbot_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_knowledge_updates_knowledge ON chatbot_knowledge_updates(knowledge_id);
CREATE INDEX IF NOT EXISTS idx_query_patterns_platform ON chatbot_query_patterns(platform_id);
CREATE INDEX IF NOT EXISTS idx_query_patterns_category ON chatbot_query_patterns(category);
CREATE INDEX IF NOT EXISTS idx_query_patterns_pattern ON chatbot_query_patterns USING gin(to_tsvector('english', pattern));

-- RLS Policies
ALTER TABLE chatbot_learning_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_knowledge_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_query_patterns ENABLE ROW LEVEL SECURITY;

-- Users can view learning insights (for transparency)
CREATE POLICY "Users can view learning insights"
  ON chatbot_learning_insights FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can provide feedback on their own conversations
CREATE POLICY "Users can create feedback on own conversations"
  ON chatbot_feedback FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chatbot_conversations
      WHERE chatbot_conversations.id = chatbot_feedback.conversation_id
      AND chatbot_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own feedback"
  ON chatbot_feedback FOR SELECT
  USING (user_id = auth.uid());

-- Knowledge updates are readable by all authenticated users
CREATE POLICY "Users can view knowledge updates"
  ON chatbot_knowledge_updates FOR SELECT
  USING (auth.role() = 'authenticated');

-- Query patterns are readable by all authenticated users
CREATE POLICY "Users can view query patterns"
  ON chatbot_query_patterns FOR SELECT
  USING (auth.role() = 'authenticated');

-- Function to extract insights from conversation
CREATE OR REPLACE FUNCTION extract_conversation_insights(
  p_conversation_id UUID,
  p_platform_id UUID
)
RETURNS TABLE (
  insight_type TEXT,
  content TEXT,
  confidence NUMERIC
) AS $$
DECLARE
  v_messages RECORD;
  v_user_message TEXT;
  v_assistant_message TEXT;
  v_pattern TEXT;
BEGIN
  -- Analyze conversation messages
  FOR v_messages IN
    SELECT role, content
    FROM chatbot_messages
    WHERE conversation_id = p_conversation_id
    ORDER BY created_at
  LOOP
    IF v_messages.role = 'user' THEN
      v_user_message := v_messages.content;
    ELSIF v_messages.role = 'assistant' THEN
      v_assistant_message := v_messages.content;
      
      -- Extract patterns from successful Q&A pairs
      IF v_user_message IS NOT NULL AND v_assistant_message IS NOT NULL THEN
        -- Check if this is a common question pattern
        v_pattern := lower(trim(v_user_message));
        
        -- Store as query pattern if it's a clear question
        IF v_pattern LIKE 'how%' OR v_pattern LIKE 'what%' OR v_pattern LIKE 'why%' OR v_pattern LIKE 'can i%' THEN
          INSERT INTO chatbot_query_patterns (platform_id, pattern, category, success_count)
          VALUES (p_platform_id, v_pattern, 'feature_help', 1)
          ON CONFLICT DO NOTHING;
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update knowledge base from insights
CREATE OR REPLACE FUNCTION update_knowledge_from_insights(
  p_insight_id UUID,
  p_min_confidence NUMERIC DEFAULT 0.7
)
RETURNS BOOLEAN AS $$
DECLARE
  v_insight RECORD;
  v_knowledge_id UUID;
BEGIN
  -- Get insight
  SELECT * INTO v_insight
  FROM chatbot_learning_insights
  WHERE id = p_insight_id
  AND confidence_score >= p_min_confidence
  AND is_approved = false;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Create or update knowledge base entry
  INSERT INTO chatbot_knowledge (
    platform_id,
    content_type,
    title,
    content,
    metadata
  )
  VALUES (
    v_insight.platform_id,
    CASE 
      WHEN v_insight.insight_type = 'question' THEN 'faq'
      WHEN v_insight.insight_type = 'answer' THEN 'advice'
      ELSE 'tip'
    END,
    'Learned Insight: ' || substring(v_insight.content from 1 for 50),
    v_insight.content,
    jsonb_build_object(
      'source', 'auto_learned',
      'confidence', v_insight.confidence_score,
      'usage_count', v_insight.usage_count
    )
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_knowledge_id;
  
  -- Log the update
  IF v_knowledge_id IS NOT NULL THEN
    INSERT INTO chatbot_knowledge_updates (
      knowledge_id,
      update_type,
      new_content,
      source_insight_id,
      confidence_score
    )
    VALUES (
      v_knowledge_id,
      'auto_created',
      v_insight.content,
      p_insight_id,
      v_insight.confidence_score
    );
    
    -- Mark insight as processed
    UPDATE chatbot_learning_insights
    SET is_approved = true
    WHERE id = p_insight_id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE TRIGGER update_learning_insights_updated_at
  BEFORE UPDATE ON chatbot_learning_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_query_patterns_updated_at
  BEFORE UPDATE ON chatbot_query_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

