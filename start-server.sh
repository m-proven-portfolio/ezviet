#!/bin/sh
# Auto-start script for Next.js dev server in Podman container
# This keeps the server running persistently

cd /workspace

# Function to start the server
start_server() {
  echo "Starting Next.js dev server..."
  npm run dev -- -H 0.0.0.0
}

# If server dies, restart it (with a small delay to avoid rapid restarts)
while true; do
  start_server
  echo "Server exited. Restarting in 2 seconds..."
  sleep 2
done
