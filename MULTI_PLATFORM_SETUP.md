# 🌐 Multi-Platform Setup Guide

This guide explains how to use the chatbot for multiple websites/platforms in the same love and relationship space.

## Overview

The chatbot is designed to support multiple platforms (websites) with:
- **Platform-specific branding** (colors, names, logos)
- **Platform-specific features** (different feature sets per platform)
- **Platform-specific knowledge base** (custom content per platform)
- **Platform-specific subscription tiers** (different pricing/features)
- **Shared infrastructure** (same database, same Edge Function)

## Architecture

```
┌─────────────────────────────────────────┐
│      Supabase Database                   │
│                                           │
│  ┌─────────────────────────────────┐    │
│  │  chatbot_platforms              │    │
│  │  - Platform configurations       │    │
│  │  - Branding, features, tiers     │    │
│  └─────────────────────────────────┘    │
│                                           │
│  ┌─────────────────────────────────┐    │
│  │  chatbot_conversations            │    │
│  │  - platform_id (links to platform)│    │
│  └─────────────────────────────────┘    │
│                                           │
│  ┌─────────────────────────────────┐    │
│  │  chatbot_knowledge               │    │
│  │  - platform_id (platform-specific)│   │
│  │  - NULL = global (all platforms) │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
           │
           │
┌──────────▼──────────────────────────────┐
│      Edge Function: chatbot              │
│      - Accepts platformKey parameter     │
│      - Loads platform config             │
│      - Uses platform-specific prompt     │
└──────────────────────────────────────────┘
           │
           │
    ┌──────┴──────┬──────────┬──────────┐
    │             │          │          │
┌───▼───┐  ┌─────▼───┐  ┌───▼───┐  ┌───▼───┐
│Site 1 │  │ Site 2  │  │ Site 3│  │  ...  │
│one2one│  │couples  │  │  love │  │       │
│ love  │  │connect  │  │together│  │       │
└───────┘  └─────────┘  └───────┘  └───────┘
```

## Setup Steps

### 1. Run Database Migration

```bash
# Apply multi-platform schema
supabase db push
# Or run manually: supabase/migrations/003_multi_platform_schema.sql
```

### 2. Create a New Platform

#### Option A: Using SQL

```sql
INSERT INTO chatbot_platforms (
  platform_key,
  name,
  domain,
  branding,
  mission_statement,
  features,
  subscription_tiers
) VALUES (
  'couplesconnect',  -- Unique identifier
  'Couples Connect',  -- Display name
  'couplesconnect.com',
  '{
    "primary_color": "#3b82f6",
    "secondary_color": "#8b5cf6",
    "gradient": "from-blue-500 to-purple-600"
  }'::jsonb,
  'Helping couples build stronger relationships through connection and communication.',
  '["Love Notes", "Date Ideas", "Communication Practice"]'::jsonb,
  '{
    "Free": {"price": 0, "features": ["Basic Notes", "5 Date Ideas"]},
    "Premium": {"price": 19.99, "features": ["Unlimited Notes", "Unlimited Dates"]}
  }'::jsonb
);
```

#### Option B: Using Supabase Dashboard

1. Go to Table Editor → `chatbot_platforms`
2. Click "Insert row"
3. Fill in the fields:
   - `platform_key`: Unique identifier (e.g., 'couplesconnect')
   - `name`: Display name
   - `domain`: Your website domain
   - `branding`: JSON with colors
   - `features`: JSON array of feature names
   - `subscription_tiers`: JSON object with tier configurations
   - `is_active`: true

### 3. Add Platform-Specific Knowledge Base

```sql
-- Add knowledge base entries for your platform
INSERT INTO chatbot_knowledge (
  content_type,
  title,
  content,
  platform_id,
  metadata
) VALUES (
  'feature',
  'Love Notes',
  'Send personalized love notes to your partner...',
  (SELECT id FROM chatbot_platforms WHERE platform_key = 'couplesconnect'),
  '{"language": "en", "tags": ["communication"]}'::jsonb
);
```

**Note**: If `platform_id` is NULL, the entry is available to ALL platforms (global).

### 4. Configure Frontend

#### Option A: Environment Variables

Create `.env.local` for each website:

```env
# Website 1: One2One Love
NEXT_PUBLIC_PLATFORM_KEY=one2onelove
NEXT_PUBLIC_PLATFORM_NAME=One2One Love
NEXT_PUBLIC_PRIMARY_COLOR=#ec4899
NEXT_PUBLIC_SECONDARY_COLOR=#8b5cf6
NEXT_PUBLIC_GRADIENT=from-pink-500 to-purple-600

# Website 2: Couples Connect
NEXT_PUBLIC_PLATFORM_KEY=couplesconnect
NEXT_PUBLIC_PLATFORM_NAME=Couples Connect
NEXT_PUBLIC_PRIMARY_COLOR=#3b82f6
NEXT_PUBLIC_SECONDARY_COLOR=#8b5cf6
NEXT_PUBLIC_GRADIENT=from-blue-500 to-purple-600
```

#### Option B: Code Configuration

Update `src/lib/platform-config.ts`:

```typescript
export const platformConfigs: Record<string, PlatformConfig> = {
  one2onelove: { /* ... */ },
  couplesconnect: {
    platformKey: 'couplesconnect',
    name: 'Couples Connect',
    branding: {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      gradient: 'from-blue-500 to-purple-600',
    },
  },
};
```

### 5. Use Chatbot in Your Website

```tsx
import ChatWidget from '@/components/Chatbot/ChatWidget';

export default function HomePage() {
  return (
    <div>
      <h1>My Relationship Website</h1>
      <ChatWidget platformKey="couplesconnect" />
    </div>
  );
}
```

## Platform Configuration Options

### Branding

```json
{
  "primary_color": "#3b82f6",
  "secondary_color": "#8b5cf6",
  "gradient": "from-blue-500 to-purple-600",
  "logo": "https://example.com/logo.png"
}
```

### Features

Array of feature names available on this platform:

```json
[
  "Love Notes",
  "Date Ideas",
  "Communication Practice",
  "Relationship Goals"
]
```

### Subscription Tiers

```json
{
  "Free": {
    "price": 0,
    "features": ["Basic Notes", "5 Date Ideas"],
    "limits": {"notes": 50}
  },
  "Premium": {
    "price": 19.99,
    "features": ["Unlimited Notes", "Unlimited Dates"],
    "limits": {}
  }
}
```

### Custom System Prompt

You can provide a custom system prompt for each platform:

```sql
UPDATE chatbot_platforms
SET system_prompt = 'You are a relationship assistant for Couples Connect...'
WHERE platform_key = 'couplesconnect';
```

If not provided, the default system prompt will be used with platform name inserted.

## Best Practices

### 1. Knowledge Base Organization

- **Global entries** (`platform_id = NULL`): Shared content like general relationship advice
- **Platform-specific entries**: Features, FAQs, and content unique to each platform

### 2. Feature Naming

Use consistent feature names across platforms for easier management:
- "Love Notes" (not "Love Messages" or "Romantic Notes")
- "Date Ideas" (not "Date Suggestions" or "Activity Ideas")

### 3. Subscription Tiers

Keep tier names consistent or document differences:
- Both platforms can have "Free" and "Premium"
- Or use platform-specific names: "Basis" vs "Starter"

### 4. Testing

Test each platform separately:
```bash
# Test platform 1
curl -X POST ... -d '{"platformKey": "one2onelove", ...}'

# Test platform 2
curl -X POST ... -d '{"platformKey": "couplesconnect", ...}'
```

## Example: Adding a Second Platform

Let's say you want to add "Love Together" as a second platform:

### Step 1: Create Platform

```sql
INSERT INTO chatbot_platforms (
  platform_key, name, domain, branding, mission_statement, is_active
) VALUES (
  'lovetogether',
  'Love Together',
  'lovetogether.com',
  '{"primary_color": "#f59e0b", "secondary_color": "#ef4444", "gradient": "from-orange-500 to-red-500"}'::jsonb,
  'Building stronger relationships through shared experiences and growth.',
  true
);
```

### Step 2: Add Platform-Specific Knowledge

```sql
-- Add features for Love Together
INSERT INTO chatbot_knowledge (content_type, title, content, platform_id, metadata)
SELECT 
  'feature',
  'Date Ideas',
  'Discover amazing date ideas...',
  id,
  '{"language": "en"}'::jsonb
FROM chatbot_platforms
WHERE platform_key = 'lovetogether';
```

### Step 3: Configure Frontend

```env
NEXT_PUBLIC_PLATFORM_KEY=lovetogether
NEXT_PUBLIC_PLATFORM_NAME=Love Together
NEXT_PUBLIC_PRIMARY_COLOR=#f59e0b
NEXT_PUBLIC_SECONDARY_COLOR=#ef4444
```

### Step 4: Deploy

Deploy the website with the new configuration, and the chatbot will automatically use the "Love Together" platform configuration.

## Troubleshooting

### Platform Not Found

If you get "Platform not found" errors:
1. Check `platform_key` spelling
2. Verify `is_active = true`
3. Check RLS policies allow access

### Wrong Branding

If colors/name are wrong:
1. Check environment variables
2. Verify platform config in database
3. Clear browser cache

### Knowledge Base Not Working

If platform-specific knowledge isn't showing:
1. Verify `platform_id` matches platform
2. Check RLS policies
3. Test with NULL `platform_id` for global entries

## API Usage

### Request Format

```json
{
  "message": "How do I send a love note?",
  "userId": "user-id",
  "platformKey": "couplesconnect",
  "language": "en"
}
```

### Response Format

Same as before, but responses will be tailored to the platform's configuration.

## Migration from Single Platform

If you're migrating from a single-platform setup:

1. Run migration: `003_multi_platform_schema.sql`
2. Existing conversations will have `platform_id = NULL` (global)
3. Update existing knowledge base entries to link to platform
4. Add `platformKey` to frontend requests

## Support

For issues or questions:
- Check platform configuration in database
- Verify Edge Function logs
- Test with different `platformKey` values
- Review RLS policies

