// Chatbot API client
import { ChatbotResponse } from '@/types/chatbot';
import { supabase } from './supabase';

const EDGE_FUNCTION_URL = '/functions/v1/chatbot';

export async function sendMessage(
  message: string,
  conversationId?: string,
  userId?: string,
  platformKey?: string
): Promise<ChatbotResponse> {
  if (!userId) {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }
    userId = user.id;
  }

  // Get platform key from env or use default
  const defaultPlatformKey = process.env.NEXT_PUBLIC_PLATFORM_KEY || 'one2onelove';
  const finalPlatformKey = platformKey || defaultPlatformKey;

  // Get Supabase URL and anon key for the request
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const response = await fetch(`${supabaseUrl}${EDGE_FUNCTION_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
    },
    body: JSON.stringify({
      message,
      conversationId,
      userId,
      language: 'en', // TODO: Get from user preferences
      platformKey: finalPlatformKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send message');
  }

  return await response.json();
}

export async function getConversations(userId?: string) {
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }
    userId = user.id;
  }

  const { data, error } = await supabase
    .from('chatbot_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('chatbot_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function deleteConversation(conversationId: string) {
  const { error } = await supabase
    .from('chatbot_conversations')
    .delete()
    .eq('id', conversationId);

  if (error) throw error;
}

