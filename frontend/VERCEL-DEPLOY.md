# Deploy Frontend on Vercel

Your app is **Vite + React** in the `frontend/` folder. Follow these steps.

---

## 1. Push your code to GitHub/GitLab/Bitbucket

Vercel deploys from Git. If you haven’t already:

- Create a repo and push your project (the repo root can be the folder that contains both `frontend/` and `backend/`).

---

## 2. Import the project in Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub/GitLab/Bitbucket).
2. Click **Add New…** → **Project**.
3. **Import** the repository that contains your frontend.
4. If the repo root is the **monorepo** (parent of `frontend/` and `backend/`), set:
   - **Root Directory:** `frontend`  
     (or `medibotshealth-skill-palaver/frontend` if your repo root is one level above that).
5. Leave **Framework Preset** as **Vite** (Vercel detects it).
6. **Build and Output Settings** (usually auto-filled):
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

---

## 3. Set environment variable (required)

Your app calls the backend using `VITE_API_URL`. Set it in Vercel so the build uses your API URL.

1. In the import screen, or after creating the project, go to **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `VITE_API_URL`
   - **Value:** Your backend URL with no trailing slash, e.g.  
     `https://your-backend.onrender.com`  
     or `https://your-backend.vercel.app` if the API is on Vercel.
3. Select **Production** (and **Preview** if you want preview deployments to use the same API).
4. Save.

If you add or change this after the first deploy, trigger a **Redeploy** so the new value is baked into the build.

---

## 4. Deploy

1. Click **Deploy** (or push to the connected branch; Vercel will deploy automatically).
2. Wait for the build to finish. The first run may take 1–2 minutes.
3. Open the generated URL (e.g. `https://your-project.vercel.app`).

---

## 5. Optional: custom domain

1. In the project: **Settings** → **Domains**.
2. Add your domain and follow the DNS instructions (CNAME or A record).
3. After adding the domain, set **CORS** on your backend so it allows this domain (e.g. `CORS_ALLOWED_ORIGINS` includes `https://your-domain.com`).

---

## Quick reference

| Setting            | Value                          |
|--------------------|---------------------------------|
| Root Directory     | `frontend` (or path to frontend) |
| Framework Preset   | Vite                           |
| Build Command      | `npm run build`                |
| Output Directory   | `dist`                         |
| Env variable      | `VITE_API_URL` = backend URL   |

---

## Troubleshooting

- **Build fails:** Confirm **Root Directory** points to the folder that has `package.json` and `vite.config.ts`.
- **API calls go to localhost or fail:** Set `VITE_API_URL` in Vercel and **redeploy** (env is applied at build time).
- **404 on refresh / direct URL:** Vercel’s Vite preset usually configures rewrites for SPAs; if not, add a `vercel.json` in the **frontend** folder with:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
