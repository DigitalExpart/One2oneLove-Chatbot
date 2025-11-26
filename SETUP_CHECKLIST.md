# ✅ Supabase Setup Checklist

**Reminder: Run all SQL migrations after creating your Supabase project!**

## 📋 Step-by-Step Setup

### Step 1: Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - Project name: "One2One Love Chatbot" (or your preferred name)
   - Database password: (save this securely!)
   - Region: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### Step 2: Get Your Project Credentials
1. Go to Project Settings → API
2. Copy these values (you'll need them):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (keep this secret!)

### Step 3: Run Database Migrations (IN ORDER!)

**⚠️ IMPORTANT: Run these migrations in the exact order listed below!**

#### Migration 1: Core Chatbot Schema
```sql
-- File: supabase/migrations/001_chatbot_schema.sql
```
**What it creates:**
- `chatbot_conversations` table
- `chatbot_messages` table
- `chatbot_knowledge` table
- Basic indexes and RLS policies

**How to run:**
1. Open Supabase SQL Editor
2. Click "New query"
3. Copy entire contents of `supabase/migrations/001_chatbot_schema.sql`
4. Paste and click "Run"
5. ✅ Verify: Check for "Success" message

#### Migration 2: Seed Knowledge Base (Optional but Recommended)
```sql
-- File: supabase/migrations/002_seed_knowledge_base.sql
```
**What it creates:**
- Sample knowledge base entries
- Feature descriptions
- FAQs
- Relationship advice

**How to run:**
1. New query in SQL Editor
2. Copy contents of `supabase/migrations/002_seed_knowledge_base.sql`
3. Paste and click "Run"
4. ✅ Verify: Check `chatbot_knowledge` table has entries

#### Migration 3: Multi-Platform Support
```sql
-- File: supabase/migrations/003_multi_platform_schema.sql
```
**What it creates:**
- `chatbot_platforms` table
- Platform configuration support
- Adds `platform_id` to conversations and knowledge
- Default "one2onelove" platform entry

**How to run:**
1. New query in SQL Editor
2. Copy contents of `supabase/migrations/003_multi_platform_schema.sql`
3. Paste and click "Run"
4. ✅ Verify: Check `chatbot_platforms` table exists

#### Migration 4: RAG Self-Learning System ⭐ NEW
```sql
-- File: supabase/migrations/004_rag_self_learning_schema.sql
```
**What it creates:**
- `chatbot_learning_insights` table
- `chatbot_feedback` table
- `chatbot_knowledge_updates` table
- `chatbot_query_patterns` table
- Learning functions and triggers

**How to run:**
1. New query in SQL Editor
2. Copy contents of `supabase/migrations/004_rag_self_learning_schema.sql`
3. Paste and click "Run"
4. ✅ Verify: Check all 4 new tables exist

### Step 4: Verify All Tables Were Created

Run this verification query:

```sql
-- Check all chatbot tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'chatbot_%'
ORDER BY table_name;
```

**Expected tables (8 total):**
1. ✅ `chatbot_conversations`
2. ✅ `chatbot_messages`
3. ✅ `chatbot_knowledge`
4. ✅ `chatbot_platforms`
5. ✅ `chatbot_learning_insights` ⭐
6. ✅ `chatbot_feedback` ⭐
7. ✅ `chatbot_knowledge_updates` ⭐
8. ✅ `chatbot_query_patterns` ⭐

### Step 5: Configure Environment Variables

Create `.env.local` file in your project:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Platform Configuration (Optional)
NEXT_PUBLIC_PLATFORM_KEY=one2onelove
NEXT_PUBLIC_PLATFORM_NAME=One2One Love
```

### Step 6: Deploy Edge Functions

```bash
# Deploy chatbot function
supabase functions deploy chatbot

# Deploy feedback function (for RAG learning)
supabase functions deploy feedback
```

Or if using Supabase Dashboard:
1. Go to Edge Functions
2. Create new function: `chatbot`
3. Copy code from `supabase/functions/chatbot/index.ts`
4. Set secrets (if needed)

## 🎯 Quick Reference: Migration Order

```
1️⃣  001_chatbot_schema.sql          (Core tables)
2️⃣  002_seed_knowledge_base.sql     (Sample data - optional)
3️⃣  003_multi_platform_schema.sql   (Multi-platform support)
4️⃣  004_rag_self_learning_schema.sql (Learning system) ⭐
```

## ⚠️ Important Reminders

- ✅ Run migrations in order (001 → 002 → 003 → 004)
- ✅ Wait for each migration to complete before running the next
- ✅ Check for errors after each migration
- ✅ Verify tables exist before proceeding
- ✅ Save your service_role key securely (never commit to git!)

## 🆘 Troubleshooting

### "relation already exists" error
- Some tables might already exist
- This is usually safe to ignore
- Check if tables were created successfully

### "permission denied" error
- Make sure you're using the correct database user
- Check RLS policies if needed

### Migration fails partway
- Check which tables were created
- You may need to manually drop failed tables
- Re-run the migration

## 📝 After Setup

Once all migrations are done:

1. ✅ Verify all 8 tables exist
2. ✅ Check knowledge base has entries (if you ran migration 2)
3. ✅ Verify platform entry exists (`chatbot_platforms` table)
4. ✅ Test chatbot endpoint
5. ✅ Test feedback endpoint

## 🎉 You're Done!

Your chatbot is now ready with:
- ✅ Core functionality
- ✅ Multi-platform support
- ✅ RAG self-learning system
- ✅ Knowledge base
- ✅ Feedback system

---

**📌 Bookmark this file and come back when you create your Supabase project!**

