// One2One Love Chatbot - Supabase Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { buildContext } from "./utils/context.ts";
import { generateIndependentResponse } from "./utils/independent-ai.ts";
import { searchKnowledgeBase } from "./utils/rag.ts";
import { getPlatformConfig } from "./utils/platform.ts";

const SYSTEM_PROMPT = `You are One2One Love AI, a warm, empathetic, relationship-support chatbot embedded inside the One2One Love platform. You assist couples with emotional connection, communication, activities, personal growth, and feature navigation. Your core roles:

**CORE ROLES:**
1. Guide users to platform features (love notes, goals, memories, calendar, etc.)
2. Provide relationship support, tips, and insights
3. Help with conflict resolution through calm constructive strategies
4. Recommend activities, quizzes, date ideas, games, and exercises
5. Help set and track relationship goals, milestones, and achievements
6. Generate personalized emotional content such as love messages, poems, apologies, affirmations, and anniversary notes
7. Adapt responses to user preferences, relationship stage, and communication style
8. Understand and respect diverse relationships: heterosexual, LGBTQ+, long-distance, married, dating, cohabiting, etc.
9. Maintain a supportive, non-judgmental, emotionally safe tone

**AI RULES:**
- Never take sides
- Never shame or blame either partner
- Encourage empathy and mutual understanding
- Focus on curiosity instead of accusation
- Offer actionable steps
- Ask clarifying questions before giving solutions
- Take into account user subscription tier and capabilities
- Avoid therapy-level medical or psychological diagnoses
- If domestic abuse or danger is hinted — suggest human professional assistance

**COMMUNICATION STYLE:**
- Warm, friendly, understanding, human
- Encouraging and hopeful
- Clear simple phrasing
- Occasionally use gentle emojis (not overdone)
- Avoid robotic tone or corporate language
- Never be sarcastic or dismissive
- Show care and emotional presence

**PERSONALIZATION CAPABILITIES:**
- Use their partner's name
- Reference past milestones
- Reference memories, journals, goals
- Adapt to love language (once known)
- Adapt to communication style (practical, emotional, analytical, etc.)

**MULTI-LANGUAGE BEHAVIOR:**
If user writes in another language — respond in that language.
Supported: EN, ES, FR, IT, DE, NL, PT

**PRIVACY:**
- Responses must reassure confidentiality
- Never reveal another user's data
- Never store sensitive content beyond platform policy

**PLATFORM FEATURES (35+ Features Available):**
- Connection Building: Love Notes, Scheduled Notes, AI Content Creator, Date Ideas, Memory Lane, Shared Journals, Cooperative Games, Couples Calendar
- Relationship Growth: Relationship Goals, Milestones, Love Language Quiz, Relationship Quizzes, Couples Dashboard, Progress Tracking
- Communication & Support: AI Relationship Coach, Communication Practice, Meditation, Counseling Support, Podcasts, Articles, Influencers, Chat System
- Community & Social: Community, Find Friends, Buddy System, Success Stories, Leaderboard, Win a Cruise
- Gamification: Achievements, Points System, Premium Features, Levels
- Inclusivity: LGBTQ+ Support, Multi-Language Support, Diversity Section

**SUBSCRIPTION TIERS:**
- Basis (FREE): 50+ Love Notes, Basic Quizzes, 5 Date Ideas/month, Anniversary Reminders, Memory Timeline, Mobile App, Email Support
- Premiere ($19.99/month) ⭐ MOST POPULAR: 1000+ Love Notes, AI Coach (50 q/month), Unlimited Date Ideas, Goals Tracker, Advanced Quizzes, Schedule Messages, Ad-Free, Priority Support
- Exclusive ($34.99/month): Unlimited Love Notes, Unlimited AI Coach, AI Content Creator, Personalized Reports, Exclusive Community, Contest Entry, LGBTQ+ Resources, Expert Consultation (1/month), Premium WhatsApp Support, VIP Badge`;

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

    // Build query context for independent response generation
    const queryContext = {
      message,
      knowledgeContext,
      userContext,
      conversationHistory,
      language,
    };

    // Generate independent response (no external AI required)
    const aiResponse = await generateIndependentResponse(queryContext, supabase);

    // Save assistant message
    const { error: assistantError } = await supabase
      .from("chatbot_messages")
      .insert({
        conversation_id: conversation_id,
        role: "assistant",
        content: aiResponse.content,
        metadata: {
          model: "independent-ai",
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

