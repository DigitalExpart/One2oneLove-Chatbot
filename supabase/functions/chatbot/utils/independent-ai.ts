// Independent AI Response Generator
// Generates responses without external AI services
// Uses knowledge base, templates, and pattern matching

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

interface IndependentResponse {
  content: string;
  featuresSuggested?: string[];
}

interface QueryContext {
  message: string;
  knowledgeContext: string;
  userContext: any;
  conversationHistory: Array<{ role: string; content: string }>;
  language: string;
}

// Response templates for common queries
const RESPONSE_TEMPLATES: Record<string, (context: QueryContext) => string> = {
  greeting: (ctx) => {
    const greetings: Record<string, string> = {
      en: `Hello! 💕 I'm One2One Love AI, your relationship assistant. I'm here to help you and ${ctx.userContext?.partnerName || 'your partner'} build deeper connections, resolve conflicts, and create lasting love. 

What would you like help with today? I can:
• Guide you through platform features
• Provide relationship advice
• Suggest activities and date ideas
• Help with communication
• Assist with goal setting

How can I support your relationship journey?`,
      es: `¡Hola! 💕 Soy One2One Love AI, tu asistente de relaciones. Estoy aquí para ayudarte a ti y a ${ctx.userContext?.partnerName || 'tu pareja'} a construir conexiones más profundas, resolver conflictos y crear amor duradero.

¿En qué puedo ayudarte hoy?`,
      fr: `Bonjour ! 💕 Je suis One2One Love AI, votre assistant relationnel. Je suis là pour vous aider, vous et ${ctx.userContext?.partnerName || 'votre partenaire'}, à construire des connexions plus profondes, résoudre les conflits et créer un amour durable.`,
      it: `Ciao! 💕 Sono One2One Love AI, il tuo assistente per le relazioni. Sono qui per aiutare te e ${ctx.userContext?.partnerName || 'il tuo partner'} a costruire connessioni più profonde, risolvere conflitti e creare amore duraturo.`,
      de: `Hallo! 💕 Ich bin One2One Love AI, dein Beziehungsassistent. Ich bin hier, um dir und ${ctx.userContext?.partnerName || 'deinem Partner'} zu helfen, tiefere Verbindungen aufzubauen, Konflikte zu lösen und dauerhafte Liebe zu schaffen.`,
      nl: `Hallo! 💕 Ik ben One2One Love AI, je relatie-assistent. Ik ben hier om jou en ${ctx.userContext?.partnerName || 'je partner'} te helpen diepere verbindingen op te bouwen, conflicten op te lossen en blijvende liefde te creëren.`,
      pt: `Olá! 💕 Sou o One2One Love AI, seu assistente de relacionamento. Estou aqui para ajudá-lo e ${ctx.userContext?.partnerName || 'seu parceiro'} a construir conexões mais profundas, resolver conflitos e criar amor duradouro.`,
    };
    return greetings[ctx.language] || greetings.en;
  },

  feature_help: (ctx) => {
    const lowerMessage = ctx.message.toLowerCase();
    const lang = ctx.language;
    
    // Extract feature name from query
    let featureName = '';
    if (lowerMessage.includes('love note')) featureName = 'Love Notes';
    else if (lowerMessage.includes('date idea')) featureName = 'Date Ideas';
    else if (lowerMessage.includes('goal')) featureName = 'Relationship Goals';
    else if (lowerMessage.includes('milestone')) featureName = 'Milestones';
    else if (lowerMessage.includes('memory')) featureName = 'Memory Lane';
    else if (lowerMessage.includes('journal')) featureName = 'Shared Journals';
    else if (lowerMessage.includes('calendar')) featureName = 'Couples Calendar';
    else if (lowerMessage.includes('quiz')) featureName = 'Relationship Quizzes';
    else if (lowerMessage.includes('coach')) featureName = 'AI Relationship Coach';
    else if (lowerMessage.includes('meditation')) featureName = 'Meditation';
    else if (lowerMessage.includes('community')) featureName = 'Community';
    
    // Use knowledge base context if available
    if (ctx.knowledgeContext) {
      return `${ctx.knowledgeContext}\n\nWould you like me to guide you through using ${featureName || 'this feature'}?`;
    }
    
    return `I'd be happy to help you with ${featureName || 'platform features'}! Based on your subscription tier (${ctx.userContext?.subscriptionTier || 'Basis'}), you have access to various features. What specifically would you like to know?`;
  },

  relationship_advice: (ctx) => {
    const lowerMessage = ctx.message.toLowerCase();
    let advice = '';
    
    if (lowerMessage.includes('communication') || lowerMessage.includes('argue') || lowerMessage.includes('fight')) {
      advice = `I understand communication challenges can be tough. Here are some constructive approaches:

**Immediate Steps:**
1. Take a pause when emotions are high - agree to step away and return when calmer
2. Use "I" statements instead of "you" statements - "I feel..." rather than "You always..."
3. Practice active listening - repeat back what you heard to ensure understanding

**Platform Tools That Can Help:**
• Communication Practice - Interactive scenarios to practice healthy communication
• AI Relationship Coach - Get personalized strategies for your situation
• Articles on conflict resolution - Expert guidance

Would you like me to guide you through a communication exercise, or help you find relevant resources?`;
    } else if (lowerMessage.includes('intimacy') || lowerMessage.includes('connection') || lowerMessage.includes('spark')) {
      advice = `Building intimacy and connection takes intentional effort. Here are some ideas:

**Connection Building Activities:**
• Plan regular date nights using Date Ideas feature
• Send surprise Love Notes to express feelings
• Try new activities together using Cooperative Games
• Use Relationship Quizzes to discover new things about each other
• Practice Meditation together for deeper connection

**Platform Features:**
• Memory Lane - Capture and cherish special moments
• Shared Journals - Write together and document your journey
• Relationship Goals - Set goals to improve intimacy together

What area of connection would you like to focus on?`;
    } else if (lowerMessage.includes('goal') || lowerMessage.includes('improve')) {
      advice = `Setting relationship goals is a great way to grow together! Here's how:

**Creating Relationship Goals:**
1. Identify an area you both want to improve (communication, intimacy, activities, etc.)
2. Set a specific, achievable goal
3. Break it down into actionable steps
4. Track progress together
5. Celebrate achievements along the way

**Platform Support:**
• Relationship Goals feature - Set and track goals with action steps
• Progress Tracking - Visualize your relationship growth
• Milestones - Celebrate important achievements

Would you like help creating a specific relationship goal?`;
    } else {
      // Generic relationship advice
      advice = `I'm here to support your relationship journey. Here are some general tips:

**Building Stronger Relationships:**
• Regular check-ins and open communication
• Quality time together (use Date Ideas for inspiration)
• Express appreciation (Love Notes are perfect for this)
• Work on goals together (Relationship Goals feature)
• Celebrate milestones and memories

**When You Need More Support:**
• Use Communication Practice for conflict resolution
• Access Counseling Support for professional help
• Read Articles and listen to Podcasts for expert advice

What specific aspect of your relationship would you like to work on?`;
    }
    
    return advice;
  },

  date_ideas: (ctx) => {
    const lowerMessage = ctx.message.toLowerCase();
    let budget = 'any';
    if (lowerMessage.includes('free') || lowerMessage.includes('budget') || lowerMessage.includes('cheap')) {
      budget = 'free';
    } else if (lowerMessage.includes('expensive') || lowerMessage.includes('luxury')) {
      budget = 'luxury';
    }
    
    const ideas = {
      free: `Here are some wonderful free date ideas:

**Free Date Ideas:**
• Stargazing picnic (pack food from home)
• Coffee shop hopping (try 2-3 local cafes)
• Movie marathon at home (create a cozy fort)
• Explore a new neighborhood on foot
• Beach/park sunset watching
• Cook together using ingredients you already have
• Visit a local museum (many have free days)
• Take a scenic hike or nature walk

Would you like me to help you plan one of these, or create a custom date idea?`,
      luxury: `Here are some luxurious date ideas:

**Luxury Date Ideas:**
• Fine dining at a top restaurant
• Spa day for couples
• Weekend getaway to a romantic destination
• Private wine tasting experience
• Hot air balloon ride
• Luxury hotel staycation
• Couples cooking class at a premium venue
• Private yacht or boat charter

Would you like help planning a special luxury date?`,
      any: `Here are some great date ideas for any budget:

**Budget-Friendly:**
• Coffee shop date
• Picnic in the park
• Museum visit
• Home movie night

**Mid-Range:**
• Cooking class together
• Wine tasting
• Escape room
• Concert or show

**Special Occasions:**
• Weekend getaway
• Fine dining experience
• Spa day
• Surprise adventure

What type of date are you looking for? I can help you find the perfect one!`
    };
    
    return ideas[budget] || ideas.any;
  },

  content_generation: (ctx) => {
    const lowerMessage = ctx.message.toLowerCase();
    const partnerName = ctx.userContext?.partnerName || 'your partner';
    
    if (lowerMessage.includes('poem') || lowerMessage.includes('write a poem')) {
      return `Here's a personalized poem for ${partnerName}:

**A Love Note for ${partnerName}**

In the quiet moments we share,
I find myself grateful beyond compare.
Your presence lights up my every day,
In the simplest and grandest way.

Through laughter, tears, and everything between,
You're the best part of my daily scene.
Together we grow, together we learn,
For your love, my heart will always yearn.

💕

Would you like me to customize this further or create a different style of poem?`;
    }
    
    if (lowerMessage.includes('love note') || lowerMessage.includes('message') || lowerMessage.includes('note')) {
      return `Here's a personalized love note for ${partnerName}:

**My Dearest ${partnerName},**

I wanted to take a moment to tell you how much you mean to me. Your presence in my life brings so much joy and meaning. 

Every day with you is a gift, and I'm grateful for the love we share. Whether we're laughing together, working through challenges, or simply enjoying each other's company, I feel so lucky to have you by my side.

Thank you for being you, and for being mine.

With all my love 💕

---

Would you like me to customize this message or create one for a specific occasion?`;
    }
    
    if (lowerMessage.includes('apology') || lowerMessage.includes('sorry')) {
      return `Here's a thoughtful apology message:

**I'm Sorry, ${partnerName}**

I want to apologize for [the situation]. I realize that my actions/words hurt you, and that's the last thing I ever want to do.

I understand now how this affected you, and I take full responsibility. Your feelings matter to me, and I'm committed to doing better.

I hope we can talk about this and work through it together. I value our relationship and want to make things right.

With love and regret,
[Your name]

---

Would you like me to personalize this further based on your specific situation?`;
    }
    
    return `I can help you create personalized content! I can generate:
• Love notes and messages
• Poems
• Apology messages
• Anniversary notes
• Affirmations

What type of content would you like me to create for ${partnerName}?`;
  },

  subscription_info: (ctx) => {
    const tier = ctx.userContext?.subscriptionTier || 'Basis';
    const info: Record<string, string> = {
      Basis: `You're on the **Basis (FREE)** plan! Here's what you have access to:

✅ 50+ Love Notes Library
✅ Basic Relationship Quizzes
✅ 5 Date Ideas per month
✅ Anniversary Reminders
✅ Digital Memory Timeline
✅ Mobile App Access
✅ Email Support

**Want more?** Consider upgrading to Premiere ($19.99/month) for:
• 1000+ Love Notes
• AI Relationship Coach (50 questions/month)
• Unlimited Date Ideas
• Relationship Goals Tracker
• Advanced Quizzes
• And much more!`,
      Premiere: `You're on the **Premiere ($19.99/month)** plan - great choice! ⭐

✅ 1000+ Love Notes Library
✅ AI Relationship Coach (50 questions/month)
✅ Unlimited Date Ideas with Filters
✅ Relationship Goals Tracker
✅ Advanced Quizzes & Compatibility Tests
✅ Schedule Surprise Messages
✅ Ad-Free Experience
✅ Priority Support

You're getting great value! Need even more? Exclusive tier offers unlimited everything plus AI Content Creator.`,
      Exclusive: `You're on the **Exclusive ($34.99/month)** plan - the full experience! 🎉

✅ Unlimited Love Notes Library
✅ Unlimited AI Relationship Coach
✅ AI Content Creator (poems, letters)
✅ Personalized Relationship Reports
✅ Exclusive Couples Community Access
✅ Monthly Contest Entry for Prizes
✅ LGBTQ+ Specialized Resources
✅ 1-on-1 Expert Consultation (1/month)
✅ Premium WhatsApp Support
✅ VIP Badge & Recognition

You have access to everything! How can I help you make the most of your subscription?`
    };
    
    return info[tier] || info.Basis;
  }
};

// Pattern matching for query classification
function classifyQuery(message: string): string {
  const lower = message.toLowerCase();
  
  // Greetings
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/i.test(message)) {
    return 'greeting';
  }
  
  // Feature help
  if (lower.includes('how do i') || lower.includes('how to') || lower.includes('help with') || 
      lower.includes('love note') || lower.includes('date idea') || lower.includes('goal') ||
      lower.includes('milestone') || lower.includes('feature')) {
    return 'feature_help';
  }
  
  // Relationship advice
  if (lower.includes('advice') || lower.includes('help') || lower.includes('problem') ||
      lower.includes('issue') || lower.includes('struggle') || lower.includes('difficult') ||
      lower.includes('communication') || lower.includes('argue') || lower.includes('fight') ||
      lower.includes('intimacy') || lower.includes('connection') || lower.includes('improve')) {
    return 'relationship_advice';
  }
  
  // Date ideas
  if (lower.includes('date') || lower.includes('activity') || lower.includes('what to do') ||
      lower.includes('weekend') || lower.includes('tonight') || lower.includes('idea')) {
    return 'date_ideas';
  }
  
  // Content generation
  if (lower.includes('poem') || lower.includes('write') || lower.includes('create') ||
      lower.includes('generate') || lower.includes('love note') || lower.includes('message') ||
      lower.includes('apology') || lower.includes('letter')) {
    return 'content_generation';
  }
  
  // Subscription info
  if (lower.includes('subscription') || lower.includes('plan') || lower.includes('tier') ||
      lower.includes('premium') || lower.includes('what can i do') || lower.includes('features')) {
    return 'subscription_info';
  }
  
  // Default to feature help
  return 'feature_help';
}

// Generate response from knowledge base
function generateFromKnowledgeBase(knowledgeContext: string, query: string): string {
  if (!knowledgeContext) {
    return '';
  }
  
  // Extract relevant information from knowledge base
  const lines = knowledgeContext.split('\n\n');
  let response = '';
  
  for (const line of lines) {
    if (line.toLowerCase().includes(query.toLowerCase().substring(0, 10))) {
      response += line + '\n\n';
    }
  }
  
  return response.trim();
}

// Main independent response generator
export async function generateIndependentResponse(
  context: QueryContext,
  supabase: SupabaseClient
): Promise<IndependentResponse> {
  const queryType = classifyQuery(context.message);
  
  // Try to get response from knowledge base first
  let knowledgeResponse = generateFromKnowledgeBase(context.knowledgeContext, context.message);
  
  // Build response context
  const responseContext: QueryContext = {
    ...context,
    knowledgeContext: knowledgeResponse || context.knowledgeContext,
  };
  
  // Get template response
  const template = RESPONSE_TEMPLATES[queryType];
  let response = '';
  
  if (template) {
    response = template(responseContext);
  } else {
    // Fallback: use knowledge base or generic response
    if (knowledgeResponse) {
      // Use knowledge base content and enhance it
      response = `${knowledgeResponse}\n\nIs there anything specific about this you'd like me to explain further?`;
    } else {
      // Generic helpful response
      response = `I understand you're asking about "${context.message}". Let me help you with that. 

Based on your question, I can:
• Guide you through relevant platform features
• Provide relationship advice and support
• Suggest activities and date ideas
• Help with goal setting and tracking
• Generate personalized content (love notes, poems, etc.)

Could you tell me a bit more about what you're looking for? That way I can give you the most helpful response.`;
    }
  }
  
  // Enhance response with knowledge base if available and not already used
  if (knowledgeResponse && !response.includes(knowledgeResponse.substring(0, 50))) {
    // Prepend relevant knowledge if it adds value
    if (knowledgeResponse.length < 200) {
      response = `${knowledgeResponse}\n\n${response}`;
    }
  }
  
  // Extract suggested features
  const featuresSuggested = extractFeatures(response);
  
  // Personalize response with user context
  if (context.userContext?.partnerName) {
    // Replace generic references with actual partner name
    response = response.replace(/your partner/gi, context.userContext.partnerName);
    response = response.replace(/the partner/gi, context.userContext.partnerName);
  }
  
  // Add subscription-aware suggestions
  const tier = context.userContext?.subscriptionTier || 'Basis';
  if (tier === 'Basis' && response.includes('AI Relationship Coach')) {
    response += `\n\n💡 Note: AI Relationship Coach is available in Premiere and Exclusive tiers. Consider upgrading to unlock this feature!`;
  }
  
  return {
    content: response,
    featuresSuggested,
  };
}

// Extract features from response (reuse from ai.ts logic)
function extractFeatures(content: string): string[] {
  const featureKeywords: Record<string, string> = {
    "love note": "Love Notes",
    "date idea": "Date Ideas",
    "relationship goal": "Relationship Goals",
    "milestone": "Milestones",
    "memory lane": "Memory Lane",
    "journal": "Shared Journals",
    "calendar": "Couples Calendar",
    "quiz": "Relationship Quizzes",
    "ai coach": "AI Relationship Coach",
    "communication practice": "Communication Practice",
    "meditation": "Meditation",
    "community": "Community",
  };
  
  const suggested: string[] = [];
  const lowerContent = content.toLowerCase();
  
  for (const [keyword, feature] of Object.entries(featureKeywords)) {
    if (lowerContent.includes(keyword)) {
      suggested.push(feature);
    }
  }
  
  return [...new Set(suggested)];
}

