// RAG Self-Learning System
// Analyzes conversations and updates knowledge base automatically
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

interface ConversationAnalysis {
  queryPattern?: string;
  category?: string;
  usefulContent?: string;
  userSatisfaction?: number;
}

interface LearningInsight {
  insightType: string;
  content: string;
  context: any;
  confidenceScore: number;
}

/**
 * Analyze a conversation to extract learning insights
 */
export async function analyzeConversation(
  supabase: SupabaseClient,
  conversationId: string,
  platformId: string | null
): Promise<ConversationAnalysis | null> {
  try {
    // Get all messages from conversation
    const { data: messages, error } = await supabase
      .from("chatbot_messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error || !messages || messages.length === 0) {
      return null;
    }

    // Find user questions and assistant responses
    const analysis: ConversationAnalysis = {};
    let lastUserMessage = "";
    let lastAssistantMessage = "";

    for (const msg of messages) {
      if (msg.role === "user") {
        lastUserMessage = msg.content;
      } else if (msg.role === "assistant" && lastUserMessage) {
        lastAssistantMessage = msg.content;
        
        // Extract query pattern
        const pattern = extractQueryPattern(lastUserMessage);
        if (pattern) {
          analysis.queryPattern = pattern;
          analysis.category = classifyQueryCategory(lastUserMessage);
        }
        
        // Extract useful content from assistant response
        if (lastAssistantMessage.length > 50) {
          analysis.usefulContent = extractUsefulContent(lastAssistantMessage);
        }
      }
    }

    return analysis;
  } catch (error) {
    console.error("Error analyzing conversation:", error);
    return null;
  }
}

/**
 * Extract query pattern from user message
 */
function extractQueryPattern(message: string): string | null {
  const lower = message.toLowerCase().trim();
  
  // Remove common filler words
  const cleaned = lower
    .replace(/^(hi|hello|hey|please|can you|could you|i want to|i need to|help me)\s+/i, "")
    .replace(/\s+(please|thanks|thank you|\.)$/i, "")
    .trim();
  
  if (cleaned.length < 10 || cleaned.length > 200) {
    return null;
  }
  
  return cleaned;
}

/**
 * Classify query category
 */
function classifyQueryCategory(message: string): string {
  const lower = message.toLowerCase();
  
  if (lower.includes("how") || lower.includes("help") || lower.includes("guide")) {
    return "feature_help";
  }
  if (lower.includes("advice") || lower.includes("problem") || lower.includes("issue")) {
    return "relationship_advice";
  }
  if (lower.includes("date") || lower.includes("activity") || lower.includes("idea")) {
    return "date_ideas";
  }
  if (lower.includes("subscription") || lower.includes("plan") || lower.includes("tier")) {
    return "subscription_info";
  }
  if (lower.includes("poem") || lower.includes("note") || lower.includes("message")) {
    return "content_generation";
  }
  
  return "general";
}

/**
 * Extract useful content from assistant response
 */
function extractUsefulContent(response: string): string | null {
  // Extract key information (lists, steps, specific advice)
  const lines = response.split("\n").filter(line => {
    const trimmed = line.trim();
    return (
      trimmed.length > 20 &&
      (trimmed.startsWith("•") || 
       trimmed.startsWith("-") || 
       trimmed.match(/^\d+\./) ||
       trimmed.startsWith("**"))
    );
  });
  
  if (lines.length > 0) {
    return lines.slice(0, 5).join("\n");
  }
  
  // Fallback: extract first meaningful paragraph
  const paragraphs = response.split("\n\n").filter(p => p.trim().length > 50);
  return paragraphs[0] || null;
}

/**
 * Store learning insight
 */
export async function storeLearningInsight(
  supabase: SupabaseClient,
  insight: LearningInsight,
  platformId: string | null
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("chatbot_learning_insights")
      .insert({
        platform_id: platformId,
        insight_type: insight.insightType,
        content: insight.content,
        context: insight.context,
        confidence_score: insight.confidenceScore,
      });

    return !error;
  } catch (error) {
    console.error("Error storing learning insight:", error);
    return false;
  }
}

/**
 * Store query pattern for better matching
 */
export async function storeQueryPattern(
  supabase: SupabaseClient,
  pattern: string,
  category: string,
  platformId: string | null,
  language: string = "en"
): Promise<boolean> {
  try {
    // Check if pattern already exists
    const { data: existing } = await supabase
      .from("chatbot_query_patterns")
      .select("id, success_count, total_uses")
      .eq("platform_id", platformId || null)
      .eq("pattern", pattern)
      .single();

    if (existing) {
      // Update existing pattern
      const { error } = await supabase
        .from("chatbot_query_patterns")
        .update({
          success_count: existing.success_count + 1,
          total_uses: existing.total_uses + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      return !error;
    } else {
      // Create new pattern
      const { error } = await supabase
        .from("chatbot_query_patterns")
        .insert({
          platform_id: platformId,
          pattern,
          category,
          language,
          success_count: 1,
          total_uses: 1,
        });

      return !error;
    }
  } catch (error) {
    console.error("Error storing query pattern:", error);
    return false;
  }
}

/**
 * Get best matching query pattern
 */
export async function getBestQueryPattern(
  supabase: SupabaseClient,
  query: string,
  platformId: string | null,
  language: string = "en"
): Promise<string | null> {
  try {
    const queryLower = query.toLowerCase().trim();
    
    // Search for similar patterns
    const { data: patterns, error } = await supabase
      .from("chatbot_query_patterns")
      .select("pattern, category, success_count, total_uses")
      .eq("platform_id", platformId || null)
      .eq("language", language)
      .order("success_count", { ascending: false })
      .limit(10);

    if (error || !patterns || patterns.length === 0) {
      return null;
    }

    // Find best match using simple similarity
    let bestMatch: { pattern: string; score: number } | null = null;

    for (const pattern of patterns) {
      const similarity = calculateSimilarity(queryLower, pattern.pattern);
      const successRate = pattern.total_uses > 0 
        ? pattern.success_count / pattern.total_uses 
        : 0;
      
      const score = similarity * 0.7 + successRate * 0.3;
      
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { pattern: pattern.category, score };
      }
    }

    return bestMatch && bestMatch.score > 0.5 ? bestMatch.pattern : null;
  } catch (error) {
    console.error("Error getting query pattern:", error);
    return null;
  }
}

/**
 * Calculate simple string similarity (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Process feedback and update learning
 */
export async function processFeedback(
  supabase: SupabaseClient,
  messageId: string,
  conversationId: string,
  feedbackType: string,
  rating: number,
  comment?: string
): Promise<boolean> {
  try {
    // Store feedback
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error: feedbackError } = await supabase
      .from("chatbot_feedback")
      .insert({
        message_id: messageId,
        conversation_id: conversationId,
        feedback_type: feedbackType,
        rating,
        comment,
        user_id: user.id,
      });

    if (feedbackError) {
      console.error("Error storing feedback:", feedbackError);
      return false;
    }

    // If feedback is positive, learn from it
    if (rating >= 4 && feedbackType === "helpful") {
      // Get the conversation and analyze it
      const { data: conversation } = await supabase
        .from("chatbot_conversations")
        .select("platform_id")
        .eq("id", conversationId)
        .single();

      if (conversation) {
        const analysis = await analyzeConversation(
          supabase,
          conversationId,
          conversation.platform_id
        );

        if (analysis?.queryPattern) {
          await storeQueryPattern(
            supabase,
            analysis.queryPattern,
            analysis.category || "general",
            conversation.platform_id,
            "en"
          );
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Error processing feedback:", error);
    return false;
  }
}

/**
 * Auto-update knowledge base from high-confidence insights
 */
export async function autoUpdateKnowledgeBase(
  supabase: SupabaseClient,
  platformId: string | null,
  minConfidence: number = 0.7
): Promise<number> {
  try {
    // Get high-confidence, unprocessed insights
    const { data: insights, error } = await supabase
      .from("chatbot_learning_insights")
      .select("id, insight_type, content, confidence_score, usage_count")
      .eq("platform_id", platformId || null)
      .eq("is_approved", false)
      .gte("confidence_score", minConfidence)
      .order("confidence_score", { ascending: false })
      .limit(10);

    if (error || !insights || insights.length === 0) {
      return 0;
    }

    let updated = 0;

    for (const insight of insights) {
      // Create knowledge base entry
      const { data: knowledge, error: kbError } = await supabase
        .from("chatbot_knowledge")
        .insert({
          platform_id: platformId,
          content_type: insight.insight_type === "question" ? "faq" : "advice",
          title: `Learned: ${insight.content.substring(0, 50)}`,
          content: insight.content,
          metadata: {
            source: "auto_learned",
            confidence: insight.confidence_score,
            usage_count: insight.usage_count,
          },
        })
        .select()
        .single();

      if (!kbError && knowledge) {
        // Log the update
        await supabase
          .from("chatbot_knowledge_updates")
          .insert({
            knowledge_id: knowledge.id,
            update_type: "auto_created",
            new_content: insight.content,
            source_insight_id: insight.id,
            confidence_score: insight.confidence_score,
          });

        // Mark insight as approved
        await supabase
          .from("chatbot_learning_insights")
          .update({ is_approved: true })
          .eq("id", insight.id);

        updated++;
      }
    }

    return updated;
  } catch (error) {
    console.error("Error auto-updating knowledge base:", error);
    return 0;
  }
}

