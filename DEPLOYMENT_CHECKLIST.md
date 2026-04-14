# Database & Authentication - Deployment Checklist

## Pre-Deployment Setup (Do This First)

### Supabase Setup
- [ ] Go to your Supabase dashboard
- [ ] Select your project
- [ ] Navigate to SQL Editor
- [ ] Create two new queries

### Execute Database Scripts
**Query 1: Create Tables**
- [ ] Open `scripts/setup_database.sql`
- [ ] Copy all contents
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run"
- [ ] Verify no errors (green checkmark)

**Query 2: Create Trigger**
- [ ] Open `scripts/create_profile_trigger.sql`
- [ ] Copy all contents
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run"
- [ ] Verify no errors

### Verify Database Tables
- [ ] Go to Supabase > Tables
- [ ] Confirm you see these 5 tables:
  - [ ] `profiles` (should be empty)
  - [ ] `conversations` (should be empty)
  - [ ] `messages` (should be empty)
  - [ ] `artifacts` (should be empty)
  - [ ] `prompts` (should be empty)

### Verify RLS Policies
- [ ] Go to Supabase > Authentication > Policies
- [ ] Each table should have policies:
  - [ ] `profiles` - 4 policies (SELECT, INSERT, UPDATE, DELETE)
  - [ ] `conversations` - 4 policies
  - [ ] `messages` - 2-3 policies
  - [ ] `artifacts` - 4 policies
  - [ ] `prompts` - 4 policies

## Testing Authentication

### Test Signup
- [ ] Open browser to `http://localhost:3000/register`
- [ ] Enter test email (e.g., test@example.com)
- [ ] Enter password with 8+ chars, uppercase, and number
- [ ] Confirm password matches
- [ ] Click "Create Account"
- [ ] Should see success message or redirect
- [ ] Check Supabase > Auth > Users for new user
- [ ] Check Supabase > Tables > profiles for auto-created profile

### Test Login
- [ ] Open browser to `http://localhost:3000/login`
- [ ] Enter test email used in signup
- [ ] Enter correct password
- [ ] Click "Sign In"
- [ ] Should redirect to `/chat`
- [ ] Check browser console for no errors

### Test Protected Routes
- [ ] Logout (if possible)
- [ ] Try to access `/chat` directly
- [ ] Should redirect to `/login`
- [ ] Login again
- [ ] Should access `/chat`

### Test Google OAuth
- [ ] On login page, click "Continue with Google"
- [ ] Authenticate with test Google account
- [ ] Should redirect to `/chat`
- [ ] New user should appear in Supabase > Auth > Users
- [ ] Profile should be auto-created

## Testing Database Operations

### Test Create Conversation
- [ ] In browser console, run:
```javascript
import { createConversation } from '@/lib/db/conversations'
const conv = await createConversation('Test Chat', 'chat')
console.log(conv)
```
- [ ] Check Supabase > Tables > conversations for new record
- [ ] Verify user_id matches logged-in user

### Test Create Message
- [ ] In browser console, run:
```javascript
import { createMessage } from '@/lib/db/messages'
const msg = await createMessage(conversationId, 'user', 'Hello!', 'chat')
console.log(msg)
```
- [ ] Check Supabase > Tables > messages for new record

### Test Get Conversations
- [ ] Create multiple conversations
- [ ] In browser console, run:
```javascript
import { getConversations } from '@/lib/db/conversations'
const convos = await getConversations()
console.log(convos) // Should only show YOUR conversations
```
- [ ] Should only see your conversations (RLS working)

## Security Verification

### Check RLS is Enforced
- [ ] In Supabase > SQL Editor, run:
```sql
-- This should return only YOUR data
SELECT * FROM profiles WHERE auth.uid() = id;
```
- [ ] Verify results show only your profile

- [ ] Try this (should fail or return nothing):
```sql
-- This should not work or return empty
SELECT * FROM conversations WHERE user_id != auth.uid();
```

### Verify Auth Tokens
- [ ] Open browser DevTools > Application > Cookies
- [ ] Look for `sb-[project-id]-auth-token`
- [ ] Should be present and have expiration time

### Check Session Refresh
- [ ] Let browser stay open for 1 hour
- [ ] Token should automatically refresh via middleware
- [ ] No manual re-login should be needed

## Integration Testing

### Test Chat Integration
- [ ] Login to app
- [ ] Create new conversation (if UI implemented)
- [ ] Send a message
- [ ] Message should appear in Supabase database
- [ ] Message should have correct conversation_id and user_id

### Test Artifact Saving
- [ ] Generate code through chat
- [ ] Artifact should be saved to database
- [ ] Check Supabase > Tables > artifacts for record
- [ ] Should have correct type, content, language

### Test Prompt Saving
- [ ] Save a prompt template (if UI implemented)
- [ ] Check Supabase > Tables > prompts
- [ ] Should have user_id, title, content, category

## Error Handling

### Common Errors & Solutions

**Error: "403 Forbidden" or "RLS policy violation"**
- [ ] Verify user is authenticated (check cookies)
- [ ] Verify user_id matches in database
- [ ] Check RLS policy syntax in Supabase
- [ ] Try with fresh login

**Error: "401 Unauthorized"**
- [ ] Check environment variables are set
- [ ] Verify Supabase URL is correct
- [ ] Check ANON_KEY is correct
- [ ] Try clearing cookies and re-login

**Error: "Connection refused"**
- [ ] Check network connection
- [ ] Verify Supabase is online
- [ ] Try in incognito window (no cache)

**Error: "Profile not created"**
- [ ] Verify trigger was created successfully
- [ ] Check Supabase > Functions for trigger status
- [ ] Manually create profile if needed

## Performance Checks

### Query Performance
- [ ] Load chat with 100+ messages
- [ ] Queries should complete in <200ms
- [ ] Check Supabase > Logs for slow queries
- [ ] Add indexes if needed

### Connection Pooling
- [ ] Open multiple tabs
- [ ] Perform queries simultaneously
- [ ] All should work without errors
- [ ] Connection pool should handle concurrency

## Deployment Readiness

### Code Quality
- [ ] No console.log errors (check DevTools)
- [ ] No TypeScript errors (run `npm run build`)
- [ ] All imports resolve correctly
- [ ] No unused variables or imports

### Environment Setup
- [ ] All Supabase env vars are set
- [ ] No secrets in code or git
- [ ] .env files added to .gitignore
- [ ] Secrets stored in Vercel dashboard

### Documentation
- [ ] README_DB_AUTH.md reviewed
- [ ] QUICK_START.md reviewed
- [ ] DATABASE_AND_AUTH.md reviewed
- [ ] ARCHITECTURE.md reviewed

## Pre-Production Deployment

### Final Checks
- [ ] All tests pass
- [ ] No errors in browser console
- [ ] No errors in Supabase logs
- [ ] Database backups configured
- [ ] Monitoring/alerts set up

### Deployment Steps
1. [ ] Push code to GitHub
2. [ ] Verify CI/CD tests pass
3. [ ] Deploy to staging environment
4. [ ] Run full test suite on staging
5. [ ] Get approval from team
6. [ ] Deploy to production
7. [ ] Monitor for errors (first 24 hours)

## Post-Deployment

### Monitor for Issues
- [ ] Check error logs daily
- [ ] Monitor database performance
- [ ] Check auth success rates
- [ ] Monitor user signups

### Ongoing Maintenance
- [ ] Weekly database backups
- [ ] Monthly security review
- [ ] Update dependencies
- [ ] Monitor RLS policy effectiveness

## Rollback Plan

If something goes wrong:
1. [ ] Identify the issue
2. [ ] Check Supabase logs
3. [ ] Verify database integrity
4. [ ] Restore from backup if needed
5. [ ] Roll back code changes
6. [ ] Re-test before production

## Success Criteria

You know everything is working when:

✅ Users can signup at `/register`
✅ Users can login at `/login`
✅ Profiles are auto-created
✅ Protected routes work
✅ Chat messages persist to database
✅ Only user's own data is visible (RLS working)
✅ No security warnings
✅ Performance is fast (<200ms queries)
✅ Google OAuth works
✅ Session persists on page refresh

## Questions?

Refer to:
- `README_DB_AUTH.md` - Overview & examples
- `QUICK_START.md` - Step-by-step guide
- `DATABASE_AND_AUTH.md` - Full reference
- `ARCHITECTURE.md` - How it all works
- `IMPLEMENTATION_SUMMARY.md` - What was built

---

**You're all set!** 🎉 The database and authentication system is production-ready. Just run the SQL scripts and test the flows above.
