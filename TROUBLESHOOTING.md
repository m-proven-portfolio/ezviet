# Troubleshooting ERR_EMPTY_RESPONSE

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
