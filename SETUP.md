# 📋 Setup Guide - One2One Love Chatbot

Complete setup instructions for local development.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Run database migrations (if using Supabase CLI)
supabase db push

# 4. Start development server
npm run dev
```

## Detailed Setup

### 1. Install Dependencies

```bash
npm install
```

This installs:
- Next.js 14
- React 18
- Supabase client
- OpenAI/Anthropic SDKs
- Tailwind CSS
- Other dependencies

### 2. Supabase Configuration

#### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

#### 2.2 Run Database Migrations

**Option A: Using Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

**Option B: Using Supabase Dashboard**

1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `supabase/migrations/001_chatbot_schema.sql`
3. Paste and run in SQL Editor
4. (Optional) Run `002_seed_knowledge_base.sql` to seed sample data

#### 2.3 Configure Edge Function Secrets

```bash
supabase secrets set OPENAI_API_KEY=your_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set AI_PROVIDER=openai
supabase secrets set AI_MODEL=gpt-4-turbo-preview
```

### 3. Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Provider (choose one)
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...

# AI Configuration
AI_PROVIDER=openai
AI_MODEL=gpt-4-turbo-preview
CHATBOT_TEMPERATURE=0.7
CHATBOT_MAX_TOKENS=1000
```

### 4. Local Development

#### 4.1 Start Next.js Dev Server

```bash
npm run dev
```

Visit `http://localhost:3000`

#### 4.2 Test Edge Function Locally

```bash
# Serve Edge Function locally
supabase functions serve chatbot

# In another terminal, test it
curl -X POST http://localhost:54321/functions/v1/chatbot \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "userId": "test-user-id"}'
```

### 5. Customization

#### 5.1 Update System Prompt

Edit `supabase/functions/chatbot/index.ts` and modify the `SYSTEM_PROMPT` constant.

#### 5.2 Customize UI

- Chat widget: `src/components/Chatbot/ChatWidget.tsx`
- Chat interface: `src/components/Chatbot/ChatInterface.tsx`
- Message bubble: `src/components/Chatbot/MessageBubble.tsx`

#### 5.3 Add Knowledge Base Content

1. Add entries to `chatbot_knowledge` table
2. Generate embeddings (optional, for vector search)
3. Update RAG search logic in `supabase/functions/chatbot/utils/rag.ts`

#### 5.4 Integrate with User Data

Update `supabase/functions/chatbot/utils/context.ts` to match your actual database schema:

- User profiles table name
- Relationship goals table
- Milestones table
- Other user data tables

### 6. Testing

#### 6.1 Test Chatbot Features

Try these example queries:
- "How do I send a love note?"
- "We need a date idea for this weekend"
- "Help us improve our communication"
- "What's included in my subscription?"
- "We're having trouble communicating"

#### 6.2 Test Multi-language

Change language in request:
```json
{
  "message": "Hola, ¿cómo estás?",
  "userId": "user-id",
  "language": "es"
}
```

### 7. Troubleshooting

#### Issue: Edge Function not responding

- Check Supabase secrets are set correctly
- Verify API keys are valid
- Check Edge Function logs: `supabase functions logs chatbot`

#### Issue: Database errors

- Verify migrations ran successfully
- Check RLS policies are correct
- Ensure user is authenticated

#### Issue: AI not responding

- Verify API key is correct
- Check API quota/limits
- Review error logs in Edge Function

#### Issue: Frontend not connecting

- Verify environment variables
- Check CORS settings
- Ensure Supabase client is initialized correctly

### 8. Next Steps

1. **Customize for your platform:**
   - Update user context builder
   - Add your specific features to knowledge base
   - Customize system prompt

2. **Enhance RAG:**
   - Generate embeddings for knowledge base
   - Implement vector similarity search
   - Add more content to knowledge base

3. **Add Features:**
   - Voice input/output
   - Proactive suggestions
   - Relationship health insights
   - Integration with other platform features

4. **Production Deployment:**
   - Follow `DEPLOYMENT.md` guide
   - Set up monitoring
   - Configure error tracking
   - Implement rate limiting

## Development Tips

1. **Use TypeScript:** All code is typed - leverage IntelliSense
2. **Check Logs:** Use `supabase functions logs` for debugging
3. **Test Locally:** Test Edge Functions locally before deploying
4. **Incremental Development:** Start with basic features, add complexity gradually
5. **Version Control:** Commit frequently, use meaningful commit messages

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com)

## Support

For issues:
1. Check logs and error messages
2. Review documentation
3. Test with minimal examples
4. Check Supabase status page

