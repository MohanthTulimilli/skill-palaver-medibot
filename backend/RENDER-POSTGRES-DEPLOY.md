# Deploy Backend on Render with PostgreSQL

The backend is configured for **PostgreSQL**. Use Render's **Postgres** database and **Web Service** (Docker).

---

## Step 1: Create Postgres on Render

1. In **Render Dashboard** → **New +** → **Postgres**.
2. **Name:** e.g. `medibots-db`.
3. **Database:** `medibot` (or leave default).
4. **Region:** Same as your Web Service (e.g. Singapore).
5. **Plan:** Free or paid.
6. Click **Create Database**.
7. When ready, open the database → **Info** or **Connection** tab. You will see:
   - **Internal Database URL** (use this for the Web Service on Render).
   - Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE` or similar.

**JDBC URL for Spring:**  
Render often shows a URL like `postgresql://...`. For Spring use the **JDBC** form:

- If Internal URL is: `postgresql://user:password@hostname/database`
- Then JDBC URL is: `jdbc:postgresql://hostname:5432/database`

Copy **host**, **port** (usually 5432), **database name**, **user**, **password** and build:

`jdbc:postgresql://HOST:PORT/DATABASE`

---

## Step 2: Create Web Service (backend)

1. **New +** → **Web Service**.
2. Connect repo (e.g. `vineethnaik/medibot-backendend`).
3. **Root Directory:** leave blank if repo root has `pom.xml` and `Dockerfile`; otherwise set to `backend`.
4. **Runtime:** Docker.
5. **Region:** Same as Postgres.

---

## Step 3: Environment variables

In the Web Service → **Environment**, add:

| Key | Value |
|-----|--------|
| `SPRING_PROFILES_ACTIVE` | `production` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://dpg-d6b8maogjchc73afijl0-a:5432/medibot_zi55` |
| `SPRING_DATASOURCE_USERNAME` | `medibot_zi55_user` |
| `SPRING_DATASOURCE_PASSWORD` | *(copy from Render Postgres Info/Connection tab)* |
| `JWT_SECRET` | Long random string (e.g. 32+ chars base64) |
| `CORS_ALLOWED_ORIGINS` | `https://medibots-health-frontend.vercel.app` |
| `SERVER_ADDRESS` | `0.0.0.0` |

**Your Render Postgres:** Host `dpg-d6b8maogjchc73afijl0-a`, Port `5432`, Database `medibot_zi55`. Use `jdbc:postgresql://` prefix (not `postgresql://`).

**Linking Postgres to the Web Service (optional):**  
If you use **Render’s “Connect”** from the Postgres service to the Web Service, Render can inject `DATABASE_URL`. That is usually in the form `postgresql://user:pass@host:port/db`. Set:

- `SPRING_DATASOURCE_URL` = `jdbc:postgresql://HOST:PORT/DATABASE` (convert from `postgresql://` to `jdbc:postgresql://` and use host, port, database from the URL).
- Or use a **fromDatabase** reference in Blueprint; for manual setup, copy the values and set the three `SPRING_DATASOURCE_*` vars as above.

---

## Step 4: Build and health check

- **Docker:** Build context and Dockerfile path as per your repo (e.g. root or `backend/`).
- **Health Check Path:** `/actuator/health`.

---

## Step 5: Deploy

1. Save the Web Service.
2. Deploy (Manual Deploy or push to the connected branch).
3. Wait 2–3 minutes for startup. Then open:
   - `https://your-service.onrender.com/actuator/health` → should return `{"status":"UP"}`.
   - `https://your-service.onrender.com/api/auth/login` → test API.

---

## Local development with Postgres

**Default (no env):**  
`application.yml` defaults to `jdbc:postgresql://localhost:5432/medibot`, user `postgres`, password `postgres`. Run Postgres locally (e.g. Docker):

```bash
docker run -d --name postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=medibot -p 5432:5432 postgres:16-alpine
```

Or set `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` in your IDE / env.

---

## Summary

| Component | Technology |
|-----------|------------|
| Database | PostgreSQL (Render Postgres) |
| Backend | Spring Boot + JPA + PostgreSQL driver |
| Config | `SPRING_DATASOURCE_*` from Render / env |

No MySQL dependency remains; the app is configured for PostgreSQL only.
