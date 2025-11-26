# 🔔 REMINDER: Run These SQL Migrations!

**Once you create your Supabase project, run these migrations IN ORDER:**

## Migration Order (IMPORTANT!)

### 1️⃣ First: Core Schema
**File:** `supabase/migrations/001_chatbot_schema.sql`
- Creates core chatbot tables
- Sets up conversations, messages, knowledge base

### 2️⃣ Second: Knowledge Base Seed (Optional)
**File:** `supabase/migrations/002_seed_knowledge_base.sql`
- Adds sample knowledge entries
- Feature descriptions, FAQs, advice

### 3️⃣ Third: Multi-Platform Support
**File:** `supabase/migrations/003_multi_platform_schema.sql`
- Adds platform configuration
- Enables multi-website support

### 4️⃣ Fourth: RAG Learning System ⭐
**File:** `supabase/migrations/004_rag_self_learning_schema.sql`
- Adds self-learning capabilities
- Feedback system
- Auto-update knowledge base

## 📍 Where to Run

1. Go to Supabase Dashboard → Your Project
2. Click "SQL Editor"
3. Click "New query"
4. Copy/paste migration file contents
5. Click "Run"
6. Repeat for each migration in order

## ✅ Verification

After all migrations, run:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'chatbot_%'
ORDER BY table_name;
```

Should show 8 tables total.

---

**See SETUP_CHECKLIST.md for detailed instructions!**

