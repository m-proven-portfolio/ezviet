# 🔍 Debugging PKCE Code Verifier Issue

I've added debugging to help identify why the PKCE code verifier cookie isn't being found.

## What to Do

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Clear cookies** for localhost:
   - Application → Cookies → http://127.0.0.1:3000
   - Delete all cookies
4. **Try signing in with Google**
5. **Watch the console** - you should see:
   - `[Supabase Client] Setting PKCE cookie:` - when you click sign in
   - `[Supabase Client] Cookie verification:` - confirming it was set
   - `[auth/callback] Found verifier-related cookies:` - when callback runs

## What We're Looking For

- **If you see "Setting PKCE cookie"** → Cookie is being set on client ✅
- **If you see "Cookie verification: SET"** → Cookie persisted ✅
- **If you see "Found verifier-related cookies"** → Server can read it ✅
- **If you see "No verifier cookies found"** → Cookie isn't reaching server ❌

## Common Issues

1. **Cookies blocked by browser** - Check browser settings
2. **Third-party cookies blocked** - Chrome blocks cross-site cookies
3. **Cookie domain mismatch** - Cookie set for wrong domain
4. **Cookie path mismatch** - Cookie set for wrong path

## Next Steps

After you try signing in, check:
1. Browser console for the debug messages
2. Server logs: `./podman-dev.sh logs`
3. Share what you see in the console

This will help us identify exactly where the cookie is getting lost!
