================================================================================
  EZVIET - QUICK START AFTER RESTARTING YOUR COMPUTER
================================================================================

AFTER RESTARTING YOUR COMPUTER, RUN THIS ONE COMMAND:

    ./START.sh

That's it! It will:
  ✅ Start Podman machine
  ✅ Start the pod
  ✅ Start the dev server
  ✅ Open your browser to http://127.0.0.1:3000

================================================================================
MANUAL STEPS (if START.sh doesn't work):
================================================================================

1. Start Podman machine:
   podman machine start

2. Go to project directory:
   cd /Users/home-user/Downloads/ezviet-main

3. Start the server:
   ./podman-dev.sh start

4. Open browser:
   open http://127.0.0.1:3000

================================================================================
USEFUL COMMANDS:
================================================================================

Check status:        ./podman-dev.sh status
View logs:           ./podman-dev.sh logs
Restart server:      ./podman-dev.sh restart
Stop everything:     ./podman-dev.sh stop

================================================================================
TROUBLESHOOTING:
================================================================================

If you get ERR_EMPTY_RESPONSE:
  - Use http://127.0.0.1:3000 instead of localhost:3000
  - Run: ./podman-dev.sh restart
  - Wait 10 seconds, then refresh browser

If server won't start:
  - Check: podman machine list (should show "Currently running")
  - Check: podman pod ps (should show "Running")
  - Run: ./podman-dev.sh restart

For more help, see: RESUME.md or TROUBLESHOOTING.md

================================================================================
