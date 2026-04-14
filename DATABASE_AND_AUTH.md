# Database and Authentication Setup

## Overview
Cool-Shot AI uses Supabase for both authentication and database operations. The system is built with Row Level Security (RLS) to ensure data protection.

## Database Schema

### Tables
1. **profiles** - User profile information (auto-created on signup via trigger)
2. **conversations** - Chat conversation threads
3. **messages** - Individual chat messages
4. **artifacts** - Generated code, documents, and other content
5. **prompts** - Saved user prompts

All tables have RLS enabled with user-specific access policies.

## Authentication

### Setup Supabase
1. Environment variables are automatically configured via Vercel
2. Supabase clients are initialized in `lib/supabase/`
3. Authentication flows handle email/password and Google OAuth

### Authentication Flow
- Users sign up/login via `app/login` and `app/register`
- Session is managed via `AuthProvider` context
- Protected routes use `ProtectedPage` wrapper
- Auth callback handles OAuth redirects at `app/auth/callback`

## Database Operations

### Service Files
Database operations are abstracted into service files in `lib/db/`:

```
lib/db/
  ├── conversations.ts   # Conversation CRUD operations
  ├── messages.ts        # Message CRUD operations
  ├── artifacts.ts       # Artifact CRUD operations
  ├── prompts.ts         # Prompt CRUD operations
  └── profiles.ts        # Profile CRUD operations
```

### Usage Example
```typescript
import { createConversation, getMessages } from '@/lib/db/conversations'

// Create a conversation
const conversation = await createConversation('My Chat', 'chat')

// Fetch messages
const messages = await getMessages(conversation.id)
```

## Running Database Setup

### Option 1: Via Supabase Dashboard
1. Go to Supabase Dashboard > SQL Editor
2. Run `scripts/setup_database.sql` to create all tables
3. Run `scripts/create_profile_trigger.sql` to enable auto-profile creation

### Option 2: Using CLI (if configured)
```bash
# Execute setup script
supabase db push scripts/setup_database.sql
```

## Row Level Security (RLS) Policies

### Users table
- Can only view/edit their own profile
- Auto-created on signup via trigger

### Conversations table
- Users can only view their own conversations
- Users can create, update, and delete their own conversations

### Messages table
- Users can only view messages in their own conversations
- Users can insert messages into their conversations

### Artifacts table
- Users can only view/edit/delete their own artifacts
- Artifacts are associated with specific messages and conversations

### Prompts table
- Users can only view/edit/delete their own saved prompts
- Can filter by category (custom, code, research, etc.)

## Environment Variables

Required Supabase environment variables (auto-configured):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for server operations)
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - Auth callback redirect

## Authentication Pages

### `/login`
- Email/password login
- Google OAuth
- Link to register page

### `/register`
- Email/password signup with validation
- Password requirements: 8+ chars, uppercase, number
- Google OAuth
- Link to login page

### `/auth/callback`
- Handles OAuth redirects
- Exchanges code for session
- Redirects to chat or shows error

## Middleware

The `middleware.ts` file handles:
- Session management
- Token refresh on each request
- Cookie setting for authenticated users
- Protected route access control

## Best Practices

1. **Always use server-side clients** for sensitive operations
2. **RLS is enforced** - no need for manual permission checks
3. **Use typed database functions** from `lib/db/` services
4. **Handle auth errors gracefully** with user-friendly messages
5. **Cache user data** using SWR or React Query for better UX

## Troubleshooting

### 503 Firestore errors
If you see 503 errors, it's because Firebase credentials aren't set. This app uses Supabase instead, not Firebase.

### Auth redirects not working
Make sure `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` is set correctly in `.env.development.local`

### RLS policy errors
- Check that user is authenticated (session exists)
- Verify the user_id in the table matches auth.uid()
- Check policy syntax matches your use case

## Next Steps

1. Execute the database setup scripts (see above)
2. Test signup at `/register`
3. Test login at `/login`
4. Start using database services in components
5. Monitor RLS policies in Supabase dashboard
