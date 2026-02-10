# 🗄️ Complete Supabase Setup Guide

This guide walks you through setting up Supabase from scratch for EZViet.

---

## 📋 Prerequisites

- ✅ Supabase project created (you already have this)
- ✅ Credentials added to `.env.local` (you already did this)
- ⚠️ **Now you need:** Database schema, storage buckets, and authentication

---

## 🎯 Step-by-Step Setup

### Step 1: Enable Google OAuth Provider

**Why:** So users can sign in with Google

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/okymawetlthviiqfccbn
2. Click **Authentication** → **Providers** (left sidebar)
3. Find **Google** in the list
4. Click **Enable**
5. You'll need Google OAuth credentials (see "Google OAuth Setup" below)

**For now, you can skip this** if you just want to test the app without login.

---

### Step 2: Run Database Migrations

**Why:** Creates all the tables your app needs (cards, profiles, categories, etc.)

#### Option A: Using Supabase SQL Editor (Easiest)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy and paste each migration file in order (001, 002, 003, etc.)
4. Click **Run** after each one

**Migration files are in:** `supabase/migrations/`

**Start with these essential ones:**
- `001_initial_schema.sql` - Creates categories, cards, card_terms tables
- `002_storage_buckets.sql` - Creates storage buckets
- `008_profiles.sql` - Creates user profiles table
- `010_admin_column.sql` - Adds admin column to profiles

#### Option B: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:
```bash
cd /Users/home-user/Downloads/ezviet-main
npx supabase db push
```

This runs all migrations automatically.

---

### Step 3: Create Storage Buckets

**Why:** To store images, audio files, and user uploads

#### Method 1: Via SQL (Recommended)

Run the migration file: `supabase/migrations/002_storage_buckets.sql`

This creates:
- `cards-images` - For flashcard images
- `cards-audio` - For audio pronunciations

#### Method 2: Via Dashboard

1. Go to **Storage** in Supabase Dashboard
2. Click **New bucket**
3. Create these buckets:

**Bucket 1: `cards-images`**
- Public: ✅ Yes
- File size limit: 5 MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

**Bucket 2: `cards-audio`**
- Public: ✅ Yes
- File size limit: 10 MB
- Allowed MIME types: `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/ogg`

**Bucket 3: `avatars`** (optional, for user profile photos)
- Public: ✅ Yes
- File size limit: 2 MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

---

### Step 4: Set Up Row Level Security (RLS)

**Why:** Security - controls who can read/write data

The migration files include RLS policies, but verify:

1. Go to **Authentication** → **Policies**
2. Check that these tables have policies:
   - `profiles` - Users can read their own profile
   - `cards` - Public read access
   - `card_terms` - Public read access

**Most migrations include RLS setup**, so if you ran them, you're good!

---

### Step 5: Google OAuth Setup (Optional but Recommended)

**Why:** So users can sign in with "Sign in with Google"

#### Part A: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URI:
   ```
   https://okymawetlthviiqfccbn.supabase.co/auth/v1/callback
   ```
7. Copy the **Client ID** and **Client Secret**





#### Part B: Configure in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Click **Google**
3. Enable it
4. Paste your **Client ID** and **Client Secret**
5. Click **Save**

---

## ✅ Quick Setup Checklist

- [ ] Run database migrations (at least 001, 002, 008, 010)
- [ ] Create storage buckets (`cards-images`, `cards-audio`)
- [ ] Enable Google OAuth (optional but recommended)
- [ ] Verify RLS policies are active

---

## 🧪 Test Your Setup

After setup, test:

1. **Database:** Go to **Table Editor** → You should see `categories`, `cards`, `profiles` tables
2. **Storage:** Go to **Storage** → You should see `cards-images` and `cards-audio` buckets
3. **Auth:** Try signing in → Should redirect to Google (if enabled)

---

## 📁 Migration Files Reference

All migrations are in `supabase/migrations/`. Run them in order:

**Essential:**
- `001_initial_schema.sql` - Core tables
- `002_storage_buckets.sql` - Storage setup
- `008_profiles.sql` - User profiles
- `010_admin_column.sql` - Admin functionality

**Optional (add features):**
- `006_card_songs.sql` - Music/karaoke features
- `015_books.sql` - Book reading features
- `028_classrooms.sql` - Classroom features
- `029_vietquest.sql` - Game features

---

## 🆘 Troubleshooting

### "Table doesn't exist" error
**Fix:** Run the migrations! Start with `001_initial_schema.sql`

### "Bucket doesn't exist" error
**Fix:** Create storage buckets (Step 3 above)

### "Provider not enabled" error
**Fix:** Enable Google OAuth in Authentication → Providers

### "Permission denied" error
**Fix:** Check RLS policies are set up correctly

---

## 🚀 Next Steps

After setup:
1. Restart your dev server: `./podman-dev.sh restart`
2. Try signing in with Google
3. Create your first card via `/admin/cards/new`

---

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
