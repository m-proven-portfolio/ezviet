# 🔧 Fix "Database error saving new user"

You're getting this error because the database trigger that creates a user profile isn't working properly.

## 🎯 Quick Fix

Run this SQL file in Supabase SQL Editor:

**File:** `supabase/migrations/FIX_PROFILE_TRIGGER.sql`

### Steps:

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy the ENTIRE contents of `supabase/migrations/FIX_PROFILE_TRIGGER.sql`
4. Paste into SQL Editor
5. Click **Run**

This will:
- ✅ Create the `name_to_username()` helper function
- ✅ Fix the `handle_new_user()` trigger function
- ✅ Recreate the trigger properly

## 🧪 Test After Fix

1. Restart your dev server: `./podman-dev.sh restart`
2. Try signing in with Google again
3. You should be redirected to `/onboarding` instead of back to login

## 📝 What This Fixes

The error happens because:
- When you sign in with Google, Supabase creates a user in `auth.users`
- A trigger should automatically create a profile in `profiles` table
- The trigger was failing because `name_to_username()` function was missing or had permission issues

This fix ensures everything is set up correctly!
