'use client';

import React from 'react';
import { ChatMessage } from '@/types/chatbot';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
            : 'bg-white border border-gray-200 text-gray-800'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        {message.metadata?.features_suggested && message.metadata.features_suggested.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <p className="text-xs opacity-90 mb-1">Suggested features:</p>
            <div className="flex flex-wrap gap-1">
              {message.metadata.features_suggested.map((feature, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-white/20 rounded px-2 py-0.5"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
        {message.createdAt && (
          <div className={`text-xs mt-1 ${isUser ? 'text-white/70' : 'text-gray-400'}`}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </div>
        )}
      </div>
    </div>
  );
}

