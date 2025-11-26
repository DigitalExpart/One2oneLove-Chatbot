# 🤖 One2One Love Chatbot

An intelligent relationship assistant chatbot for the One2One Love platform, designed to help committed couples build deeper connections, resolve conflicts, and create lasting love.

## 🌐 Multi-Platform Support

The chatbot supports **multiple websites/platforms** with:
- **Platform-specific branding** (colors, names, logos)
- **Platform-specific features** (different feature sets per platform)
- **Platform-specific knowledge base** (custom content per platform)
- **Platform-specific subscription tiers** (different pricing/features)
- **Shared infrastructure** (same database, same Edge Function)

See [MULTI_PLATFORM_SETUP.md](./MULTI_PLATFORM_SETUP.md) for detailed setup instructions.

## 🌟 Features

The chatbot understands and can help users with **all 35+ platform features**:

- **💕 Connection Building (8)** - Love Notes, Scheduled Notes, AI Content Creator, Date Ideas, Memory Lane, Shared Journals, Cooperative Games, Couples Calendar
- **🎯 Relationship Growth (6)** - Relationship Goals, Milestones, Love Language Quiz, Relationship Quizzes, Couples Dashboard, Progress Tracking
- **💬 Communication & Support (8)** - AI Relationship Coach, Communication Practice, Meditation, Counseling Support, Podcasts, Articles, Influencers, Chat System
- **👥 Community & Social (6)** - Community, Find Friends, Buddy System, Success Stories, Leaderboard, Win a Cruise
- **🎮 Gamification (4)** - Achievements, Points System, Premium Features, Levels
- **🌈 Inclusivity (3)** - LGBTQ+ Support, Multi-Language Support, Diversity Section

**Core Capabilities:**
- **Feature Discovery & Navigation** - Guide users through all 35+ platform features
- **Relationship Advice & Coaching** - Personalized relationship guidance
- **Activity & Content Recommendations** - Suggest dates, quizzes, articles based on needs
- **Goal & Progress Tracking** - Help set and achieve relationship goals
- **Conflict Resolution Assistant** - Navigate conflicts constructively
- **Personalized Content Generation** - Create custom love notes, poems, ideas
- **Subscription Awareness** - Maximize value for Basis/Premiere/Exclusive tiers
- **Multi-Language Support** - Support for EN, ES, FR, IT, DE, NL, PT
- **Context-Aware** - Understands user's relationship status, goals, history, subscription tier

## 🏗️ Architecture

### Backend
- **Supabase Edge Function** - Serverless chatbot API endpoint
- **AI Integration** - OpenAI GPT-4 or Anthropic Claude
- **RAG Implementation** - Vector search for knowledge base
- **Database** - Supabase PostgreSQL with pgvector

### Frontend
- **React/Next.js** - Modern UI components
- **Chat Interface** - Floating widget + full-page view
- **Real-time Updates** - WebSocket or polling for messages

## 📁 Project Structure

```
├── supabase/
│   ├── functions/
│   │   └── chatbot/
│   │       ├── index.ts          # Edge function handler
│   │       └── utils/
│   │           ├── ai.ts         # AI service integration
│   │           ├── rag.ts        # RAG implementation
│   │           └── context.ts    # User context builder
│   └── migrations/
│       └── chatbot_schema.sql     # Database schema
├── src/
│   ├── components/
│   │   └── Chatbot/
│   │       ├── ChatWidget.tsx    # Floating chat widget
│   │       ├── ChatInterface.tsx # Full chat interface
│   │       └── MessageBubble.tsx # Message component
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client
│   │   └── chatbot.ts            # Chatbot API client
│   └── types/
│       └── chatbot.ts            # TypeScript types
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Supabase account and project
- OpenAI API key or Anthropic API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Configure your `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_key
   # or
   ANTHROPIC_API_KEY=your_anthropic_key
   ```

5. Run database migrations:
   ```bash
   supabase db push
   ```

6. Deploy Edge Function:
   ```bash
   npm run deploy:edge-function
   ```

7. Start development server:
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### AI Model Selection

Edit `supabase/functions/chatbot/utils/ai.ts` to switch between OpenAI and Anthropic:

```typescript
// Use OpenAI
const response = await openai.chat.completions.create({...});

// Or use Anthropic
const response = await anthropic.messages.create({...});
```

### System Prompt Customization

Edit the system prompt in `supabase/functions/chatbot/index.ts` to customize the chatbot's personality and capabilities.

## 📊 Database Schema

The chatbot uses three main tables:

- `chatbot_conversations` - Stores conversation sessions
- `chatbot_messages` - Stores individual messages
- `chatbot_knowledge` - Vector store for RAG knowledge base

See `supabase/migrations/chatbot_schema.sql` for full schema.

## 🌍 Multi-Language Support

The chatbot automatically detects and responds in the user's preferred language. Supported languages:

- English (EN)
- Spanish (ES)
- French (FR)
- Italian (IT)
- German (DE)
- Dutch (NL)
- Portuguese (PT)

## 🔐 Privacy & Safety

- All conversations are private to each user
- Crisis detection for domestic violence/abuse situations
- Professional help recommendations when needed
- Content moderation for relationship-positive advice

## 📈 Roadmap

- [x] Core chatbot infrastructure
- [x] Feature discovery & navigation
- [x] Relationship advice
- [ ] Voice input/output
- [ ] Proactive suggestions
- [ ] Advanced relationship health insights

## 📝 License

Proprietary - One2One Love Platform

