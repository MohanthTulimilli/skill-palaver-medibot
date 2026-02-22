# Fix Render "Timed Out" / "No open ports detected"

Your app started (Tomcat on port 10000, DB connected) but Render marked the deploy as failed because it took too long or couldn't detect the port in time.

---

## 1. Code change (done): Bind to 0.0.0.0

In **application-production.yml** we added:

```yaml
server:
  address: 0.0.0.0
  port: ${PORT:8080}
```

This makes the app listen on **all interfaces** so Render's proxy can reach it. Commit and push, then redeploy.

---

## 2. On Render: Increase deploy timeout

The app takes ~2 minutes to start (DB + Hibernate). Render's default deploy timeout may be 90 seconds.

1. In **Render Dashboard** → your **Web Service** → **Settings** (or **Environment**).
2. Scroll to **Advanced** (or **Build & Deploy**).
3. Find **"Deploy timeout"** or **"Health check timeout"** and increase it to **300** (5 minutes) or at least **180** (3 minutes).
4. Save and trigger a **Manual Deploy**.

If you don't see "Deploy timeout", check **Settings** → **Build & Deploy** or the service's **Environment** tab for any timeout/health options.

---

## 3. Health check

1. **Health Check Path:** must be **`/actuator/health`** (no leading slash in some UIs).
2. If there is an **"Initial delay"** or **"Health check start delay"**, set it to **120** seconds so Render waits for the app to finish starting before pinging.

---

## 4. Redeploy

After the code change (0.0.0.0) is pushed and timeout is increased:

- Click **Manual Deploy** → **Deploy latest commit**.

The service should stay up after the next successful deploy.
