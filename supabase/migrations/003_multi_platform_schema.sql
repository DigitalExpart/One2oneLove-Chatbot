-- Multi-Platform Support for Chatbot
-- Allows the chatbot to serve multiple websites/platforms

-- Platforms Table - Stores platform-specific configurations
CREATE TABLE IF NOT EXISTS chatbot_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_key TEXT UNIQUE NOT NULL, -- e.g., 'one2onelove', 'couplesconnect', etc.
  name TEXT NOT NULL, -- Display name: "One2One Love", "Couples Connect", etc.
  domain TEXT, -- Primary domain for this platform
  branding JSONB DEFAULT '{}'::jsonb, -- Colors, logo, theme
  features JSONB DEFAULT '[]'::jsonb, -- List of available features for this platform
  subscription_tiers JSONB DEFAULT '{}'::jsonb, -- Subscription tier configurations
  system_prompt TEXT, -- Custom system prompt for this platform
  mission_statement TEXT, -- Platform mission statement
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add platform_id to conversations
ALTER TABLE chatbot_conversations 
ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES chatbot_platforms(id) ON DELETE SET NULL;

-- Add platform_id to knowledge base
ALTER TABLE chatbot_knowledge 
ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES chatbot_platforms(id) ON DELETE CASCADE;

-- Update indexes for platform support
CREATE INDEX IF NOT EXISTS idx_conversations_platform_id ON chatbot_conversations(platform_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_platform ON chatbot_conversations(user_id, platform_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_platform_id ON chatbot_knowledge(platform_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_platform_content_type ON chatbot_knowledge(platform_id, content_type);

-- Update RLS policies for platforms
-- Platform admins can manage their platform
CREATE POLICY "Platform admins can manage platforms"
  ON chatbot_platforms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'platform_admin' = 'true'
    )
  );

-- Users can view active platforms
CREATE POLICY "Users can view active platforms"
  ON chatbot_platforms FOR SELECT
  USING (is_active = true);

-- Knowledge base filtered by platform
DROP POLICY IF EXISTS "Authenticated users can view knowledge base" ON chatbot_knowledge;
CREATE POLICY "Users can view knowledge base for their platform"
  ON chatbot_knowledge FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    (platform_id IS NULL OR platform_id IN (
      SELECT id FROM chatbot_platforms WHERE is_active = true
    ))
  );

-- Update conversation policies to include platform
DROP POLICY IF EXISTS "Users can view own conversations" ON chatbot_conversations;
CREATE POLICY "Users can view own conversations"
  ON chatbot_conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Function to get platform configuration
CREATE OR REPLACE FUNCTION get_platform_config(p_platform_key TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  branding JSONB,
  features JSONB,
  subscription_tiers JSONB,
  system_prompt TEXT,
  mission_statement TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.name,
    cp.branding,
    cp.features,
    cp.subscription_tiers,
    cp.system_prompt,
    cp.mission_statement
  FROM chatbot_platforms cp
  WHERE cp.platform_key = p_platform_key
  AND cp.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default platform (One2One Love)
INSERT INTO chatbot_platforms (platform_key, name, domain, branding, mission_statement, system_prompt)
VALUES (
  'one2onelove',
  'One2One Love',
  'one2onelove.com',
  '{"primary_color": "#ec4899", "secondary_color": "#8b5cf6", "gradient": "from-pink-500 to-purple-600"}'::jsonb,
  'Comprehensive tools and insights designed to help committed couples build deeper connections, resolve conflicts, and create lasting love.',
  NULL -- Will use default system prompt
) ON CONFLICT (platform_key) DO NOTHING;

-- Trigger for updated_at on platforms
CREATE TRIGGER update_platforms_updated_at
  BEFORE UPDATE ON chatbot_platforms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

