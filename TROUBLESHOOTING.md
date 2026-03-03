# Troubleshooting

## "A server with the specified hostname could not be found" (Supabase)

If you see errors like:

- `Failed to load resource: A server with the specified hostname could not be found. (token, line 0)`
- `Fetch API cannot load https://XXXX.supabase.co/auth/v1/token... due to access control checks.`

**Cause:** Your Mac (or browser) cannot reach Supabase’s servers. The app never gets to sign-in; the Supabase client fails when it tries to talk to `*.supabase.co`.

**First step – check Supabase is reachable:**

1. **In Terminal:**  
   `curl -sI https://YOUR-PROJECT-ID.supabase.co/rest/v1/`  
   (Use the same host as in `.env.local` → `NEXT_PUBLIC_SUPABASE_URL`.)  
   - If this hangs or says "Could not resolve host", the problem is DNS/network, not the app.

2. **In Safari:** Open `https://supabase.com` in a new tab.  
   - If that doesn’t load, your network or DNS is blocking Supabase.

**Common fixes:**

- **Different network:** Try another Wi‑Fi or a phone hotspot (rules out corporate/school firewall).
- **VPN:** Turn VPN off and test again (some VPNs block or break DNS).
- **DNS:** Use a public DNS (e.g. Cloudflare 1.1.1.1 or Google 8.8.8.8) in System Settings → Network → your connection → DNS.
- **Correct URL:** In `.env.local`, `NEXT_PUBLIC_SUPABASE_URL` must be exactly your project URL from the Supabase dashboard (e.g. `https://xxxx.supabase.co`), with no typo or old project ID.

After the hostname resolves and `curl` (or opening Supabase in Safari) works, reload the app and try sign-in again.

---

## Console errors you can ignore

When loading the app in a browser (especially in Podman), you may see:

- **`Failed to load resource: 404 (lucide-react.js.map)`**  
  Harmless. The dev build references a source map that isn’t served. The app works; you can ignore this.

- **`WebSocket connection to 'ws://localhost:3000/_next/webpack-hmr' failed: The network connection was lost`**  
  Common when the dev server runs in Podman. The page still loads; Hot Module Replacement (HMR) may not work. Try **http://127.0.0.1:3000** instead of **http://localhost:3000**. If the app loads and works, you can ignore these messages.

---

## Server dropped connection / timeout (Podman)

If the page never loads and the browser shows "server dropped connection" or times out:

1. **See why the server died** – Run the dev server in the foreground so you get the crash/error in the terminal:
   ```bash
   ./podman-dev.sh shell
   # inside the container:
   cd /workspace && npm run dev -- -H 0.0.0.0
   ```
   Then open http://127.0.0.1:3000 in the browser. When it drops, the terminal will show the error (e.g. out-of-memory). Exit with `exit`, then fix (e.g. give the container more memory or close other apps).

2. **Use START.sh for a clean start** – After a reboot or if the pod was stopped, run `./START.sh` so the pod and dev server start in the right order. Wait at least 1–2 minutes after "Done!" before opening the app (first compile is slow).

3. **Use the correct login URL** – Open `http://127.0.0.1:3000/login` or `http://localhost:3000/login` (single slash). Avoid `//login` (double slash).

---

## "Safari can't find the server" after Google sign-in (Podman/Docker)

If you complete Google sign-in but then see "Safari can't find the server" (or the page never loads), the app is redirecting the browser to a hostname that only exists inside the container. **Fix:** In `.env.local` add:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use `http://127.0.0.1:3000` if you always open the app at that address. Restart the dev server after changing `.env.local`, then try sign-in again.

---

## ERR_EMPTY_RESPONSE

If you're getting `ERR_EMPTY_RESPONSE` when accessing http://localhost:3000, try these solutions:

## Quick Fixes

### 1. Use 127.0.0.1 instead of localhost
Sometimes browsers have issues with `localhost`. Try:
```
http://127.0.0.1:3000
```

### 2. Clear Browser Cache
- **Chrome/Edge**: Press `Cmd+Shift+Delete` (Mac) or `Ctrl+Shift+Delete` (Windows)
- Select "Cached images and files"
- Clear data for "localhost" or "All time"

### 3. Hard Refresh
- **Mac**: `Cmd+Shift+R`
- **Windows/Linux**: `Ctrl+Shift+R` or `Ctrl+F5`

### 4. Try Incognito/Private Mode
Open the URL in an incognito/private window to rule out extensions:
- **Chrome**: `Cmd+Shift+N` (Mac) or `Ctrl+Shift+N` (Windows)
- **Safari**: `Cmd+Shift+N`
- **Firefox**: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)

### 5. Check if Server is Running
```bash
./podman-dev.sh status
```

If the server isn't running:
```bash
./podman-dev.sh restart
./podman-dev.sh start
```

### 6. Check Browser Console
1. Open Developer Tools (F12 or Cmd+Option+I)
2. Go to the Console tab
3. Look for any JavaScript errors
4. Go to the Network tab and check if requests are failing

### 7. Disable Browser Extensions
Some extensions (ad blockers, privacy tools) can interfere:
- Temporarily disable all extensions
- Try accessing the site again

### 8. Try a Different Browser
Test in Chrome, Firefox, Safari, or Edge to see if it's browser-specific.

## Verify Server is Working

From terminal, test if the server responds:
```bash
curl http://localhost:3000
```

If you see HTML output, the server is working and it's a browser issue.

## Check Podman Port Forwarding

```bash
podman port 096e7d4c6666
```

Should show: `3000/tcp -> 0.0.0.0:3000`

## Restart Everything

If nothing works, restart the pod:
```bash
./podman-dev.sh stop
./podman-dev.sh restart
./podman-dev.sh start
```

Then wait 10-15 seconds for the server to fully start before accessing in browser.
