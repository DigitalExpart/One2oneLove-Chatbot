// AI Service Integration for Chatbot
// Supports both OpenAI and Anthropic

interface AIResponse {
  content: string;
  model: string;
  tokens?: number;
  featuresSuggested?: string[];
}

interface AIContext {
  systemPrompt: string;
  userContext: any;
  knowledgeContext: string;
  conversationHistory: Array<{ role: string; content: string }>;
  language: string;
}

export async function getAIResponse(
  context: AIContext,
  userMessage: string
): Promise<AIResponse> {
  const aiProvider = Deno.env.get("AI_PROVIDER") || "openai";
  const model = Deno.env.get("AI_MODEL") || "gpt-4-turbo-preview";
  const temperature = parseFloat(Deno.env.get("CHATBOT_TEMPERATURE") || "0.7");
  const maxTokens = parseInt(Deno.env.get("CHATBOT_MAX_TOKENS") || "1000");

  if (aiProvider === "anthropic") {
    return await getAnthropicResponse(context, userMessage, model, temperature, maxTokens);
  } else {
    return await getOpenAIResponse(context, userMessage, model, temperature, maxTokens);
  }
}

async function getOpenAIResponse(
  context: AIContext,
  userMessage: string,
  model: string,
  temperature: number,
  maxTokens: number
): Promise<AIResponse> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  // Build messages array
  const messages: Array<{ role: string; content: string }> = [
    {
      role: "system",
      content: buildSystemMessage(context),
    },
  ];

  // Add conversation history
  context.conversationHistory.forEach((msg) => {
    messages.push({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    });
  });

  // Add current user message
  messages.push({
    role: "user",
    content: userMessage,
  });

  // Call OpenAI API
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";

  // Extract suggested features from response (simple keyword matching)
  const featuresSuggested = extractFeatures(content);

  return {
    content,
    model: data.model || model,
    tokens: data.usage?.total_tokens,
    featuresSuggested,
  };
}

async function getAnthropicResponse(
  context: AIContext,
  userMessage: string,
  model: string,
  temperature: number,
  maxTokens: number
): Promise<AIResponse> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  // Build messages array (Anthropic format)
  const messages: Array<{ role: string; content: string }> = [];

  // Add conversation history
  context.conversationHistory.forEach((msg) => {
    messages.push({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    });
  });

  // Add current user message
  messages.push({
    role: "user",
    content: userMessage,
  });

  // Call Anthropic API
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      messages,
      system: buildSystemMessage(context),
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text || "I apologize, but I couldn't generate a response.";

  // Extract suggested features from response
  const featuresSuggested = extractFeatures(content);

  return {
    content,
    model: data.model || model,
    tokens: data.usage?.input_tokens + data.usage?.output_tokens,
    featuresSuggested,
  };
}

function buildSystemMessage(context: AIContext): string {
  let systemMessage = context.systemPrompt;

  // Add user context
  if (context.userContext) {
    systemMessage += `\n\n**User Context:**\n`;
    if (context.userContext.subscriptionTier) {
      systemMessage += `- Subscription Tier: ${context.userContext.subscriptionTier}\n`;
    }
    if (context.userContext.partnerName) {
      systemMessage += `- Partner Name: ${context.userContext.partnerName}\n`;
    }
    if (context.userContext.relationshipGoals?.length > 0) {
      systemMessage += `- Active Goals: ${context.userContext.relationshipGoals.map((g: any) => g.title).join(", ")}\n`;
    }
    if (context.userContext.upcomingMilestones?.length > 0) {
      systemMessage += `- Upcoming Milestones: ${context.userContext.upcomingMilestones.map((m: any) => m.title).join(", ")}\n`;
    }
  }

  // Add knowledge base context
  if (context.knowledgeContext) {
    systemMessage += `\n\n**Relevant Platform Information:**\n${context.knowledgeContext}\n`;
  }

  // Add language instruction
  systemMessage += `\n\n**Important:** Respond in ${context.language.toUpperCase()} language.`;

  return systemMessage;
}

function extractFeatures(content: string): string[] {
  const featureKeywords: Record<string, string> = {
    // Connection Building
    "love note": "Love Notes",
    "scheduled note": "Scheduled Love Notes",
    "ai content creator": "AI Content Creator",
    "content creator": "AI Content Creator",
    "poem": "AI Content Creator",
    "date idea": "Date Ideas",
    "date": "Date Ideas",
    "memory lane": "Memory Lane",
    "memory": "Memory Lane",
    "shared journal": "Shared Journals",
    "journal": "Shared Journals",
    "cooperative game": "Cooperative Games",
    "game": "Cooperative Games",
    "couples calendar": "Couples Calendar",
    "calendar": "Couples Calendar",
    // Relationship Growth
    "relationship goal": "Relationship Goals",
    "goal": "Relationship Goals",
    "milestone": "Milestones",
    "anniversary": "Milestones",
    "love language": "Love Language Quiz",
    "love language quiz": "Love Language Quiz",
    "relationship quiz": "Relationship Quizzes",
    "quiz": "Relationship Quizzes",
    "compatibility": "Relationship Quizzes",
    "couples dashboard": "Couples Dashboard",
    "dashboard": "Couples Dashboard",
    "progress tracking": "Progress Tracking",
    "progress": "Progress Tracking",
    // Communication & Support
    "ai relationship coach": "AI Relationship Coach",
    "ai coach": "AI Relationship Coach",
    "relationship coach": "AI Relationship Coach",
    "coach": "AI Relationship Coach",
    "communication practice": "Communication Practice",
    "communication": "Communication Practice",
    "meditation": "Meditation",
    "mindfulness": "Meditation",
    "counseling": "Counseling Support",
    "therapy": "Counseling Support",
    "therapist": "Counseling Support",
    "podcast": "Podcasts",
    "article": "Articles",
    "influencer": "Influencers",
    "expert": "Influencers",
    "chat": "Chat System",
    "messaging": "Chat System",
    // Community & Social
    "community": "Community",
    "forum": "Community",
    "find friends": "Find Friends",
    "friends": "Find Friends",
    "buddy system": "Buddy System",
    "buddy": "Buddy System",
    "success story": "Success Stories",
    "story": "Success Stories",
    "leaderboard": "Leaderboard",
    "ranking": "Leaderboard",
    "contest": "Win a Cruise",
    "cruise": "Win a Cruise",
    "prize": "Win a Cruise",
    // Gamification
    "achievement": "Achievements",
    "badge": "Achievements",
    "points": "Points System",
    "points system": "Points System",
    "premium feature": "Premium Features",
    "unlock": "Premium Features",
    "level": "Levels",
    // Inclusivity
    "lgbtq": "LGBTQ+ Support",
    "lgbt": "LGBTQ+ Support",
    "diversity": "Diversity Section",
    "inclusive": "Diversity Section",
  };

  const suggested: string[] = [];
  const lowerContent = content.toLowerCase();

  for (const [keyword, feature] of Object.entries(featureKeywords)) {
    if (lowerContent.includes(keyword)) {
      suggested.push(feature);
    }
  }

  return [...new Set(suggested)]; // Remove duplicates
}

