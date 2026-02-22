# Deploy Medibots Health: Render (Backend) + Vercel (Frontend)

**Stack:** Spring Boot (Java 21, Maven) | React (Vite) | MySQL (Render)  
**Hosting:** Backend → Render | Frontend → Vercel

---

## 1. Backend Verification

### 1.1 Server port

- **Required:** `server.port=${PORT:8080}` so Render can inject `PORT`.
- **Status:** Configured in `backend/src/main/resources/application-production.properties`:
  - `server.port=${PORT:8080}`

### 1.2 Database dependency

- **PostgreSQL:** Not used. Project uses **MySQL** (Render supports MySQL).
- **pom.xml:** `mysql-connector-j` is present. No PostgreSQL dependency; correct for MySQL on Render.

### 1.3 Production configuration (env-based, no localhost)

- **File:** `backend/src/main/resources/application-production.properties`
- **Content (all from environment):**

```properties
server.port=${PORT:8080}

spring.datasource.url=${SPRING_DATASOURCE_URL}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

app.jwt.secret=${JWT_SECRET}
app.jwt.expiration-ms=${JWT_EXPIRATION_MS:86400000}
app.cors.allowed-origins=${CORS_ALLOWED_ORIGINS}
```

- **No hardcoded localhost:** All DB and app settings come from environment variables.

### 1.4 CORS

- **Configurable via:** `CORS_ALLOWED_ORIGINS` (mapped to `app.cors.allowed-origins`).
- **SecurityConfig:** Reads `app.cors.allowed-origins`; supports comma-separated origins (e.g. your Vercel URL).

### 1.5 Java version

- **pom.xml:** `java.version` set to **21** for Render (Java 21 runtime).

---

## 2. Render Setup

### 2.1 Environment variables (add in Render Dashboard)

For the **Backend** service on Render, set these in **Environment**:

| Variable | Description | Example |
|----------|-------------|---------|
| `SPRING_PROFILES_ACTIVE` | Enable production config | `production` |
| `SPRING_DATASOURCE_URL` | Render MySQL JDBC URL | `jdbc:mysql://host:port/medibot?useSSL=true&serverTimezone=UTC` |
| `SPRING_DATASOURCE_USERNAME` | MySQL username (from Render MySQL) | From Render DB credentials |
| `SPRING_DATASOURCE_PASSWORD` | MySQL password (from Render MySQL) | From Render DB credentials |
| `JWT_SECRET` | Secret for JWT signing (min 256 bits) | e.g. output of `openssl rand -base64 32` |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origin(s), comma-separated | `https://your-app.vercel.app` |

**Getting Render MySQL URL:**

- In Render: create a **MySQL** database; copy **Internal Database URL** (or External if your backend uses it).
- Convert to JDBC form:  
  `jdbc:mysql://<host>:<port>/<database>?useSSL=true&serverTimezone=UTC`  
  Use the database name (e.g. `medibot` if you created it that way), and the user/password from the same credentials.

### 2.2 Build & start commands (Render)

- **Build command:**  
  `mvn clean package -DskipTests`

- **Start command:**  
  `java -jar target/medibots-health-backend-1.0.0.jar`

- **Root directory:** `backend` (if repo root is the monorepo; otherwise leave blank if Render runs from `backend` or you set root to the backend folder).

---

## 3. Frontend Verification

### 3.1 Use of `VITE_API_URL`

- **api.ts:** `const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081';`
  - Production: set `VITE_API_URL` in Vercel so the built app uses your Render backend URL.
  - The fallback is for local dev only; no production URL is hardcoded.
- **useChat.ts:** Uses `API_BASE` from `@/lib/api` (single source of truth). No duplicate localhost URL.

### 3.2 No remaining localhost in production

- All API calls go through `api.ts` or `CHAT_URL` derived from `API_BASE`.  
- In production, `VITE_API_URL` is set at **build time** on Vercel, so the built assets contain the correct backend URL and no localhost is used.

### 3.3 `.env.production` content

For **local** production builds (optional), create `frontend/.env.production`:

```env
VITE_API_URL=https://your-backend-service.onrender.com
```

- No trailing slash.
- On **Vercel**, you do **not** need to commit this file; set the same variable in **Vercel → Project → Settings → Environment Variables** for **Production** (and Preview if you want).

### 3.4 Axios / fetch

- Project uses **fetch** (no Axios).  
- Base URL is always `import.meta.env.VITE_API_URL` (via `API_BASE` in `api.ts`). Confirmed.

---

## 4. Vercel Setup

### 4.1 Environment variable

| Variable | Value | Environment |
|----------|--------|-------------|
| `VITE_API_URL` | Your Render backend URL (no trailing slash) | Production (and Preview if desired) |

Example: `https://medibots-backend.onrender.com`

### 4.2 Build settings

- **Framework preset:** Vite  
- **Root directory:** `frontend` (if repo root is the monorepo)  
- **Build command:** `npm run build` (default)  
- **Output directory:** `dist` (default for Vite)

---

## 5. Debug Checklist

Use this to confirm everything before and after deploy.

### Backend (Render)

- [ ] **Build:** `mvn clean package -DskipTests` succeeds locally (from `backend/`).
- [ ] **JAR:** `backend/target/medibots-health-backend-1.0.0.jar` exists after build.
- [ ] **Render build command:** `mvn clean package -DskipTests` (and root = `backend` if repo is monorepo).
- [ ] **Render start command:** `java -jar target/medibots-health-backend-1.0.0.jar`.
- [ ] **Env vars on Render:** `SPRING_PROFILES_ACTIVE`, `SPRING_DATASOURCE_*`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS` all set.
- [ ] **MySQL on Render:** Database created; URL/user/password match `SPRING_DATASOURCE_*`.
- [ ] **Backend URL:** Open `https://your-backend.onrender.com/api/auth/login` (e.g. POST with JSON `{"email":"...","password":"..."}`) to confirm API responds.

### Frontend (Vercel)

- [ ] **Vercel env:** `VITE_API_URL` set to Render backend URL (Production, and Preview if needed).
- [ ] **No trailing slash** in `VITE_API_URL`.
- [ ] **Build:** `npm run build` succeeds in `frontend/` with `VITE_API_URL` set (or use Vercel build logs).
- [ ] **CORS:** `CORS_ALLOWED_ORIGINS` on Render includes your Vercel URL (e.g. `https://your-app.vercel.app`).

### Post-deploy

- [ ] Open Vercel app URL → login or signup works.
- [ ] Browser Network tab: API requests go to Render backend URL, not localhost.
- [ ] No CORS errors in browser console.

---

## 6. Common Deployment Failure – Debugging

| Symptom | What to check |
|--------|----------------|
| **Render build fails** | Java 21 selected in Render; build command runs from repo/backend root so `pom.xml` is found; no typo in `mvn clean package -DskipTests`. |
| **Render: “Application failed to respond”** | Start command is `java -jar target/medibots-health-backend-1.0.0.jar`; `PORT` is set by Render (app uses `${PORT:8080}`). |
| **DB connection error on Render** | `SPRING_DATASOURCE_URL` is full JDBC URL; use **Internal** URL if backend and DB are on Render; username/password match Render MySQL; security group/network allows connection. |
| **Frontend shows “Network Error” or wrong API** | `VITE_API_URL` set in Vercel for the environment that was built; redeploy after changing env vars (build is cached). |
| **CORS errors in browser** | `CORS_ALLOWED_ORIGINS` on Render exactly matches frontend origin (e.g. `https://your-app.vercel.app`), no trailing slash; redeploy backend after changing. |
| **401 on API calls** | Login first; token stored and sent in `Authorization: Bearer <token>`; `JWT_SECRET` same for all backend instances if you scale. |
| **JAR not found on Render** | Root directory in Render points to folder that contains `pom.xml` (e.g. `backend`); build output shows `target/medibots-health-backend-1.0.0.jar`. |

---

## Quick reference

| Item | Backend (Render) | Frontend (Vercel) |
|------|------------------|-------------------|
| Port | `server.port=${PORT:8080}` | N/A (static) |
| DB | MySQL via env (no localhost) | N/A |
| API base | N/A | `VITE_API_URL` (build time) |
| CORS | `CORS_ALLOWED_ORIGINS` | Set same URL in Render CORS |
| Build | `mvn clean package -DskipTests` | `npm run build` |
| Start / output | `java -jar target/medibots-health-backend-1.0.0.jar` | `dist` |
