# Quick Setup Guide

## 🚀 Get Your App Running in 5 Minutes

### Step 1: Get Supabase Credentials (Required)

EZViet needs Supabase for authentication and database. Here's how to get it:

1. **Go to Supabase**: https://supabase.com
2. **Sign in** (or create a free account - no credit card needed)
3. **Create a new project**:
   - Click "New Project"
   - Choose an organization (or create one)
   - Enter project name (e.g., "ezviet-dev")
   - Set a database password (save this!)
   - Choose a region close to you
   - Click "Create new project"
4. **Wait ~2 minutes** for the project to initialize
5. **Get your API keys**:
   - Go to **Settings** → **API** (in the left sidebar)
   - Copy these values:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Step 2: Configure Environment Variables

Edit `.env.local` and replace the placeholder values with your actual Supabase credentials:

```bash
# Open the file
nano .env.local
# or
code .env.local
```

Replace:
- `https://your-project-id.supabase.co` with your actual Project URL
- `your-anon-key-here` with your anon public key
- `your-service-role-key-here` with your service_role key

### Step 3: Start the Dev Server

**If using Podman:**
```bash
./podman-dev.sh start
```

**If running locally:**
```bash
npm run dev
```

### Step 4: Open in Browser

Visit: **http://localhost:3000**

---

## 🐳 Using Podman (Already Set Up!)

Your Podman dev environment is ready! Just:

1. Add your Supabase credentials to `.env.local`
2. Run: `./podman-dev.sh start`
3. Open: http://localhost:3000

The workspace is mounted, so any changes you make locally are immediately available in the container.

---

## 🔧 Troubleshooting

### "Your project's URL and Key are required"
- Make sure `.env.local` exists and has valid Supabase credentials
- Restart the dev server after editing `.env.local`

### Port 3000 already in use
- Stop other Next.js servers: `lsof -ti:3000 | xargs kill`
- Or change the port in `podman-dev.sh`

### Podman machine not running
```bash
podman machine start
podman pod start ezviet-dev
```

---

## 📚 Next Steps

Once your app is running:
1. Set up your database schema (if needed)
2. Configure authentication providers in Supabase
3. Add your first flashcards!

For more details, see:
- [PODMAN.md](./PODMAN.md) - Podman setup and usage
- [CLAUDE.md](./CLAUDE.md) - Development guidelines
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
