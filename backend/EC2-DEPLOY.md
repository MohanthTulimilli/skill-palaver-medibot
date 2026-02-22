# Deploy Backend on AWS EC2

Step-by-step guide to run the Medibots backend on an EC2 instance.

---

## Prerequisites

- AWS account
- Java 21 (or 17+)
- Amazon Aurora (MySQL-compatible) or MySQL
- Maven (for local build)

---

## 1. Launch EC2 instance

1. **AWS Console** → EC2 → **Launch Instance**
2. **Name:** medibots-backend
3. **AMI:** Ubuntu Server 22.04 LTS
4. **Instance type:** t3.micro (free tier) or t3.small
5. **Key pair:** Create or select; download .pem
6. **Security group:** Create new; add rules:
   - SSH (22) from your IP
   - Custom TCP 8080 from 0.0.0.0/0 (or your frontend / load balancer)
7. Launch; note the **public IP** or **public DNS**

---

## 2. Amazon Aurora (MySQL-compatible)

### Aurora cluster setup

1. **RDS** → Create database → **Amazon Aurora**
2. **Engine:** MySQL 8.0 (or latest)
3. **Cluster endpoint:** note the writer endpoint (e.g. `your-cluster.cluster-xxx.us-east-1.rds.amazonaws.com`)
4. **Port:** 3306
5. **VPC:** Same as EC2 (or ensure EC2 can reach the cluster)
6. **Security group:** Allow inbound 3306 from EC2 security group
7. Create; note **endpoint**, **port** (3306), **database**, **username**, **password**

JDBC URL format:
```
jdbc:mysql://YOUR_CLUSTER_ENDPOINT:3306/medibot?useSSL=true&serverTimezone=UTC
```

---

## 3. Build JAR locally

```bash
cd backend
mvn clean package -DskipTests
# JAR: target/medibots-health-backend-1.0.0.jar
```

---

## 4. Deploy to EC2

### 4.1 SSH into EC2

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### 4.2 Install Java 21

```bash
sudo apt update
sudo apt install -y openjdk-21-jdk
java -version
```

### 4.3 Copy files to EC2

From your **local machine** (adjust paths):

```bash
scp -i your-key.pem backend/target/medibots-health-backend-1.0.0.jar ubuntu@YOUR_EC2_IP:/tmp/
scp -i your-key.pem backend/ec2/* ubuntu@YOUR_EC2_IP:/tmp/
```

### 4.4 On EC2: create app directory and env

```bash
sudo mkdir -p /opt/medibots-backend
sudo chown ubuntu:ubuntu /opt/medibots-backend
mv /tmp/medibots-health-backend-1.0.0.jar /opt/medibots-backend/
```

Create `/opt/medibots-backend/.env`:

```bash
sudo nano /opt/medibots-backend/.env
```

Add (replace with your values):

```
SPRING_PROFILES_ACTIVE=production
SPRING_DATASOURCE_URL=jdbc:mysql://YOUR_AURORA_CLUSTER_ENDPOINT:3306/medibot?useSSL=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=your_db_user
SPRING_DATASOURCE_PASSWORD=your_db_password
JWT_SECRET=your-256-bit-secret
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
SERVER_ADDRESS=0.0.0.0
PORT=8080
```

```bash
chmod 600 /opt/medibots-backend/.env
```

### 4.5 Install systemd service

```bash
sudo nano /etc/systemd/system/medibots-backend.service
```

Paste (adjust User if not ubuntu):

```ini
[Unit]
Description=Medibots Health Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/medibots-backend
ExecStart=/usr/bin/java -jar /opt/medibots-backend/medibots-health-backend-1.0.0.jar
Restart=on-failure
RestartSec=10
EnvironmentFile=/opt/medibots-backend/.env
StandardOutput=journal
StandardError=journal
SyslogIdentifier=medibots-backend

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable medibots-backend
sudo systemctl start medibots-backend
sudo systemctl status medibots-backend
```

### 4.6 Check logs

```bash
sudo journalctl -u medibots-backend -f
```

---

## 5. Verify

- Health: `http://YOUR_EC2_IP:8080/actuator/health`
- API: `http://YOUR_EC2_IP:8080/api/auth/login`

---

## 6. Optional: Nginx reverse proxy (HTTPS)

1. Install Nginx: `sudo apt install -y nginx`
2. Add SSL with Let's Encrypt (certbot)
3. Proxy `/api` and `/actuator` to `http://127.0.0.1:8080`

---

## Quick reference

| Item | Value |
|------|--------|
| Database | Aurora MySQL (port 3306) |
| App dir | `/opt/medibots-backend` |
| JAR | `medibots-health-backend-1.0.0.jar` |
| Port | 8080 |
| Service | `medibots-backend` |
| Env file | `/opt/medibots-backend/.env` |
