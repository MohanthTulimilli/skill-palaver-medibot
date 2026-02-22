#!/bin/bash
# Deploy Medibots Backend on AWS EC2 (Ubuntu)
# Run from backend/: ./ec2/deploy-ec2.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_DIR="/opt/medibots-backend"
JAR_NAME="medibots-health-backend-1.0.0.jar"
SERVICE_NAME="medibots-backend"

echo "==> Creating app directory..."
sudo mkdir -p "$APP_DIR"
sudo chown "$USER:$USER" "$APP_DIR"

echo "==> Copying JAR (ensure it exists in backend dir)..."
if [ ! -f "$BACKEND_DIR/target/$JAR_NAME" ]; then
  echo "Error: $BACKEND_DIR/target/$JAR_NAME not found. Run 'mvn package -DskipTests' from backend."
  exit 1
fi
cp "$BACKEND_DIR/target/$JAR_NAME" "$APP_DIR/"

echo "==> Setting up .env..."
if [ ! -f "$APP_DIR/.env" ]; then
  if [ -f "$SCRIPT_DIR/.env.ec2.example" ]; then
    cp "$SCRIPT_DIR/.env.ec2.example" "$APP_DIR/.env"
    echo "Created $APP_DIR/.env from example. Edit it with your values."
  else
    echo "Create $APP_DIR/.env with: SPRING_PROFILES_ACTIVE, SPRING_DATASOURCE_*, JWT_SECRET, CORS_ALLOWED_ORIGINS"
  fi
fi
chmod 600 "$APP_DIR/.env" 2>/dev/null || true

echo "==> Installing systemd service..."
sudo cp "$SCRIPT_DIR/medibots-backend.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl restart $SERVICE_NAME

echo "==> Done. Check: sudo systemctl status $SERVICE_NAME"
echo "==> Logs: sudo journalctl -u $SERVICE_NAME -f"
