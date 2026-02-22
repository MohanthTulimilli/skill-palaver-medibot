# Medibots Health

Healthcare app: **Vite + React** frontend and **Spring Boot + MySQL** backend.

## Tech stack

- **Frontend:** Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Spring Boot 3, Spring Security (JWT), Spring Data JPA
- **Database:** MySQL (schema: `medibot`, user: `root`, password: `root`)

## Structure

| Folder        | Description |
|---------------|-------------|
| **frontend/** | React + Vite app. Port **8080**. |
| **backend/**  | Spring Boot REST API. Port **8081**. |

## Prerequisites

- **Node.js** 18+ and **npm** (frontend)
- **Java 17+** and **Maven** (backend)
- **MySQL** (create schema `medibot`; user `root`, password `root`)

## Quick start

### 1. Database

Create the MySQL schema (if not exists):

```sql
CREATE DATABASE IF NOT EXISTS medibot;
```

Default connection: `jdbc:mysql://localhost:3306/medibot`, user `root`, password `root` (see `backend/src/main/resources/application.yml`).

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

API runs at **http://localhost:8081**. On first run, schema is created and a default admin user is seeded: **admin@medibots.com** / **admin123**.

### 3. Frontend

```bash
cd frontend
npm install --ignore-scripts
copy .env.example .env
# Optional: set VITE_API_URL=http://localhost:8081 (default)
npm run dev
```

Open **http://localhost:8080**.

## Env (frontend)

In `frontend/.env`:

- `VITE_API_URL` – Backend API base URL (default: `http://localhost:8081`)

## Docs

- [Frontend README](frontend/README.md) – run, build, stack
- [Backend README](backend/README.md) – API, config, MySQL
