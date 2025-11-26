# 🏗️ Architecture Overview - One2One Love Chatbot

## System Architecture

```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
         │ HTTP/HTTPS
         │
┌────────▼─────────────────────────┐
│   Supabase Edge Function          │
│   (Chatbot API Endpoint)          │
│                                   │
│   ┌───────────────────────────┐   │
│   │  Request Handler          │   │
│   │  - Parse request          │   │
│   │  - Get/create conversation│   │
│   │  - Build context          │   │
│   └───────────┬───────────────┘   │
│               │                    │
│   ┌───────────▼───────────────┐   │
│   │  Context Builder          │   │
│   │  - User profile           │   │
│   │  - Subscription tier      │   │
│   │  - Goals & milestones     │   │
│   │  - Activity history       │   │
│   └───────────┬───────────────┘   │
│               │                    │
│   ┌───────────▼───────────────┐   │
│   │  RAG Search               │   │
│   │  - Query knowledge base   │   │
│   │  - Vector similarity       │   │
│   │  - Retrieve context       │   │
│   └───────────┬───────────────┘   │
│               │                    │
│   ┌───────────▼───────────────┐   │
│   │  AI Service               │   │
│   │  - OpenAI / Anthropic    │   │
│   │  - Generate response     │   │
│   └───────────┬───────────────┘   │
│               │                    │
│   ┌───────────▼───────────────┐   │
│   │  Save Response            │   │
│   │  - Store message          │   │
│   │  - Update conversation    │   │
│   └───────────────────────────┘   │
└────────┬──────────────────────────┘
         │
         │
┌────────▼─────────────────────────┐
│   Supabase PostgreSQL             │
│                                   │
│   ┌───────────────────────────┐   │
│   │  chatbot_conversations    │   │
│   │  chatbot_messages         │   │
│   │  chatbot_knowledge        │   │
│   │  (with pgvector)          │   │
│   └───────────────────────────┘   │
│                                   │
│   ┌───────────────────────────┐   │
│   │  User Tables              │   │
│   │  - profiles               │   │
│   │  - relationship_goals     │   │
│   │  - milestones             │   │
│   │  - activities             │   │
│   └───────────────────────────┘   │
└───────────────────────────────────┘
```

## Component Architecture

### Frontend Components

```
ChatWidget (Floating Button)
  └── ChatInterface
        ├── MessageList
        │     └── MessageBubble[]
        └── InputArea
              ├── TextArea
              └── Send Button
```

### Backend Functions

```
Edge Function: chatbot
  ├── index.ts (Main Handler)
  ├── utils/
  │   ├── ai.ts (AI Integration)
  │   ├── context.ts (User Context)
  │   └── rag.ts (Knowledge Search)
```

## Data Flow

### 1. User Sends Message

```
User Input
  ↓
ChatInterface.handleSend()
  ↓
chatbot.ts.sendMessage()
  ↓
POST /functions/v1/chatbot
  ↓
Edge Function Handler
```

### 2. Processing Flow

```
1. Parse Request
   ↓
2. Get/Create Conversation
   ↓
3. Save User Message
   ↓
4. Load Conversation History
   ↓
5. Build User Context
   - Query user profile
   - Get subscription info
   - Fetch goals & milestones
   ↓
6. Search Knowledge Base (RAG)
   - Generate query embedding
   - Vector similarity search
   - Retrieve relevant context
   ↓
7. Build AI Context
   - System prompt
   - User context
   - Knowledge context
   - Conversation history
   ↓
8. Call AI Service
   - OpenAI / Anthropic API
   - Generate response
   ↓
9. Save Assistant Message
   ↓
10. Return Response
```

### 3. Response Handling

```
Edge Function Response
  ↓
chatbot.ts.sendMessage()
  ↓
ChatInterface
  ↓
Update Messages State
  ↓
Render MessageBubble
```

## Database Schema

### Core Tables

**chatbot_conversations**
- Stores conversation sessions
- Links to user_id
- Tracks title and timestamps

**chatbot_messages**
- Stores individual messages
- Links to conversation_id
- Stores role, content, metadata

**chatbot_knowledge**
- Vector store for RAG
- Contains platform features, FAQs, advice
- Embeddings for semantic search

### Relationships

```
users (auth.users)
  └── chatbot_conversations (1:N)
        └── chatbot_messages (1:N)

chatbot_knowledge (standalone, shared)
```

## Security Model

### Row Level Security (RLS)

1. **Conversations**: Users can only access their own
2. **Messages**: Users can only see messages in their conversations
3. **Knowledge Base**: Readable by all authenticated users

### API Security

1. **Authentication**: Required for all requests
2. **Authorization**: User ID validated on each request
3. **Input Validation**: All inputs sanitized
4. **Rate Limiting**: (To be implemented)

## AI Integration

### Supported Providers

1. **OpenAI**
   - Models: GPT-4, GPT-4 Turbo
   - Embeddings: text-embedding-ada-002

2. **Anthropic**
   - Models: Claude 3.5 Sonnet
   - (Embeddings via OpenAI)

### Configuration

- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 1000 per response
- **Context Window**: Includes system prompt + user context + history

## RAG Implementation

### Current Implementation

- Text-based search (ILIKE)
- Language filtering
- Content type filtering

### Future Enhancement

- Vector embeddings for all knowledge entries
- Semantic similarity search using pgvector
- Hybrid search (keyword + vector)

## Performance Considerations

### Caching Strategy

- Conversation history: Loaded on demand
- User context: Cached per request
- Knowledge base: Indexed for fast search

### Optimization

- Database indexes on frequently queried columns
- Vector indexes for embeddings
- Connection pooling
- Response streaming (future)

## Scalability

### Horizontal Scaling

- Edge Functions auto-scale
- Database connection pooling
- Stateless design

### Vertical Scaling

- Database can be scaled independently
- AI API calls can be rate-limited
- Message storage can be archived

## Monitoring & Observability

### Metrics to Track

1. **Performance**
   - Response time
   - Token usage
   - API latency

2. **Usage**
   - Messages per user
   - Conversations created
   - Features suggested

3. **Errors**
   - API failures
   - Database errors
   - AI service errors

### Logging

- Edge Function logs (Supabase)
- Application logs (Next.js)
- Error tracking (Sentry, etc.)

## Future Enhancements

1. **Advanced RAG**
   - Full vector search implementation
   - Multi-modal knowledge (images, videos)

2. **Proactive Features**
   - Scheduled check-ins
   - Milestone reminders
   - Goal progress notifications

3. **Multi-modal**
   - Voice input/output
   - Image understanding
   - Video analysis

4. **Analytics**
   - Relationship health insights
   - Usage patterns
   - Success metrics

