#!/usr/bin/env bash
set -euo pipefail

# Run on the EC2 host after code is present.
# Usage: bash deploy/ec2-deploy.sh

APP_DIR="${APP_DIR:-/opt/video-edit-market}"

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "Missing $APP_DIR/.env. Copy .env.example and fill secrets first."
  exit 1
fi

cd "$APP_DIR"

if [[ -d .git ]]; then
  git pull --ff-only
fi

docker compose up -d --build
docker compose ps
