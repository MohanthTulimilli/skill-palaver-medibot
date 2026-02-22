# Deploy Medibots Health on AWS

This guide covers deploying the **backend** (Spring Boot + MySQL) and **frontend** (Vite/React) on AWS.

## Architecture overview

| Component    | AWS service              | Notes                    |
|------------|---------------------------|--------------------------|
| Backend API| Elastic Beanstalk or ECS  | Spring Boot, port 8081   |
| Database   | RDS MySQL                 | Schema: `medibot`        |
| Frontend   | S3 + CloudFront           | Static build from Vite   |

---

## Prerequisites

- AWS account and CLI configured (`aws configure`)
- Git, Node.js, Maven (or Docker) locally
- Domain (optional; you can use CloudFront/S3 URLs)

---

## From scratch (zero to live)

Follow this order if you have no AWS resources yet.

| Step | What to do | What you get |
|------|-------------|--------------|
| **1** | [Part 1](#part-1-database-rds-mysql) – Create RDS MySQL (database name `medibot`) | RDS endpoint + password |
| **2** | Note the **RDS security group** (e.g. `sg-xxxx`) – you’ll need it for the backend | SG id |
| **3** | [Part 2](#part-2-backend-spring-boot-on-elastic-beanstalk) – Create Elastic Beanstalk app + environment (Java 17 or Docker), deploy backend JAR/image | Backend URL (e.g. `https://xxx.elasticbeanstalk.com`) |
| **4** | In EB **Configuration → Software → Environment properties**, set: `SPRING_PROFILES_ACTIVE=production`, `SPRING_DATASOURCE_URL=jdbc:mysql://YOUR_RDS_ENDPOINT:3306/medibot?useSSL=true&serverTimezone=UTC`, `SPRING_DATASOURCE_USERNAME=root`, `SPRING_DATASOURCE_PASSWORD=your_rds_password`, `JWT_SECRET=<openssl rand -base64 32>`, `CORS_ALLOWED_ORIGINS=https://your-cloudfront-url` (update after step 6) | Backend connected to DB |
| **5** | In RDS **security group**, add **Inbound rule**: type MySQL (3306), source = Elastic Beanstalk environment’s security group | Backend can reach DB |
| **6** | [Part 4](#part-4-frontend-s3--cloudfront) – Build frontend with `VITE_API_URL=https://your-backend-url`, upload `frontend/dist` to new S3 bucket, create CloudFront distribution (origin = S3) | Frontend URL (e.g. `https://dxxx.cloudfront.net`) |
| **7** | In EB, set `CORS_ALLOWED_ORIGINS` to your CloudFront URL (or custom domain). Redeploy if needed | CORS fixed |
| **8** | Open frontend URL → Login (e.g. admin@medibots.com / admin123 if seeded) | App live |

Generate a strong JWT secret: `openssl rand -base64 32` (or use any 32+ character secret).

---

## Part 1: Database (RDS MySQL)

### 1.1 Create RDS MySQL instance

1. In **AWS Console** → **RDS** → **Create database**.
2. Choose **Standard create**, **MySQL 8.0**, **Free tier** (or your preferred tier).
3. Settings:
   - **DB instance identifier:** e.g. `medibots-db`
   - **Master username:** `root` (or another user)
   - **Master password:** choose a strong password (e.g. store in Secrets Manager later)
4. **Instance configuration:** Burstable (e.g. db.t3.micro for dev).
5. **Storage:** Default (e.g. 20 GB gp2).
6. **Connectivity:** 
   - VPC: default or your app VPC
   - **Public access:** Yes (for simplicity; for production prefer private subnet + bastion or VPN)
   - VPC security group: create new or use existing (you will open **3306** for the backend later).
7. **Database name:** `medibot`.
8. Create database. Note the **endpoint** (e.g. `medibots-db.xxxxx.us-east-1.rds.amazonaws.com`).

### 1.2 Allow backend to reach RDS

- In the **RDS security group** (or the one attached to the instance), add **Inbound rule**:
  - Type: MySQL/Aurora (3306)
  - Source: security group of your Elastic Beanstalk/ECS environment (or EC2), or for testing from a single EC2 use that EC2’s security group.

---

## Part 2: Backend (Spring Boot) on Elastic Beanstalk

### 2.1 Build the JAR (or use Docker)

**Option A – JAR (no Docker):**

```bash
cd backend
mvn clean package -DskipTests
# JAR: target/medibots-health-backend-1.0.0.jar
```

**Option B – Docker (recommended for EB “Docker” platform):**

```bash
cd backend
docker build -t medibots-backend .
# Test: docker run -e SPRING_PROFILES_ACTIVE=production -e SPRING_DATASOURCE_URL=jdbc:mysql://host.docker.internal:3306/medibot -e SPRING_DATASOURCE_USERNAME=root -e SPRING_DATASOURCE_PASSWORD=yourpassword -e JWT_SECRET=your-256-bit-secret -e CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com -p 8081:8081 medibots-backend
```

### 2.2 Create Elastic Beanstalk application

1. **Console** → **Elastic Beanstalk** → **Create application**.
2. **Application name:** e.g. `medibots-health`.
3. **Platform:** 
   - **Java** (for JAR): Java 17, “Upload your code” or “Sample application” then replace with your JAR.
   - **Docker** (for Docker): “Single container” → upload Dockerfile or use a Docker image from ECR.
4. **Platform branch:** Java 17 Corretto or Amazon Linux 2 Docker.

### 2.3 Configure environment variables

In **Elastic Beanstalk** → your **Environment** → **Configuration** → **Software** → **Environment properties**, add:

| Name                     | Value                                                                 |
|---------------------------|-----------------------------------------------------------------------|
| `SPRING_PROFILES_ACTIVE`  | `production`                                                          |
| `SPRING_DATASOURCE_URL`   | `jdbc:mysql://YOUR_RDS_ENDPOINT:3306/medibot?useSSL=true&serverTimezone=UTC` |
| `SPRING_DATASOURCE_USERNAME` | `root` (or your RDS username)                                     |
| `SPRING_DATASOURCE_PASSWORD` | your RDS master password                                         |
| `JWT_SECRET`              | Long random string (e.g. 256 bits); generate with `openssl rand -base64 32` |
| `CORS_ALLOWED_ORIGINS`    | `https://your-cloudfront-domain.com` or S3/CloudFront URL (comma-separated if multiple) |

For **Docker** platform, set **PORT** if the platform expects a different port (e.g. 5000); our app uses `server.port=${PORT:8081}`.

### 2.4 Deploy

- **JAR:** Upload `target/medibots-health-backend-1.0.0.jar` as application version and deploy.
- **Docker:** Build and push image to **Amazon ECR**, then use that image in EB, or use “Dockerfile in source” if you deploy from code.

Note the backend URL, e.g. `https://your-env.elasticbeanstalk.com` or custom domain.

---

## Part 3: Backend on ECS (alternative to Elastic Beanstalk)

1. Build and push Docker image to **ECR**.
2. Create **ECS cluster**, **Task definition** (Fargate):
   - Image: your ECR backend image.
   - Port: 8081 (map to container 8081).
   - Environment variables: same as in section 2.3 (plus `PORT=8081` if you want).
   - Logging: CloudWatch log group.
3. Create **Application Load Balancer** (ALB), **Target group** (port 8081), **Listener** (e.g. 443 → target group).
4. Create **ECS Service** (Fargate), assign to ALB and target group. Ensure security group allows 8081 from ALB.
5. RDS security group must allow 3306 from ECS tasks (e.g. by security group of the ECS service).

Backend URL = ALB DNS or custom domain pointing to ALB.

---

## Part 4: Frontend (S3 + CloudFront)

### 4.1 Build with production API URL

Set the backend URL at build time (replace with your real backend URL):

```bash
cd frontend
npm ci
# Set your backend URL (no trailing slash)
export VITE_API_URL=https://your-backend-url.elasticbeanstalk.com
# Or for custom domain:
# export VITE_API_URL=https://api.yourdomain.com
npm run build
```

Output is in `frontend/dist/`.

### 4.2 Create S3 bucket and upload

```bash
# Create bucket (pick a unique name; must match CloudFront later if you use direct S3 URL)
aws s3 mb s3://medibots-frontend-YOUR-NAME --region us-east-1

# Upload build
aws s3 sync frontend/dist s3://medibots-frontend-YOUR-NAME --delete
```

### 4.3 Configure S3 for static website (optional if using only CloudFront)

- S3 bucket → **Properties** → **Static website hosting** → Enable, index document `index.html`, error document `index.html` (for SPA).
- Bucket **Permissions**: block public access if you serve only via CloudFront; give CloudFront access via OAC (see below).

### 4.4 Create CloudFront distribution

1. **CloudFront** → **Create distribution**.
2. **Origin:**
   - **Origin domain:** S3 bucket (e.g. `medibots-frontend-YOUR-NAME.s3.us-east-1.amazonaws.com`) or S3 website endpoint if you use static hosting.
   - **Origin access:** Origin access control (OAC); create new OAC. Update bucket policy when CloudFront shows the policy.
3. **Default cache behavior:**  
   - Viewer protocol policy: Redirect HTTP to HTTPS.  
   - Cache policy: CachingOptimized or a custom one that caches by `Accept` if needed. For SPA, you can set **Custom error responses**: 403 and 404 → response 200, response page `/index.html` (so client-side routing works).
4. **Settings:**  
   - **Alternate domain names (CNAMEs):** e.g. `app.yourdomain.com` (optional).  
   - **Custom SSL certificate:** Request or import in ACM (must be in us-east-1 for CloudFront).
5. Create distribution. Note the **distribution domain** (e.g. `d1234abcd.cloudfront.net`).

### 4.5 Update backend CORS

Set **CORS_ALLOWED_ORIGINS** on the backend to your frontend origin(s), e.g.:

- `https://d1234abcd.cloudfront.net`
- or `https://app.yourdomain.com`

(Comma-separated, no trailing slash.)

---

## Part 5: Post-deployment checklist

1. **Database:** Schema `medibot` exists on RDS; backend uses it (first run will create tables if `ddl-auto: update`).
2. **Backend health:**  
   `curl https://your-backend-url/api/auth/login` with POST body `{"email":"admin@medibots.com","password":"admin123"}` (if you seeded that user) to confirm API and DB connectivity.
3. **Frontend:** Open CloudFront URL (or custom domain). Login and verify API calls (check browser Network tab for `VITE_API_URL`).
4. **Secrets:** Do not commit RDS password or JWT_SECRET; use env vars (and in production consider AWS Secrets Manager).

---

## Quick reference – environment variables

### Backend (production)

| Variable                     | Example / description                                      |
|-----------------------------|------------------------------------------------------------|
| `SPRING_PROFILES_ACTIVE`    | `production`                                               |
| `SPRING_DATASOURCE_URL`     | `jdbc:mysql://RDS_HOST:3306/medibot?useSSL=true&serverTimezone=UTC` |
| `SPRING_DATASOURCE_USERNAME`| `root`                                                     |
| `SPRING_DATASOURCE_PASSWORD`| RDS password                                               |
| `JWT_SECRET`                | Long random secret (e.g. 32+ bytes base64)                 |
| `CORS_ALLOWED_ORIGINS`      | `https://your-frontend.cloudfront.net` (comma-separated)  |
| `PORT`                      | Optional; set if platform expects different port (e.g. 5000) |

### Frontend (build time)

| Variable         | Example / description                    |
|------------------|-----------------------------------------|
| `VITE_API_URL`   | `https://your-backend-url` (no trailing slash) |

---

## Cost notes (simplified)

- **RDS:** db.t3.micro (free tier eligible) or larger.
- **Elastic Beanstalk:** No extra charge; you pay for EC2 (or Fargate if you use that).
- **S3 + CloudFront:** S3 storage and CloudFront transfer; free tier available.
- Use **AWS Free Tier** where applicable for dev/test.

---

## Troubleshooting

- **502 Bad Gateway:** Backend not listening on the port the platform expects; set `PORT` and ensure health path returns 200.
- **CORS errors:** Ensure `CORS_ALLOWED_ORIGINS` includes the exact frontend origin (scheme + host, no trailing slash).
- **DB connection refused:** RDS security group must allow 3306 from the backend’s security group; check VPC/subnets.
- **Frontend 404 on refresh:** Configure CloudFront error responses (403/404 → 200, `/index.html`) for SPA routing.
