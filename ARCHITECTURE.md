# Cool-Shot AI - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js 16)                       │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Pages & Components                           │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ • app/page.tsx (Landing)                                       │ │
│  │ • app/login/page.tsx (Login)                                   │ │
│  │ • app/register/page.tsx (Register)                             │ │
│  │ • app/chat/page.tsx (Protected Chat)                           │ │
│  │ • components/chat/* (Chat UI)                                  │ │
│  │ • components/landing/* (Landing UI)                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              ↓                                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              Middleware & Auth Layer                            │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ • middleware.ts (Session refresh on each request)             │ │
│  │ • lib/auth-context.tsx (Auth provider)                         │ │
│  │ • lib/protected-page.tsx (Route protection)                    │ │
│  │ • lib/supabase/client.ts (Browser client)                      │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              ↓                                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │            Service Layer (lib/db/)                              │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ • conversations.ts (Conversation CRUD)                         │ │
│  │ • messages.ts (Message CRUD)                                   │ │
│  │ • artifacts.ts (Artifact CRUD)                                 │ │
│  │ • prompts.ts (Prompt CRUD)                                     │ │
│  │ • profiles.ts (Profile CRUD)                                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              ↓                                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │            API Layer (lib/api.ts)                               │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ • streamChatMessage() (Streaming chat)                         │ │
│  │ • generateImage() (Image generation)                           │ │
│  │ • API routes for backend communication                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Backend APIs                                    │
│                                                                       │
│  ┌──────────────────────┐              ┌──────────────────────────┐ │
│  │   Auth API            │              │  Chat/AI API             │ │
│  │  (Supabase)           │              │  (Python/FastAPI)        │ │
│  ├──────────────────────┤              ├──────────────────────────┤ │
│  │ • signUp              │              │ • POST /chat/stream     │ │
│  │ • signIn              │              │ • GET /imagine          │ │
│  │ • OAuth               │              │ • POST /search          │ │
│  │ • Session Mgmt        │              │ • POST /artifacts       │ │
│  └──────────────────────┘              └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                         ↓                         ↓
        ┌────────────────────────┐    ┌────────────────────────┐
        │   Supabase Database     │    │   AI Models             │
        │                         │    │                        │
        ├────────────────────────┤    ├────────────────────────┤
        │ • PostgreSQL            │    │ • Phi-4 (Local)        │
        │ • Row Level Security    │    │ • Image Generation     │
        │ • Auth Service          │    │ • Web Search           │
        │ • Storage               │    │                        │
        │                         │    │                        │
        │ Tables:                 │    │                        │
        │ • profiles              │    │                        │
        │ • conversations         │    │                        │
        │ • messages              │    │                        │
        │ • artifacts             │    │                        │
        │ • prompts               │    │                        │
        └────────────────────────┘    └────────────────────────┘
```

## Data Flow

### Authentication Flow
```
User                Browser                  Supabase
 │                    │                         │
 ├─ Register ────────>│                         │
 │                    ├─ signUp ───────────────>│
 │                    │                         │
 │                    │<─ Session ─────────────┤
 │                    │                         │
 │<─ Redirect ────────┤                         │
 │  (to /chat)        │                         │
```

### Chat Message Flow
```
User Input              Frontend                Backend               Database
    │                      │                        │                    │
    ├─ Type message ──────>│                        │                    │
    │                      ├─ Save to state         │                    │
    │                      ├─ Show optimistically   │                    │
    │                      ├─ POST /chat/stream ───>│                    │
    │                      │                        ├─ Generate response  │
    │                      │<─ Stream tokens ───────┤                    │
    │                      ├─ Update UI             │                    │
    │                      ├─ Save Message ─────────────────────────────>│
    │                      │                        │                    │
    │<─ Message visible ───┤                        │                    │
```

### Database Access Pattern
```
Component                  Service Layer           RLS Policy         Database
   │                           │                        │                │
   ├─ createMessage ────────────>│                       │                │
   │                           ├─ Build query           │                │
   │                           ├─ Include user_id       │                │
   │                           ├─ Query with RLS ──────>│                │
   │                           │                        ├─ Check auth.uid()
   │                           │                        ├─ Validate policy
   │                           │                        ├─ Execute <─────>│
   │                           │<─ Return data ─────────┤                │
   │<─ Message object ──────────┤                       │                │
```

## Authentication Architecture

```
┌────────────────────────────────────────────────────────┐
│                    Request                             │
└────────────────┬─────────────────────────────────────┘
                 ↓
        ┌────────────────────┐
        │ middleware.ts      │
        ├────────────────────┤
        │ • Check cookie     │
        │ • Refresh token    │
        │ • Set auth header  │
        │ • Allow/Deny       │
        └────────┬───────────┘
                 ↓
        ┌────────────────────┐
        │ Protected Pages    │
        ├────────────────────┤
        │ • Check user       │
        │ • Redirect if not  │
        │ • Render if yes    │
        └────────┬───────────┘
                 ↓
        ┌────────────────────┐
        │ Components         │
        ├────────────────────┤
        │ • useAuth hook     │
        │ • Access user data │
        │ • Call services    │
        └────────┬───────────┘
                 ↓
        ┌────────────────────┐
        │ Service Layer      │
        ├────────────────────┤
        │ • Supabase client  │
        │ • Add user_id      │
        │ • Query database   │
        └────────┬───────────┘
                 ↓
        ┌────────────────────┐
        │ Supabase           │
        ├────────────────────┤
        │ • Verify auth.uid()│
        │ • Check RLS policy │
        │ • Return data      │
        └────────────────────┘
```

## File Organization

```
src/
├── app/
│   ├── (public routes)
│   │   ├── page.tsx (Landing)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── auth/
│   │       ├── callback/route.ts
│   │       └── error/page.tsx
│   │
│   ├── (protected routes)
│   │   ├── chat/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx (Protected)
│   │   └── layout.tsx (Wraps with AuthProvider)
│   │
│   └── globals.css (Design tokens)
│
├── lib/
│   ├── auth-context.tsx (Auth provider)
│   ├── protected-page.tsx (Route protection)
│   ├── firebase.ts (Legacy - can remove)
│   ├── utils.ts (Helper functions)
│   ├── api.ts (API client)
│   │
│   ├── supabase/
│   │   ├── client.ts (Browser client)
│   │   ├── server.ts (Server client)
│   │   └── middleware.ts (Auth middleware)
│   │
│   └── db/ (Database services)
│       ├── conversations.ts
│       ├── messages.ts
│       ├── artifacts.ts
│       ├── prompts.ts
│       └── profiles.ts
│
├── components/
│   ├── chat/
│   │   ├── chat-header.tsx
│   │   ├── chat-sidebar.tsx
│   │   ├── chat-messages.tsx
│   │   ├── chat-input.tsx
│   │   ├── mode-selector.tsx
│   │   └── artifact-panel.tsx
│   │
│   └── landing/
│       ├── hero-section.tsx
│       ├── feature-card.tsx
│       ├── mode-showcase.tsx
│       └── cta-section.tsx
│
├── middleware.ts (Session refresh)
├── package.json (Dependencies)
├── tsconfig.json (TypeScript config)
└── next.config.js (Next.js config)

scripts/
├── setup_database.sql (Create tables + RLS)
└── create_profile_trigger.sql (Auto-profile)
```

## Dependencies

### Authentication & Database
- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - Server-side rendering support

### Frontend
- `next` - React framework
- `react`, `react-dom` - UI library
- `framer-motion` - Animations
- `lucide-react` - Icons
- `react-markdown` - Markdown rendering
- `react-syntax-highlighter` - Code highlighting
- `tailwindcss` - Styling

### Utilities
- `swr` - Data fetching
- `clsx` - Class names
- `tailwind-merge` - CSS merging

## Performance Considerations

### Database Indexes
- `conversations_user_id_idx` - Fast user lookup
- `conversations_created_at_idx` - Sort by date
- `messages_conversation_id_idx` - Fetch messages
- `messages_created_at_idx` - Chronological order
- `artifacts_user_id_idx` - User artifacts
- `prompts_category_idx` - Filter by category

### Caching Strategy
- Supabase connection pooling
- Client-side state with React
- SWR for data fetching
- Message history in memory

### Network Optimization
- Streaming responses
- Lazy loading components
- Code splitting by route

## Security Layers

1. **Authentication** - Supabase handles cryptography
2. **RLS Policies** - Database enforces per-row access
3. **Environment Variables** - Secrets never exposed
4. **Session Tokens** - HTTP-only cookies
5. **Type Safety** - TypeScript catches errors
6. **Middleware** - Token refresh before stale
7. **Protected Routes** - Unauthenticated users redirected

This architecture ensures:
- ✅ No data leaks between users
- ✅ Type-safe operations
- ✅ Fast performance
- ✅ Easy to scale
- ✅ Production-ready security
