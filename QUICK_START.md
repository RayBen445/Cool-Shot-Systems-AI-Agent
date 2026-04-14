# Quick Start Guide - Database & Authentication

## 1. Set Up Database (5 minutes)

### Go to Supabase Dashboard
1. Visit https://supabase.com and sign in
2. Go to your project > SQL Editor
3. Create two new queries

### Query 1: Create Tables
Copy and run the contents of `scripts/setup_database.sql`:
- Creates profiles, conversations, messages, artifacts, prompts tables
- Enables RLS on all tables
- Sets up access policies
- Creates performance indexes

### Query 2: Create Auto-Profile Trigger
Copy and run the contents of `scripts/create_profile_trigger.sql`:
- When users sign up, profile is auto-created
- Runs with elevated privileges (security definer)

## 2. Test Authentication (2 minutes)

### Create Account
1. Open app at `/register`
2. Enter email, password (8+ chars, uppercase, number)
3. Confirm password
4. Click "Create Account"
5. Confirm email if prompted

### Login
1. Go to `/login`
2. Enter email and password
3. Should redirect to `/chat` automatically
4. If stuck on login, check Supabase dashboard for errors

## 3. Verify Database Setup (1 minute)

### Check Supabase Dashboard
1. Go to Supabase > Tables
2. Should see 5 tables:
   - profiles (with your user record)
   - conversations (empty)
   - messages (empty)
   - artifacts (empty)
   - prompts (empty)

### Check RLS is Active
1. Go to Supabase > Auth > Policies
2. Verify policies exist for each table
3. Each policy should restrict access to `auth.uid()`

## 4. Start Using Database (Code Examples)

### Get Current User
```typescript
import { useAuth } from '@/lib/auth-context'

export default function MyComponent() {
  const { user } = useAuth()
  return <div>{user?.email}</div>
}
```

### Create Conversation
```typescript
import { createConversation } from '@/lib/db/conversations'

const conversation = await createConversation(
  'My New Chat',
  'chat' // mode: 'chat' | 'code' | 'reason' | etc
)
```

### Add Message
```typescript
import { createMessage } from '@/lib/db/messages'

const message = await createMessage(
  conversationId,
  'user', // role: 'user' | 'assistant'
  'Hello, how are you?',
  'chat', // mode
  false // hasArtifact
)
```

### Get All Conversations
```typescript
import { getConversations } from '@/lib/db/conversations'

const conversations = await getConversations()
// Returns only current user's conversations (RLS automatic)
```

### Get Messages
```typescript
import { getMessages } from '@/lib/db/messages'

const messages = await getMessages(conversationId)
```

### Save Artifact
```typescript
import { createArtifact } from '@/lib/db/artifacts'

const artifact = await createArtifact(
  messageId,
  conversationId,
  'code', // type: 'code' | 'document' | 'html' | 'markdown' | 'image'
  'console.log("hello")',
  'My Script', // title
  'javascript' // language
)
```

### Save Prompt Template
```typescript
import { createPrompt } from '@/lib/db/prompts'

const prompt = await createPrompt(
  'Summarize this text',
  'Provide a concise summary of the following text: {text}',
  'custom' // category
)
```

## 5. Integrate into Chat Component

### Example: Save Chat to Database
```typescript
'use client'
import { createConversation, createMessage } from '@/lib/db/conversations'
import { useAuth } from '@/lib/auth-context'

export function ChatComponent() {
  const { user } = useAuth()
  const [conversationId, setConversationId] = useState<string | null>(null)

  const handleNewChat = async () => {
    const conv = await createConversation('New Chat', 'chat')
    setConversationId(conv.id)
  }

  const handleSendMessage = async (text: string) => {
    if (!conversationId) return

    // Save user message
    await createMessage(conversationId, 'user', text, 'chat')

    // Get AI response (from your API)
    const response = await fetchAIResponse(text)

    // Save assistant message
    await createMessage(
      conversationId,
      'assistant',
      response,
      'chat'
    )
  }

  return (
    <div>
      <button onClick={handleNewChat}>New Chat</button>
      {/* Chat UI here */}
    </div>
  )
}
```

## 6. Troubleshooting

### "User not authenticated" error
- Make sure you're logged in at `/login`
- Check that auth session exists in Supabase dashboard

### RLS policy violation error
- Check user_id matches auth.uid() in database
- Verify policy is correctly set in Supabase dashboard
- Make sure you're using server-side client for queries

### Can't create conversation/message
- Verify RLS policies exist in Supabase dashboard
- Check that user is authenticated
- Look for specific error message in console

### Profile not created automatically
- Make sure trigger was created: `create_profile_trigger.sql`
- Check Supabase > Functions for errors
- Try creating profile manually if trigger fails

## Files to Know

- `lib/auth-context.tsx` - How auth works
- `lib/supabase/client.ts` - Browser client setup
- `lib/supabase/server.ts` - Server client setup
- `lib/db/*` - All database operations
- `DATABASE_AND_AUTH.md` - Full documentation
- `SETUP_COMPLETE.md` - Implementation details

## Important Notes

✅ **RLS is automatic** - You don't need to check permissions
✅ **Type safe** - All DB functions are TypeScript
✅ **No user leaks** - RLS prevents seeing other users' data
✅ **Server-side secure** - Sensitive queries use service role key

## Need Help?

1. Check `DATABASE_AND_AUTH.md` for full docs
2. Review examples in `lib/db/` files
3. Check Supabase dashboard for errors
4. Look at chat components for integration examples

Happy coding! 🚀
