# Database Schema & Migrations

This folder contains the database schema definitions and migration files for ExamPrep.

## Structure

```
db/
├── schema.ts              # TypeScript schema definition (source of truth)
├── seed.ts                # Sample data for development/testing
├── migrations/
│   ├── 001_initial_schema.sql        # PostgreSQL/Supabase migration
│   └── 001_initial_schema.sqlite.sql # SQLite migration
└── README.md
```

## Schema Overview

### Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts and profiles |
| `questions` | Both MCQ and SAQ questions |
| `mcq_options` | Multiple choice options for MCQ questions |
| `saq_answers` | Community-submitted answers for SAQ |
| `votes` | Tracks user votes on answers |
| `user_history` | Practice session history |

### Entity Relationship

```
users ──┬── votes ──── questions ──┬── mcq_options
        │                          │
        └── user_history ──────────┴── saq_answers
```

## Commands

### SQLite (Development)

```bash
# Apply migrations
npm run db:migrate

# Seed with sample data
npm run db:seed

# Reset database (delete and reseed)
npm run db:reset
```

### Supabase (Production)

1. Copy the migration SQL to Supabase SQL Editor
2. Or use Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Adding New Migrations

1. Create a new migration file with incremented number:
   - `002_add_feature.sql` (for Supabase)
   - `002_add_feature.sqlite.sql` (for SQLite)

2. Update `schema.ts` to reflect the changes

3. Run migrations:
   ```bash
   npm run db:migrate
   ```

## Environment Configuration

Set the data provider in your environment:

```bash
# .env.local
NEXT_PUBLIC_DATA_PROVIDER=sqlite  # or "supabase"

# For Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Schema Types

Import schema types for type safety:

```typescript
import { SchemaTypes } from "@/db/schema";

type User = SchemaTypes["users"];
type Question = SchemaTypes["questions"];
```

