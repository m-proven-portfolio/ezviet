# Get localhost:3000 Loading Again

Run these in order in your terminal (from the project folder).

---

## If you use Podman

### 1. Start Podman and the pod
```bash
cd /Users/home-user/Downloads/ezviet-main

podman machine start
# wait a few seconds

podman pod start ezviet-dev
# if you see "no such pod", the pod was never created — use the one-command startup instead (step 3)
```

### 2. Start the dev server (Webpack — more stable than Turbopack)
```bash
./podman-dev.sh start-webpack
```
If that says the container isn’t running, use the full startup (step 3).

### 3. One-command full startup (if step 1 or 2 failed)
```bash
./START.sh
```
Then restart the server with Webpack so it’s stable:
```bash
USE_WEBPACK=1 ./podman-dev.sh restart
```

### 4. Check that something is listening on 3000
```bash
./podman-dev.sh status
```
You should see the pod and container **Running** and port **3000** mapped.

### 5. Wait, then open the site
- Wait **1–2 minutes** after starting (first compile is slow).
- Open: **http://localhost:3000** or **http://127.0.0.1:3000**

### 6. If it still doesn’t load — see what’s wrong
```bash
./podman-dev.sh logs
```
Leave this running and refresh the browser. Look for red errors or “Error: …” in the output.

---

## If you don’t use Podman (run Next.js on your Mac)

From the project folder:

```bash
cd /Users/home-user/Downloads/ezviet-main
npm install
npm run dev
```

Wait for “Ready” or “compiled”, then open **http://localhost:3000**.

---

## Quick checklist

- [ ] Podman machine is running (`podman machine start`)
- [ ] Pod is running (`podman pod start ezviet-dev` or `./START.sh`)
- [ ] Dev server was started (`./podman-dev.sh start` or `./podman-dev.sh restart`)
- [ ] Waited 1–2 minutes after starting
- [ ] Using **http://localhost:3000** or **http://127.0.0.1:3000** in the browser
