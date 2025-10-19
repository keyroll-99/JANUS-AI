# Supabase Configuration

This directory contains Supabase client configuration and TypeScript types.

## Files

- **`config.ts`** - Main application configuration including Supabase credentials
- **`supabase.ts`** - Supabase client instances (regular and admin)
- **`database.types.ts`** - Auto-generated TypeScript types from Supabase schema

## Setup

1. Copy `.env.example` to `.env` in the backend root directory
2. Fill in your Supabase credentials:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Anonymous/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (keep secret!)

## Usage

### Regular Client (with RLS)

Use for operations that should respect Row Level Security:

```typescript
import { supabase } from '@/shared/config/supabase';

// Example: Query data with RLS
const { data, error } = await supabase
  .from('portfolios')
  .select('*')
  .eq('user_id', userId);
```

### Admin Client (bypass RLS)

Use for server-side operations that need full access:

```typescript
import { supabaseAdmin } from '@/shared/config/supabase';

// Example: Admin operation bypassing RLS
const { data, error } = await supabaseAdmin
  .from('portfolios')
  .select('*');
```

⚠️ **Warning**: Only use `supabaseAdmin` for trusted server-side operations!

## Regenerating Types

After making changes to your Supabase schema, regenerate types:

```bash
npm run types:generate
```

This command connects to your local Supabase instance and generates TypeScript types based on your database schema.

## Local Development

Make sure your local Supabase instance is running:

```bash
npx supabase start
```

The types generation command uses the local instance by default (port 54322).
