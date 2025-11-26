'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { sendMessage } from '@/lib/chatbot';
import { ChatMessage } from '@/types/chatbot';
import MessageBubble from './MessageBubble';

interface ChatInterfaceProps {
  conversationId?: string;
  onClose?: () => void;
  className?: string;
  platformKey?: string;
}

export default function ChatInterface({
  conversationId: initialConversationId,
  onClose,
  className = '',
  platformKey,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation history if conversationId exists
  useEffect(() => {
    if (conversationId && messages.length === 0) {
      // TODO: Load conversation history
      // loadConversationHistory(conversationId);
    }
  }, [conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(userMessage.content, conversationId, undefined, platformKey);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        createdAt: new Date().toISOString(),
        metadata: {
          features_suggested: response.featuresSuggested,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(response.conversationId);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent text-2xl font-bold mb-2">
              💕 One2One Love Assistant
            </div>
            <p className="text-sm mb-4">
              I'm here to help you build deeper connections, resolve conflicts, and create lasting love.
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>Try asking:</p>
              <p>"How do I send a love note?"</p>
              <p>"We need a date idea for this weekend"</p>
              <p>"Help us improve our communication"</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent min-h-[44px] max-h-32"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg p-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Your conversations are private and secure
        </p>
      </div>
    </div>
  );
}

