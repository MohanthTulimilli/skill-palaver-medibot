# Deployment Checklist – Frontend & Backend

Use this to ensure frontend and backend work together after deployment.

---

## Frontend (Vercel)

| Item | Value |
|------|--------|
| **VITE_API_URL** | `https://medibot-backendend-1.onrender.com` (no trailing slash) |

- Set in **Vercel** → Project → **Settings** → **Environment Variables** for **Production**
- Also added in `frontend/.env.production` so local production builds use it
- **Redeploy** the frontend after changing (VITE_* vars are used at build time)

---

## Backend (Render)

| Env var | Value |
|---------|--------|
| `SPRING_PROFILES_ACTIVE` | `production` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://dpg-d6b8maogjchc73afijl0-a:5432/medibot_zi55` |
| `SPRING_DATASOURCE_USERNAME` | `medibot_zi55_user` |
| `SPRING_DATASOURCE_PASSWORD` | *(from Render Postgres)* |
| `JWT_SECRET` | *(your secret)* |
| `CORS_ALLOWED_ORIGINS` | `https://medibots-health-frontend.vercel.app` |
| `SERVER_ADDRESS` | `0.0.0.0` |

---

## Quick check

1. **Backend:** Open `https://medibot-backendend-1.onrender.com/actuator/health` → `{"status":"UP"}` (first load may take 30–60s on free tier)
2. **Frontend:** Open your Vercel URL → Sign up / Login → should call Render backend, no localhost errors
3. **CORS:** If you get CORS errors, ensure `CORS_ALLOWED_ORIGINS` on Render matches your frontend URL exactly (no trailing slash)

4. **Free tier spin-down:** On Render free tier, the backend sleeps when idle. The **first request** after sleep can take **30–60 seconds** to respond. Wait or retry.
