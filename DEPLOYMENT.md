# 🚀 Deployment Guide - One2One Love Chatbot

This guide will help you deploy the chatbot to your Supabase project and Next.js application.

## Prerequisites

1. **Supabase Account** - Create a project at [supabase.com](https://supabase.com)
2. **Node.js 18+** - Install from [nodejs.org](https://nodejs.org)
3. **Supabase CLI** - Install via npm: `npm install -g supabase`
4. **AI API Key** - Get from OpenAI or Anthropic

## Step 1: Supabase Setup

### 1.1 Initialize Supabase Project

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref
```

### 1.2 Run Database Migrations

```bash
# Apply the chatbot schema
supabase db push

# Or manually run the SQL files in Supabase Dashboard
# Go to SQL Editor and run: supabase/migrations/001_chatbot_schema.sql
```

### 1.3 Seed Knowledge Base (Optional)

```bash
# Run the seed script in Supabase SQL Editor
# Copy and paste: supabase/migrations/002_seed_knowledge_base.sql
```

## Step 2: Configure Environment Variables

### 2.1 Supabase Edge Function Secrets

Set secrets for your Edge Function:

```bash
# Set OpenAI API key
supabase secrets set OPENAI_API_KEY=your_openai_key

# Or set Anthropic API key
supabase secrets set ANTHROPIC_API_KEY=your_anthropic_key

# Set AI provider preference
supabase secrets set AI_PROVIDER=openai  # or "anthropic"
supabase secrets set AI_MODEL=gpt-4-turbo-preview  # or "claude-3-5-sonnet-20241022"
supabase secrets set CHATBOT_TEMPERATURE=0.7
supabase secrets set CHATBOT_MAX_TOKENS=1000

# Set Supabase service role key (for admin operations)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2.2 Next.js Environment Variables

Create `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Step 3: Deploy Supabase Edge Function

```bash
# Deploy the chatbot function
supabase functions deploy chatbot

# Or use npm script
npm run deploy:edge-function
```

Verify deployment:

```bash
# List deployed functions
supabase functions list
```

## Step 4: Generate Embeddings for Knowledge Base (Optional but Recommended)

For better RAG performance, generate embeddings for knowledge base entries:

```typescript
// Create a script: scripts/generate-embeddings.ts
// This would iterate through chatbot_knowledge entries
// and generate embeddings using OpenAI's embedding API
// Then update the embedding column in the database
```

## Step 5: Deploy Next.js Application

### Option A: Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Option B: Other Platforms

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Step 6: Test the Chatbot

1. **Test Edge Function Directly:**

```bash
curl -X POST https://your-project.supabase.co/functions/v1/chatbot \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, what can you help me with?",
    "userId": "test-user-id"
  }'
```

2. **Test in Application:**
   - Open your deployed Next.js app
   - Click the chat widget
   - Send a test message

## Troubleshooting

### Edge Function Errors

1. **Check logs:**
   ```bash
   supabase functions logs chatbot
   ```

2. **Verify secrets:**
   ```bash
   supabase secrets list
   ```

3. **Test locally:**
   ```bash
   supabase functions serve chatbot
   ```

### Database Issues

1. **Verify RLS policies:**
   - Check that users can access their own conversations
   - Verify knowledge base is readable by authenticated users

2. **Check indexes:**
   - Ensure vector indexes are created for embeddings
   - Verify conversation and message indexes exist

### Frontend Issues

1. **Check CORS:**
   - Verify Edge Function allows requests from your domain
   - Check browser console for CORS errors

2. **Verify Authentication:**
   - Ensure users are authenticated before using chatbot
   - Check Supabase auth configuration

## Production Checklist

- [ ] Database migrations applied
- [ ] Knowledge base seeded
- [ ] Embeddings generated (if using vector search)
- [ ] Edge Function deployed and tested
- [ ] Environment variables configured
- [ ] RLS policies verified
- [ ] CORS configured correctly
- [ ] Error logging set up
- [ ] Monitoring configured
- [ ] Rate limiting implemented (if needed)

## Monitoring & Analytics

Consider setting up:

1. **Supabase Logs** - Monitor Edge Function performance
2. **Error Tracking** - Use Sentry or similar
3. **Analytics** - Track chatbot usage and engagement
4. **Performance Monitoring** - Monitor response times

## Security Best Practices

1. **API Keys:**
   - Never commit API keys to git
   - Use environment variables or secrets
   - Rotate keys regularly

2. **RLS Policies:**
   - Ensure users can only access their own data
   - Review and test all policies

3. **Rate Limiting:**
   - Implement rate limiting on Edge Function
   - Prevent abuse and control costs

4. **Input Validation:**
   - Validate all user inputs
   - Sanitize messages before processing

## Cost Optimization

1. **AI Usage:**
   - Monitor token usage
   - Set appropriate max_tokens limits
   - Cache common responses when possible

2. **Database:**
   - Archive old conversations
   - Optimize queries with proper indexes
   - Use connection pooling

3. **Edge Functions:**
   - Optimize function execution time
   - Use caching where appropriate

## Support

For issues or questions:
- Check Supabase documentation
- Review Edge Function logs
- Test locally before deploying
- Verify all environment variables

