'use client';

import ChatWidget from '@/components/Chatbot/ChatWidget';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          One2One Love Chatbot
        </h1>
        <p className="text-gray-600 mb-8">
          Your intelligent relationship assistant is ready to help. Click the chat button in the bottom right corner to get started.
        </p>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✨ Feature discovery & navigation</li>
            <li>💡 Relationship advice & coaching</li>
            <li>📅 Activity & content recommendations</li>
            <li>🎯 Goal & progress tracking assistance</li>
            <li>🤝 Conflict resolution support</li>
            <li>✍️ Personalized content generation</li>
            <li>🌍 Multi-language support</li>
          </ul>
        </div>
      </div>

      <ChatWidget />
    </main>
  );
}

