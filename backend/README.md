# Medibots Health – Backend

Spring Boot 3 REST API with JWT auth and MySQL.

## Prerequisites

- Java 17+
- Maven
- MySQL (schema: `medibot`, user: `root`, password: `root`)

## Configuration

`src/main/resources/application.yml`:

- **Datasource:** `jdbc:mysql://localhost:3306/medibot` (username: `root`, password: `root`)
- **Server port:** 8081
- **JWT:** `app.jwt.secret`, `app.jwt.expiration-ms` (env `JWT_SECRET` optional)

Create the database if needed:

```sql
CREATE DATABASE IF NOT EXISTS medibot;
```

## Run

```bash
mvn spring-boot:run
```

API base: **http://localhost:8081**.

## Default user (seeded on first run)

- **Email:** admin@medibots.com  
- **Password:** admin123  
- **Role:** SUPER_ADMIN  

## API overview

- **Auth:** `POST /api/auth/login`, `POST /api/auth/signup`, `GET /api/auth/me`
- **Claims:** `GET/POST /api/claims`, `POST /api/claims/manage`
- **Patients:** `GET/POST /api/patients`, `GET /api/patients/me`
- **Appointments:** `GET/POST /api/appointments`, `GET /api/appointments/doctor`, `GET /api/appointments/patient`, `PATCH /api/appointments/{id}`
- **Invoices:** `GET /api/invoices`, `POST /api/invoices/create`, `POST /api/invoices/generate`, `GET /api/invoices/{id}/items`
- **Payments:** `GET/POST /api/payments`
- **Hospitals:** `GET/POST /api/hospitals`
- **Profiles:** `GET /api/profiles`, `GET /api/profiles/doctors`
- **Dashboard:** `GET /api/dashboard/kpis`, `claims-per-day`, `revenue-trend`, etc.
- **Admin:** `POST /api/admin/create-user`, `PATCH /api/admin/users/{userId}`
- **Analytics:** `GET /api/analytics`
- **AI logs / Audit logs:** `GET /api/ai-logs`, `GET /api/audit-logs`
- **Chat:** `POST /api/chat` — Set `GROQ_API_KEY` (free at groq.com) or `HF_TOKEN` for live AI support

All endpoints except `/api/auth/**` require `Authorization: Bearer <token>`.
