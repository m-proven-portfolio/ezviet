#!/bin/bash
# Helper script to manage the EZViet Podman dev environment

set -e

POD_NAME="ezviet-dev"
CONTAINER_NAME="ezviet-dev-container"

case "$1" in
  start)
    echo "Starting dev server..."
    echo "Server will be available at: http://localhost:3000"
    # Check if already running
    if podman exec "$CONTAINER_NAME" sh -c "ps aux | grep 'next-server' | grep -v grep" > /dev/null 2>&1; then
      echo "⚠️  Server is already running!"
      echo "Use './podman-dev.sh restart' to restart it"
      exit 0
    fi
    # Start in background, keep it running
    podman exec -d "$CONTAINER_NAME" sh -c "cd /workspace && nohup npm run dev -- -H 0.0.0.0 > /tmp/nextjs.log 2>&1 &"
    echo "✅ Server started in background"
    echo "📝 Logs: podman exec $CONTAINER_NAME tail -f /tmp/nextjs.log"
    sleep 3
    echo "🌐 Try: http://localhost:3000 or http://127.0.0.1:3000"
    ;;
  shell)
    echo "Opening shell in container..."
    podman exec -it "$CONTAINER_NAME" sh
    ;;
  stop)
    echo "Stopping pod..."
    podman pod stop "$POD_NAME"
    ;;
  restart)
    echo "Restarting dev server..."
    podman exec "$CONTAINER_NAME" sh -c "pkill -f 'next dev' || pkill -f 'next-server' || true"
    sleep 2
    podman exec -d "$CONTAINER_NAME" sh -c "cd /workspace && nohup npm run dev -- -H 0.0.0.0 > /tmp/nextjs.log 2>&1 &"
    echo "✅ Server restarted"
    sleep 3
    echo "🌐 Try: http://localhost:3000 or http://127.0.0.1:3000"
    ;;
  restart-pod)
    echo "Restarting entire pod..."
    podman pod restart "$POD_NAME"
    sleep 5
    echo "Starting dev server..."
    podman exec -d "$CONTAINER_NAME" sh -c "cd /workspace && nohup npm run dev -- -H 0.0.0.0 > /tmp/nextjs.log 2>&1 &"
    echo "✅ Pod and server restarted"
    ;;
  status)
    echo "Pod status:"
    podman pod ps
    echo ""
    echo "Container status:"
    podman ps --filter "name=$CONTAINER_NAME"
    ;;
  logs)
    echo "Server logs (Ctrl+C to exit):"
    podman exec "$CONTAINER_NAME" tail -f /tmp/nextjs.log 2>/dev/null || podman logs -f "$CONTAINER_NAME"
    ;;
  *)
    echo "Usage: $0 {start|shell|stop|restart|restart-pod|status|logs}"
    echo ""
    echo "Commands:"
    echo "  start        - Start the Next.js dev server (port 3000) - runs in background"
    echo "  shell        - Open a shell in the container"
    echo "  stop         - Stop the pod (stops server too)"
    echo "  restart      - Restart just the dev server (keeps pod running)"
    echo "  restart-pod  - Restart the entire pod and server"
    echo "  status       - Show pod and container status"
    echo "  logs         - Show server logs (follow mode)"
    exit 1
    ;;
esac
