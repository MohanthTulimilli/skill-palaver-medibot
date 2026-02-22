# Medibots Health - AWS Deployment Guide (with ML Service)

This guide covers deploying the **updated version** (Backend + Frontend + **ML Service**) to AWS. Your previous deployment likely had Backend and Frontend only.

## Architecture Overview

```
                    ┌─────────────┐
                    │   Frontend  │  (S3 + CloudFront, or existing)
                    │   (React)   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Backend   │  (Spring Boot - EC2/ECS/Lambda)
                    │  (port 8080)│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌───▼────┐ ┌────▼─────┐
       │ ML Service  │ │  MySQL │ │  Other   │
       │ (FastAPI)   │ │   DB   │ │ Services │
       │ port 8000   │ │        │ │          │
       └─────────────┘ └────────┘ └──────────┘
```

The **Backend** must reach the **ML Service** at `app.ml.service-url` (default: `http://127.0.0.1:8000`). In AWS, configure this to your ML service URL.

---

## 1. Build ML Service Docker Image

```bash
cd ml-service
docker build -t medibots-ml-service:latest .
```

### Test locally

```bash
docker run -p 8000:8000 medibots-ml-service:latest
# Test: curl http://localhost:8000/stats/claims
```

---

## 2. Deploy ML Service to AWS

### Option A: AWS ECS (Fargate) – recommended

1. **Push image to ECR**
   ```bash
   aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com
   docker tag medibots-ml-service:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/medibots-ml:latest
   docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/medibots-ml:latest
   ```

2. **Create ECS Task Definition**
   - Container: `medibots-ml`, port 8000
   - CPU: 256, Memory: 512 MB (or 512/1024)
   - Environment: `XAI_API_KEY` or `GROK_API_KEY` (optional, for Grok insights)

3. **Create ECS Service**
   - Use Fargate
   - Attach an Application Load Balancer (ALB) or use a target group with path `/`
   - Note the public URL (e.g. `http://ml-xxx.us-east-1.elb.amazonaws.com` or via Route53)

### Option B: EC2

1. Launch an EC2 instance (e.g. t3.small)
2. Install Docker, pull/run the ML image
   ```bash
   docker run -d -p 8000:8000 --name ml-service medibots-ml-service:latest
   ```
3. Configure Security Group: allow inbound port 8000 from your Backend (or ALB)
4. Use the EC2 private/public IP as ML service URL

### Option C: AWS App Runner

1. Create an App Runner service from the ECR image
2. Set port 8000
3. Use the generated App Runner URL as the ML service URL

---

## 3. Update Backend Configuration

Configure the Backend to call the ML service at its deployed URL.

### Via environment variable

```bash
export ML_SERVICE_URL=http://<ML_SERVICE_HOST>:8000
# Example: http://ml-xxx.us-east-1.elb.amazonaws.com:8000
# Or internal: http://ml-service.ecs.internal:8000
```

The backend reads `app.ml.service-url` from `ML_SERVICE_URL` (see `application.yml`).

### If Backend and ML are in same VPC (e.g. ECS)

- Use the ECS service discovery name or the internal ALB DNS
- Example: `http://medibots-ml:8000` or `http://ml-alb-internal-xxx:8000`

---

## 4. Redeploy Backend

Redeploy the Backend with the new config so it points to the ML service:

```bash
# If using Docker
docker build -t medibots-backend:latest ./backend
docker run -e ML_SERVICE_URL=http://<ML_HOST>:8000 -p 8080:8080 medibots-backend:latest
```

Update your existing AWS deployment (ECS/EC2/Beanstalk) with the new image and env vars.

---

## 5. Frontend

No changes needed for the frontend. It talks to the Backend; the Backend talks to the ML service.

---

## 6. Environment Variables Reference

| Variable | Where | Description |
|----------|-------|-------------|
| `ML_SERVICE_URL` | Backend | URL of ML service (e.g. `http://ml-xxx:8000`) |
| `XAI_API_KEY` or `GROK_API_KEY` | ML Service | Optional. For Grok AI insights. Without it, template insights are used. |

---

## 7. Docker Compose (for local / single-server deployment)

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=production
      - ML_SERVICE_URL=http://ml-service:8000
      # Add DB_URL, etc. as needed
    depends_on:
      - ml-service

  ml-service:
    build: ./ml-service
    ports:
      - "8000:8000"
    environment:
      - XAI_API_KEY=${XAI_API_KEY:-}
```

Run: `docker-compose up -d`

---

## 8. Health Checks

- **ML Service**: `GET http://<ML_HOST>:8000/stats/claims` – returns JSON if healthy
- **Backend**: Your existing health endpoint

---

## 9. Fallback Behavior

If the ML service is down or models are missing:

- **Stats** (`/stats/claims`, etc.): ML service returns defaults from code
- **Predictions**: Backend uses **amount-based fallbacks** and never blocks the app
- **Grok insights**: Use template text when `XAI_API_KEY` is not set

So the application continues to work even when the ML service is unavailable.
