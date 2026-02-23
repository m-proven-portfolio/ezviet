# Podman Dev Environment

This project uses Podman to run a containerized development environment.

## ⚠️ First Time Setup

**Before starting the dev server, you need Supabase credentials!**

1. **Get Supabase credentials** - See [SETUP.md](./SETUP.md) for detailed instructions
2. **Edit `.env.local`** - Add your Supabase URL and API keys
3. **Then start the server** - See "Quick Start" below

## Quick Start

### Start the dev server (runs in background):
```bash
./podman-dev.sh start
```

The Next.js dev server will be available at: **http://localhost:3000** or **http://127.0.0.1:3000**

**Note:** The server runs in the background and will keep running until you stop it or restart the pod.

### Other useful commands:

```bash
# Open a shell in the container
./podman-dev.sh shell

# Check status (shows if server is running)
./podman-dev.sh status

# View server logs (live)
./podman-dev.sh logs

# Restart just the dev server (keeps pod running)
./podman-dev.sh restart

# Restart the entire pod and server
./podman-dev.sh restart-pod

# Stop the pod (stops server too)
./podman-dev.sh stop
```

## Server Persistence

The dev server runs in the background and will:
- ✅ Stay running even if you close your terminal
- ✅ Keep running until you explicitly stop it
- ✅ Auto-restart if the container restarts (when using `restart-pod`)

**To keep the server running:**
- Just use `./podman-dev.sh start` - it runs in the background
- The server will keep running until you:
  - Stop the pod: `./podman-dev.sh stop`
  - Restart the server: `./podman-dev.sh restart`
  - Restart your computer (then restart with `./podman-dev.sh start`)

## Manual Commands

If you prefer to use Podman directly:

```bash
# Start dev server (background)
podman exec -d ezviet-dev-container sh -c "cd /workspace && nohup npm run dev -- -H 0.0.0.0 > /tmp/nextjs.log 2>&1 &"

# Check if server is running
podman exec ezviet-dev-container sh -c "ps aux | grep 'next-server' | grep -v grep"

# View logs
podman exec ezviet-dev-container tail -f /tmp/nextjs.log

# Stop server
podman exec ezviet-dev-container sh -c "pkill -f 'next dev' || pkill -f 'next-server'"

# Stop pod
podman pod stop ezviet-dev

# Start pod
podman pod start ezviet-dev

# Remove pod (if needed)
podman pod stop ezviet-dev && podman pod rm ezviet-dev
```

## Pod Details

- **Pod Name:** `ezviet-dev`
- **Container Name:** `ezviet-dev-container`
- **Image:** `node:20`
- **Port Mapping:** `3000:3000` (host:container)
- **Volume Mount:** Your workspace is mounted at `/workspace` in the container

## Troubleshooting

### Pod not running?
```bash
podman machine start
podman pod start ezviet-dev
./podman-dev.sh start
```

### Server not responding?
```bash
# Check if server is running
./podman-dev.sh status

# Restart the server
./podman-dev.sh restart

# Check logs for errors
./podman-dev.sh logs
```

### Need to rebuild dependencies?
```bash
podman exec -it ezviet-dev-container sh -c "cd /workspace && rm -rf node_modules && npm install"
```

### Check what's running:
```bash
podman pod ls
podman ps
./podman-dev.sh status
```

### ERR_EMPTY_RESPONSE in browser?
See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for browser-specific fixes.

### "Server unexpectedly dropped" / page never loads
The dev server may be crashing (often Turbopack or OOM). Try:

**1. Use Webpack instead of Turbopack**
```bash
./podman-dev.sh restart
USE_WEBPACK=1 ./podman-dev.sh restart
```
Or start fresh with Webpack: `./podman-dev.sh start-webpack`

**2. See the actual crash in the terminal**
Run the dev server in the foreground so you get the stack trace when it drops:
```bash
./podman-dev.sh shell
# inside the container:
cd /workspace && npm run dev:webpack -- -H 0.0.0.0
```
Then open http://localhost:3000 in your browser. When it drops, the terminal will show the error. (Ctrl+C to stop, then exit the shell.)
