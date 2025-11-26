// Platform Configuration Utilities
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

export interface PlatformConfig {
  id: string;
  name: string;
  branding: any;
  features: string[];
  subscription_tiers: any;
  system_prompt?: string;
  mission_statement?: string;
}

const DEFAULT_SYSTEM_PROMPT = `You are a warm, empathetic, and knowledgeable relationship assistant for a platform designed to help committed couples build deeper connections, resolve conflicts, and create lasting love.

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

**Important Guidelines:**
- Always respond in the user's preferred language (EN, ES, FR, IT, DE, NL, PT)
- Be aware of the user's subscription tier and feature limits
- Provide actionable, specific advice tailored to their relationship needs
- When appropriate, suggest relevant platform features
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

export async function getPlatformConfig(
  supabase: SupabaseClient,
  platformKey: string
): Promise<PlatformConfig | null> {
  try {
    const { data, error } = await supabase
      .from("chatbot_platforms")
      .select("*")
      .eq("platform_key", platformKey)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      console.warn(`Platform ${platformKey} not found, using default`);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      branding: data.branding || {},
      features: data.features || [],
      subscription_tiers: data.subscription_tiers || {},
      system_prompt: data.system_prompt,
      mission_statement: data.mission_statement,
    };
  } catch (error) {
    console.error("Error loading platform config:", error);
    return null;
  }
}

export function buildPlatformSystemPrompt(
  platformConfig: PlatformConfig | null,
  defaultPrompt: string = DEFAULT_SYSTEM_PROMPT
): string {
  if (!platformConfig) {
    return defaultPrompt;
  }

  // Use custom system prompt if provided
  if (platformConfig.system_prompt) {
    return platformConfig.system_prompt;
  }

  // Build system prompt from platform config
  let systemPrompt = defaultPrompt;

  // Replace platform name
  systemPrompt = systemPrompt.replace(
    "a platform designed to help",
    `${platformConfig.name}, a platform designed to help`
  );

  // Add mission statement if available
  if (platformConfig.mission_statement) {
    systemPrompt += `\n\n**Platform Mission:**\n"${platformConfig.mission_statement}"`;
  }

  // Add platform-specific features if available
  if (platformConfig.features && platformConfig.features.length > 0) {
    systemPrompt += `\n\n**Platform Features:**\n`;
    platformConfig.features.forEach((feature, index) => {
      systemPrompt += `${index + 1}. ${feature}\n`;
    });
  }

  // Add subscription tiers if available
  if (platformConfig.subscription_tiers && Object.keys(platformConfig.subscription_tiers).length > 0) {
    systemPrompt += `\n\n**Subscription Tiers:**\n`;
    for (const [tierName, tierInfo] of Object.entries(platformConfig.subscription_tiers)) {
      systemPrompt += `- **${tierName}**: ${JSON.stringify(tierInfo)}\n`;
    }
  }

  return systemPrompt;
}

