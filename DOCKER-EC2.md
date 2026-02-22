# Medibots Health – Docker Deploy on AWS EC2

Deploy with Docker Compose on Amazon Linux 2023 (t2.micro / t3.micro).

## Architecture

| Service  | Port  | Role                                      |
|----------|-------|-------------------------------------------|
| nginx    | 80    | Reverse proxy (frontend + /api → backend) |
| frontend | internal | SPA served by Nginx                     |
| backend  | 8080 (internal) | Spring Boot API                   |
| db       | -     | MariaDB (no port exposed)                 |

---

## 1. Install Docker on Amazon Linux 2023

```bash
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user
# Log out and back in for group to take effect
```

---

## 2. Install Docker Compose v2

```bash
sudo yum install -y docker-compose-plugin
# Verify:
docker compose version
```

---

## 3. Clone and Configure

```bash
cd /home/ec2-user
git clone https://github.com/MohanthTulimilli/skill-palaver-medibot.git medibots
cd medibots
```

Create `.env` from example:

```bash
cp .env.example .env
nano .env
```

Edit and set:

- `DB_PASSWORD` – strong password
- `DB_ROOT_PASSWORD` – strong password
- `JWT_SECRET` – random string, at least 32 chars
- `CORS_ALLOWED_ORIGINS` – `http://YOUR_EC2_PUBLIC_IP` (replace with your EC2 public IP)

---

## 4. Build and Start

```bash
# Build images (first time ~5–10 min)
docker compose build --no-cache

# Start all services
docker compose up -d

# Check status
docker compose ps
```

---

## 5. Access

Open in browser:

```
http://YOUR_EC2_PUBLIC_IP
```

---

## 6. Commands Reference

```bash
# View logs
docker compose logs -f

# Stop
docker compose down

# Stop and remove volumes (deletes DB data)
docker compose down -v

# Rebuild and restart after code changes
docker compose build --no-cache && docker compose up -d
```

---

## 7. Security Group (EC2)

| Type | Port | Source   |
|------|------|----------|
| SSH  | 22   | Your IP  |
| HTTP | 80   | 0.0.0.0/0 |

**Do not** expose 3306 or 8080.

---

## 8. Troubleshooting

| Issue | Action |
|-------|--------|
| `DB_PASSWORD required` | Ensure `.env` exists and contains `DB_PASSWORD` |
| Backend fails to start | Check `docker compose logs backend`; verify DB is healthy |
| CORS errors | Add EC2 IP to `CORS_ALLOWED_ORIGINS` in `.env` and restart |
| 502 Bad Gateway | Wait 1–2 min for backend to finish startup |
