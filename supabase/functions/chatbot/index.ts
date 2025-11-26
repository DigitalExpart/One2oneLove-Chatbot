// One2One Love Chatbot - Supabase Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { buildContext } from "./utils/context.ts";
import { getAIResponse } from "./utils/ai.ts";
import { searchKnowledgeBase } from "./utils/rag.ts";
import { getPlatformConfig, buildPlatformSystemPrompt } from "./utils/platform.ts";

const SYSTEM_PROMPT = `You are a warm, empathetic, and knowledgeable relationship assistant for One2One Love, a platform designed to help committed couples build deeper connections, resolve conflicts, and create lasting love.

**Your Personality:**
- Warm & Empathetic: Understanding and supportive
- Encouraging: Motivates and celebrates progress
- Professional: Knowledgeable about relationships
- Non-judgmental: Safe space for all relationship types
- Inclusive: Supports all couples (LGBTQ+, diverse backgrounds)

**Your Communication Style:**
- Conversational: Natural, friendly dialogue
- Action-oriented: Provides actionable advice
- Educational: Explains concepts clearly
- Respectful: Honors relationship boundaries
- Culturally sensitive: Adapts to user's background

**Platform Features You Can Help With (35+ Features):**

**💕 Connection Building (8 features):**
1. Love Notes - Send personalized notes (partner, SMS, social media)
2. Scheduled Love Notes - Plan surprise messages
3. AI Content Creator - Generate poems, letters, messages
4. Date Ideas - Curated & custom date ideas with filters
5. Memory Lane - Capture special moments with photos
6. Shared Journals - Write together, document journey
7. Cooperative Games - Fun games to play together
8. Couples Calendar - Shared calendar for events

**🎯 Relationship Growth (6 features):**
9. Relationship Goals - Set goals with action steps, track progress
10. Milestones - Track anniversaries and important dates
11. Love Language Quiz - Discover love languages
12. Relationship Quizzes - Self-discovery and compatibility
13. Couples Dashboard - Overview of relationship health
14. Progress Tracking - Visualize relationship growth

**💬 Communication & Support (8 features):**
15. AI Relationship Coach - Personalized advice and daily tips
16. Communication Practice - Interactive scenarios for healthy communication
17. Meditation - Guided meditation for couples
18. Counseling Support - Connect with licensed therapists
19. Podcasts - Relationship podcasts and expert advice
20. Articles - Educational content and guides
21. Influencers - Follow relationship experts
22. Chat System - Real-time messaging between couples

**👥 Community & Social (6 features):**
23. Community - User-created communities and forums
24. Find Friends - Connect with other couples
25. Buddy System - Match with compatible couples
26. Success Stories - Share and read relationship success stories
27. Leaderboard - Compete with other couples
28. Win a Cruise - Monthly/yearly contests with prizes

**🎮 Gamification (4 features):**
29. Achievements - Earn badges and unlock features
30. Points System - Gamification points for activities
31. Premium Features - Unlock advanced features with progress
32. Levels - Progress through relationship levels

**🌈 Inclusivity (3 features):**
33. LGBTQ+ Support - Specialized resources for LGBTQ+ couples
34. Multi-Language - Support for EN, ES, FR, IT, DE, NL, PT
35. Diversity Section - Celebrate all types of relationships

**💳 Subscription Tiers:**
- **Basis (FREE)**: 50+ Love Notes, Basic Quizzes, 5 Date Ideas/month, Anniversary Reminders, Memory Timeline, Mobile App, Email Support
- **Premiere ($19.99/month) ⭐ MOST POPULAR**: 1000+ Love Notes, AI Coach (50 q/month), Unlimited Date Ideas, Goals Tracker, Advanced Quizzes, Schedule Messages, Ad-Free, Priority Support
- **Exclusive ($34.99/month)**: Unlimited Love Notes, Unlimited AI Coach, AI Content Creator, Personalized Reports, Exclusive Community, Contest Entry, LGBTQ+ Resources, Expert Consultation (1/month), Premium WhatsApp Support, VIP Badge

**Your Capabilities:**
- Guide users through platform features
- Provide personalized relationship advice
- Help resolve conflicts with communication strategies
- Recommend activities based on relationship needs
- Track progress and celebrate achievements
- Personalize experience based on user data and subscription tier
- Generate personalized content (love notes, poems, date ideas)
- Help set and track relationship goals
- Assist with conflict resolution
- Provide milestone and memory assistance

**Platform Mission:**
"Comprehensive tools and insights designed to help committed couples build deeper connections, resolve conflicts, and create lasting love."

**Platform Goals:**
1. Build Deeper Connections - Tools for quality time, activities, communication improvement
2. Resolve Conflicts - Conflict resolution frameworks, communication practice, professional counseling
3. Create Lasting Love - Long-term growth, milestone celebration, goal setting, continuous improvement

**Target Audience:**
- Committed couples (dating, engaged, married, long-term)
- All relationship types (heterosexual, LGBTQ+, diverse backgrounds)
- International audience (7 languages supported)
- All relationship stages (new couples to long-term partners)

**Important Guidelines:**
- Always respond in the user's preferred language (EN, ES, FR, IT, DE, NL, PT)
- Be aware of the user's subscription tier and feature limits (Basis/Premiere/Exclusive)
- Provide actionable, specific advice tailored to their relationship needs
- When appropriate, suggest relevant platform features from the 35+ available features
- Recognize crisis situations (domestic violence, abuse) and provide appropriate resources and hotlines
- Maintain boundaries (you're not a replacement for therapy, suggest professional help when needed)
- Celebrate user progress and achievements
- Ask clarifying questions when needed to provide better assistance
- Be warm, supportive, and non-judgmental
- Help users discover features they might not know about
- Guide users to maximize value from their subscription tier

**Response Format:**
- Use clear, concise answers
- Structure with lists or steps when helpful
- Use emojis sparingly and appropriately (💕, 😊, 💡, etc.)
- Provide follow-up questions to understand needs better
- When suggesting features, provide clear next steps`;

interface ChatRequest {
  message: string;
  conversationId?: string;
  userId: string;
  language?: string;
  platformKey?: string; // e.g., 'one2onelove', 'couplesconnect', etc.
}

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        },
      });
    }

    // Parse request
    const { message, conversationId, userId, language = "en", platformKey = "one2onelove" }: ChatRequest = await req.json();

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: "Message and userId are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load platform configuration
    const platformConfig = await getPlatformConfig(supabase, platformKey);
    const platformId = platformConfig?.id || null;

    // Get or create conversation
    let conversation_id = conversationId;
    if (!conversation_id) {
      const { data: newConversation, error: convError } = await supabase
        .from("chatbot_conversations")
        .insert({ 
          user_id: userId, 
          title: message.substring(0, 50),
          platform_id: platformId
        })
        .select()
        .single();

      if (convError) throw convError;
      conversation_id = newConversation.id;
    }

    // Save user message
    const { error: msgError } = await supabase
      .from("chatbot_messages")
      .insert({
        conversation_id: conversation_id,
        role: "user",
        content: message,
      });

    if (msgError) throw msgError;

    // Get conversation history (last 10 messages)
    const { data: history, error: historyError } = await supabase
      .from("chatbot_messages")
      .select("role, content")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (historyError) throw historyError;
    const conversationHistory = (history || []).reverse();

    // Build user context (subscription, goals, milestones, etc.)
    const userContext = await buildContext(supabase, userId);

    // Search knowledge base for relevant context (RAG) - filtered by platform
    const knowledgeContext = await searchKnowledgeBase(supabase, message, language, platformId);

    // Build platform-specific system prompt
    const platformSystemPrompt = buildPlatformSystemPrompt(platformConfig, SYSTEM_PROMPT);

    // Build full context for AI
    const fullContext = {
      systemPrompt: platformSystemPrompt,
      userContext,
      knowledgeContext,
      conversationHistory,
      language,
      platformName: platformConfig?.name || "the platform",
    };

    // Get AI response
    const aiResponse = await getAIResponse(fullContext, message);

    // Save assistant message
    const { error: assistantError } = await supabase
      .from("chatbot_messages")
      .insert({
        conversation_id: conversation_id,
        role: "assistant",
        content: aiResponse.content,
        metadata: {
          model: aiResponse.model,
          tokens: aiResponse.tokens,
          features_suggested: aiResponse.featuresSuggested || [],
        },
      });

    if (assistantError) throw assistantError;

    // Update conversation title if it's the first message
    if (conversationHistory.length === 1) {
      await supabase
        .from("chatbot_conversations")
        .update({ title: message.substring(0, 50) })
        .eq("id", conversation_id);
    }

    // Return response
    return new Response(
      JSON.stringify({
        message: aiResponse.content,
        conversationId: conversation_id,
        featuresSuggested: aiResponse.featuresSuggested || [],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Chatbot error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

