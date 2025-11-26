'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import ChatInterface from './ChatInterface';
import { getPlatformConfig } from '@/lib/platform-config';

interface ChatWidgetProps {
  className?: string;
  platformKey?: string;
}

export default function ChatWidget({ className, platformKey }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const platformConfig = getPlatformConfig();

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className || ''}`}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`bg-gradient-to-r ${platformConfig.branding.gradient} text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110`}
          style={{
            background: `linear-gradient(to right, ${platformConfig.branding.primaryColor}, ${platformConfig.branding.secondaryColor})`
          }}
          aria-label="Open chatbot"
        >
          <MessageCircle size={28} />
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-2xl w-96 h-[600px] flex flex-col border border-gray-200">
          {/* Header */}
          <div 
            className={`bg-gradient-to-r ${platformConfig.branding.gradient} text-white p-4 rounded-t-lg flex items-center justify-between`}
            style={{
              background: `linear-gradient(to right, ${platformConfig.branding.primaryColor}, ${platformConfig.branding.secondaryColor})`
            }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <h3 className="font-semibold">{platformConfig.name} Assistant</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-white/20 rounded p-1 transition-colors"
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded p-1 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Interface */}
          {!isMinimized && (
            <div className="flex-1 overflow-hidden">
              <ChatInterface 
                onClose={() => setIsOpen(false)} 
                platformKey={platformKey || platformConfig.platformKey}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

