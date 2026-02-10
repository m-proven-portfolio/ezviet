#!/bin/bash
# One-command startup script for EZViet dev environment
# Run this after restarting your computer

set -e

echo "🚀 Starting EZViet Dev Environment..."
echo ""

# Step 1: Start Podman machine
echo "1️⃣  Starting Podman machine..."
podman machine start 2>/dev/null || echo "   Podman machine already running"
sleep 3

# Step 2: Start pod
echo "2️⃣  Starting pod..."
podman pod start ezviet-dev 2>/dev/null || echo "   Pod already running"
sleep 2

# Step 3: Start dev server
echo "3️⃣  Starting dev server..."
cd "$(dirname "$0")"
./podman-dev.sh start

# Step 4: Wait for server to be ready
echo ""
echo "⏳ Waiting for server to start..."
sleep 10

# Step 5: Check status
echo ""
echo "📊 Status check:"
./podman-dev.sh status

# Step 6: Open browser
echo ""
echo "🌐 Opening browser..."
open http://127.0.0.1:3000

echo ""
echo "✅ Done! Your app should be opening in the browser."
echo ""
echo "📝 Useful commands:"
echo "   ./podman-dev.sh status  - Check if server is running"
echo "   ./podman-dev.sh logs    - View server logs"
echo "   ./podman-dev.sh restart - Restart the server"
echo "   ./podman-dev.sh stop    - Stop everything"
echo ""
