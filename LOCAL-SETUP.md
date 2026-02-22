# Run Medibots Health Locally

## Prerequisites

- **Node.js** 18+ and npm
- **Java 21** and Maven
- **MySQL** 8.x (root:root, port 3306)

---

## 1. MySQL

Ensure MySQL is running and accessible:

```bash
mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS medibot;"
```

---

## 2. Backend

```bash
cd backend
mvn spring-boot:run
```

- Runs on **http://localhost:8080**
- Uses local MySQL: `jdbc:mysql://localhost:3306/medibot` (root/root)
- Seeds admin user on first start

**Test:** http://localhost:8080/actuator/health

---

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

- Runs on **http://localhost:5173**
- Uses Vite proxy: `/api` and `/actuator` → `http://localhost:8080` (no CORS in dev)

---

## 4. Login

- **Admin:** `admin@medibots.com` / `admin123`
- **New user:** Use Sign up to create a patient account

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `vite` not found | Run `npm install` in `frontend/` |
| Port 8080 in use | Stop other processes; or set `PORT=8081` and update `frontend/.env` |
| MySQL connection refused | Start MySQL, check root:root, port 3306 |
| Login "failed to fetch" | Ensure backend is running on 8080; restart frontend so Vite proxy is active |
| CORS error | Backend allows localhost:5173; restart backend after config changes |
