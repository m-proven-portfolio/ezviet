# 🔐 Enable Google OAuth - Step by Step

You're getting the error because Google OAuth isn't enabled in Supabase yet.

---

## 🎯 Quick Steps

### Step 1: Get Google OAuth Credentials

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select a Project:**
   - Click the project dropdown at the top
   - Click "New Project" (or select existing)
   - Name it something like "EZViet" or "My App"
   - Click "Create"

3. **Enable Google+ API:**
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" or "Google Identity"
   - Click on it and click **Enable**

4. **Create OAuth Credentials:**
   - Go to **APIs & Services** → **Credentials**
   - Click **+ Create Credentials** → **OAuth client ID**
   - If prompted, configure OAuth consent screen first:
     - User Type: **External** (unless you have Google Workspace)
     - App name: **EZViet** (or your app name)
     - User support email: Your email
     - Developer contact: Your email
     - Click **Save and Continue** through the steps
   - Back at Credentials, click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: **EZViet Dev** (or any name)
   - **Authorized redirect URIs:** Add this EXACT URL:
     ```
     https://okymawetlthviiqfccbn.supabase.co/auth/v1/callback
     ```
   - Click **Create**
   - **Copy the Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
   - **Copy the Client Secret** (looks like: `GOCSPX-xxxxx`)

---

### Step 2: Enable Google in Supabase

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/okymawetlthviiqfccbn
   - Click **Authentication** in the left sidebar
   - Click **Providers**

2. **Enable Google:**
   - Find **Google** in the list
   - Click on it
   - Toggle **Enable Google provider** to ON
   - Paste your **Client ID** from Step 1
   - Paste your **Client Secret** from Step 1
   - Click **Save**

---

### Step 3: Test It

1. Go back to your app: http://127.0.0.1:3000
2. Click "Sign in with Google"
3. You should be redirected to Google to sign in!

---

## ⚠️ Important Notes

- **Redirect URI must be EXACT:** 
  ```
  https://okymawetlthviiqfccbn.supabase.co/auth/v1/callback
  ```
  No trailing slash, no typos!

- **Keep credentials secret:** Never commit Client Secret to git

- **For localhost testing:** The redirect URI above works for both localhost and production

---

## 🆘 Troubleshooting

### "Redirect URI mismatch"
- Make sure the redirect URI in Google Cloud Console matches EXACTLY:
  `https://okymawetlthviiqfccbn.supabase.co/auth/v1/callback`

### "Provider not enabled"
- Make sure you clicked **Save** in Supabase after enabling Google
- Refresh the Supabase dashboard page

### Still getting errors?
- Check that OAuth consent screen is configured
- Make sure Google+ API is enabled
- Verify Client ID and Secret are correct (no extra spaces)

---

## ✅ That's It!

Once enabled, users can sign in with Google and you'll be able to:
- Create cards
- Access admin features
- Track user progress
- All the authenticated features!
