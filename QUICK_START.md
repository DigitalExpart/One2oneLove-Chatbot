# ⚡ Quick Start Guide

Get the One2One Love Chatbot running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Supabase account and project created
- [ ] OpenAI or Anthropic API key

## 5-Minute Setup

### 1. Install Dependencies (1 min)

```bash
npm install
```

### 2. Configure Environment (1 min)

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key
```

### 3. Set Up Database (2 min)

**Option A: Supabase Dashboard**
1. Go to SQL Editor
2. Run `supabase/migrations/001_chatbot_schema.sql`
3. (Optional) Run `002_seed_knowledge_base.sql`

**Option B: Supabase CLI**
```bash
supabase db push
```

### 4. Configure Edge Function (1 min)

```bash
supabase secrets set OPENAI_API_KEY=your_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_key
supabase secrets set AI_PROVIDER=openai
```

### 5. Deploy & Run (1 min)

```bash
# Deploy Edge Function
supabase functions deploy chatbot

# Start dev server
npm run dev
```

Visit `http://localhost:3000` and click the chat button! 🎉

## Test It Out

Try these example queries:
- "How do I send a love note?"
- "We need a date idea"
- "Help us improve communication"

## Need Help?

- **Detailed Setup**: See `SETUP.md`
- **Deployment**: See `DEPLOYMENT.md`
- **Architecture**: See `ARCHITECTURE.md`

## Common Issues

**"Edge Function not found"**
→ Deploy it: `supabase functions deploy chatbot`

**"Database error"**
→ Run migrations in Supabase SQL Editor

**"API key error"**
→ Check secrets: `supabase secrets list`

## Next Steps

1. Customize system prompt in `supabase/functions/chatbot/index.ts`
2. Add your knowledge base content
3. Integrate with your user data tables
4. Customize UI components

Happy coding! 💕

