# Fix: "No open ports detected" + "Timed Out" on Render

Your app starts (Tomcat on 10000) but Render’s port scan doesn’t see it, then the deploy times out. Do **all three** steps below.

---

## Step 1: Bind to 0.0.0.0 (required)

Render can only reach your app if it listens on **0.0.0.0**, not only localhost.

### Option A – Environment variable on Render (fastest)

In **Render** → your Web Service → **Environment** → add:

| Key              | Value     |
|------------------|-----------|
| `SERVER_ADDRESS` | `0.0.0.0` |

Save and redeploy. No code change needed.

### Option B – In code (already in repo)

In `application-production.yml` you should have:

```yaml
server:
  address: 0.0.0.0
  port: ${PORT:8080}
```

If your **deployed** repo (e.g. medibot-backendend) doesn’t have this file or block, either add it and push, or use Option A.

---

## Step 2: Increase deploy timeout

The app takes ~2 minutes to start. Render’s default deploy timeout is often 90 seconds.

1. **Render** → your Web Service → **Settings** (or **Environment**).
2. Find **Deploy timeout** / **Health check timeout** (under Advanced or Build & Deploy).
3. Set to **300** (5 minutes) or at least **180** (3 minutes).
4. Save.

---

## Step 3: Health check

1. **Health Check Path:** `actuator/health` or `/actuator/health` (no typo).
2. If there is **Initial delay** or **Start command timeout**, set to **120** seconds so Render waits for the app to finish starting before marking the deploy failed.

---

## After that

Click **Manual Deploy** → **Deploy latest commit**. The service should go live and stay up.

**Summary:** Set `SERVER_ADDRESS=0.0.0.0` on Render, increase deploy timeout to 300s, then redeploy.
