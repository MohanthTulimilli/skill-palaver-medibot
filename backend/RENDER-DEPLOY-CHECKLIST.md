# Render deploy – final checklist

Use this after the code changes so the backend deploys and stays up.

---

## Code changes (already done)

1. **Dockerfile** – `ENV SERVER_ADDRESS=0.0.0.0` so the app listens on all interfaces and Render can detect the port.
2. **application-production.yml** – `server.address: 0.0.0.0` and `server.port: ${PORT:8080}`.

---

## 1. Push and deploy

```bash
cd backend
git add Dockerfile src/main/resources/application-production.yml
git commit -m "fix: bind to 0.0.0.0 for Render health check"
git push origin main
```

Render will redeploy from the new commit.

---

## 2. Render dashboard

Confirm these in your **Web Service**:

| Where | What to set |
|-------|------------------|
| **Environment** | `SERVER_ADDRESS` = `0.0.0.0` (optional; already in Dockerfile) |
| **Environment** | `SPRING_PROFILES_ACTIVE` = `production` |
| **Environment** | `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS` |
| **Settings → Health Check** | **Health Check Path** = `actuator/health` or `/actuator/health` |

No need to change deploy timeout; Render allows enough time. The important part is the app binding to `0.0.0.0` so the health check can reach it.

---

## 3. After deploy

- Wait 2–3 minutes for the app to start and the health check to pass.
- Open `https://medibot-backendend.onrender.com/actuator/health` – you should see `{"status":"UP"}`.
- Then try `https://medibot-backendend.onrender.com/api/auth/login` (e.g. POST with JSON body).

If the health check still fails, check **Logs** for errors and confirm all env vars (especially DB) are set.
