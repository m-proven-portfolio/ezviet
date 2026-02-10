# 🔧 Fix Missing Database Columns

**Good news:** You're signed in! ✅ But the database is missing some columns.

## 🎯 Quick Fix

Run these migrations in Supabase SQL Editor **in this exact order**:

### Step 1: Add subscription columns
1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy contents of: `supabase/migrations/038_vip_subscription.sql`
4. Paste and click **Run**

### Step 2: Create card_songs table (REQUIRED FIRST!)
1. Click **New Query**
2. Copy contents of: `supabase/migrations/006_card_songs.sql`
3. Paste and click **Run**

### Step 3: Create lrc_contributors table
1. Click **New Query** again
2. Copy contents of: `supabase/migrations/019_lrc_contributions.sql`
3. Paste and click **Run**

**Important:** Run them in order (038 → 006 → 019) because 019 depends on 006!

## ✅ After Running Migrations

1. **Refresh your browser** (hard refresh: Cmd+Shift+R)
2. The errors should disappear
3. You should see your profile loaded correctly

## 📝 What These Migrations Add

- **038_vip_subscription.sql**: Adds `subscription_tier` and `vip_expires_at` columns to `profiles` table
- **019_lrc_contributions.sql**: Creates `lrc_contributors` table for karaoke/LRC features

These are optional features, but the app expects them to exist, so we need to add them.

---

**After running these, refresh your browser and the errors should be gone!**
