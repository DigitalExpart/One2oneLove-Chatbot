// TypeScript types for Chatbot

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
  metadata?: {
    model?: string;
    tokens?: number;
    features_suggested?: string[];
  };
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface ChatbotResponse {
  message: string;
  conversationId: string;
  featuresSuggested?: string[];
}

export interface ChatbotConfig {
  apiUrl: string;
  maxMessages?: number;
  enableVoice?: boolean;
  language?: string;
}

