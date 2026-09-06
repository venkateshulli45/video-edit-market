#!/usr/bin/env bash
set -euo pipefail

# Run once on a fresh Ubuntu EC2 instance (Amazon Linux: use dnf instead of apt).
# Secrets stay in /opt/video-edit-market/.env — never in git.

APP_DIR="${APP_DIR:-/opt/video-edit-market}"
REPO_URL="${REPO_URL:-}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (sudo bash deploy/ec2-setup.sh)"
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl git

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

systemctl enable --now docker
usermod -aG docker ubuntu || true
usermod -aG docker ec2-user || true

mkdir -p "$APP_DIR"
if [[ -n "$REPO_URL" && ! -d "$APP_DIR/.git" ]]; then
  git clone "$REPO_URL" "$APP_DIR"
fi

if [[ ! -f "$APP_DIR/.env" ]]; then
  if [[ -f "$APP_DIR/.env.example" ]]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  else
    touch "$APP_DIR/.env"
  fi
  chmod 600 "$APP_DIR/.env"
  echo "Created $APP_DIR/.env — add real values before starting the app."
fi

echo "Setup done. Next:"
echo "  1. Edit $APP_DIR/.env with rotated secrets"
echo "  2. cd $APP_DIR && docker compose up -d --build"
echo "  3. Open security group: 22 (your IP), 80/443 (or 3000 for a smoke test)"
