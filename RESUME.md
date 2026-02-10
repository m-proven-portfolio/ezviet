# 🚀 Quick Start Guide - Resume Your Work

**Last Updated:** February 9, 2026

This guide helps you quickly get back to where you left off after restarting your computer.

---

## ✅ What's Already Set Up

- ✅ Podman machine initialized and configured
- ✅ Pod `ezviet-dev` created with port 3000 mapped
- ✅ Node.js container with all dependencies installed
- ✅ Supabase credentials configured in `.env.local`
- ✅ Helper scripts created (`podman-dev.sh`)

---

## 🎯 Quick Start (3 Steps)

### Step 1: Start Podman Machine
```bash
podman machine start
```

Wait ~10 seconds for it to fully start. You'll see it's running when you see:
```
podman-machine-default*  applehv     ...  Currently running
```

### Step 2: Start the Pod and Server
```bash
cd /Users/home-user/Downloads/ezviet-main
./podman-dev.sh start
```

This will:
- Start the pod (if not running)
- Start the Next.js dev server in the background
- Make it available at http://127.0.0.1:3000

### Step 3: Open in Browser
```bash
open http://127.0.0.1:3000
```

Or manually open: **http://127.0.0.1:3000** in your browser.

---

## 📋 Useful Commands

### Check Everything is Running
```bash
# Check pod status
./podman-dev.sh status

# Check if server is running
podman exec ezviet-dev-container sh -c "ps aux | grep 'next-server' | grep -v grep"
```

### View Server Logs
```bash
./podman-dev.sh logs
```

### Restart Server (after code changes)
```bash
./podman-dev.sh restart
```

### Stop Everything
```bash
./podman-dev.sh stop
```

---

## 🔧 Troubleshooting

### "Cannot connect to Podman"
**Fix:** Start the Podman machine:
```bash
podman machine start
```

### "Server not responding" or ERR_EMPTY_RESPONSE
**Fix:** Restart the server:
```bash
./podman-dev.sh restart
```

Wait 10-15 seconds, then try the browser again.

**Alternative:** Use `http://127.0.0.1:3000` instead of `localhost:3000`

### "Pod not running"
**Fix:** Start the pod:
```bash
podman pod start ezviet-dev
./podman-dev.sh start
```

### Server keeps stopping
**Fix:** Make sure you're using the helper script:
```bash
./podman-dev.sh start
```

This runs it in the background with `nohup` so it persists.

---

## 📁 Important Files

- **`.env.local`** - Contains your Supabase credentials (already configured)
- **`podman-dev.sh`** - Helper script for managing the dev environment
- **`PODMAN.md`** - Full Podman documentation
- **`SETUP.md`** - Initial setup instructions
- **`TROUBLESHOOTING.md`** - Browser-specific troubleshooting

---

## 🎨 What You Should See

When everything is working, you'll see:
- **Browser:** EZViet homepage with Vietnamese flag 🇻🇳
- **Terminal:** Server logs showing "Ready" status
- **Status:** `next-server` process running in the container

---

## 🔄 Complete Restart Sequence

If something isn't working, run this complete sequence:

```bash
# 1. Start Podman machine
podman machine start

# 2. Wait a few seconds, then start pod
podman pod start ezviet-dev

# 3. Start the dev server
cd /Users/home-user/Downloads/ezviet-main
./podman-dev.sh start

# 4. Wait 10 seconds for server to start
sleep 10

# 5. Open browser
open http://127.0.0.1:3000

# 6. Verify it's working
curl http://127.0.0.1:3000 | head -5
```

---

## 💡 Pro Tips

1. **Always use `127.0.0.1` instead of `localhost`** - More reliable with Podman
2. **Server runs in background** - You can close your terminal and it keeps running
3. **Hot reload works** - Changes to code automatically reload in browser
4. **Check logs if stuck** - `./podman-dev.sh logs` shows what's happening

---

## 🆘 Still Having Issues?

1. Check Podman machine is running: `podman machine list`
2. Check pod is running: `podman pod ps`
3. Check server process: `podman exec ezviet-dev-container sh -c "ps aux | grep next-server"`
4. View logs: `./podman-dev.sh logs`
5. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for browser-specific issues

---

## 📝 Summary

**To resume work:**
1. `podman machine start`
2. `cd /Users/home-user/Downloads/ezviet-main && ./podman-dev.sh start`
3. `open http://127.0.0.1:3000`

**That's it!** The server will keep running until you stop it or restart your computer.
