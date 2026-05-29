#!/bin/bash
# ======================================================
# deploy.sh - Coopwise Docker Deployment Script (GCP VM)
# Runs ON the VM
# ======================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()     { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ======
# CONFIG
# ======
REPO_URL="https://github.com/olaniyigeorge/coopwise.git"
APP_DIR="$HOME/coopwise"

# ======================
# STEP 1: Install Docker
# ======================
log "Installing Docker..."

sudo apt-get update -qq

sudo apt-get install -y -qq \
    ca-certificates curl gnupg git

# Docker repo setup
sudo install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -qq

sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

sudo usermod -aG docker $USER || true

success "Docker installed"

# ===========================
# STEP 2: Clone / Update Repo
# ===========================
if [ -d "$APP_DIR/.git" ]; then
    log "Updating repo..."
    git -C "$APP_DIR" pull origin main
else
    log "Cloning repo..."
    git clone "$REPO_URL" "$APP_DIR"
fi

success "Repo ready"

cd "$APP_DIR"

# =========================
# STEP 3: Ensure env exists
# =========================
if [ ! -f ".env" ]; then
    if [ -f "apps/backend/.env.example" ]; then
        warn "Creating .env from example"
        cp apps/backend/.env.example apps/backend/.env
    else
        warn "No .env found — set environment variables manually"
    fi
fi

# ================================
# STEP 4: Stop existing containers
# ================================
log "Stopping old containers..."
docker compose down || true

# ==============================
# STEP 5: Build & start services
# ==============================
log "Starting Coopwise via Docker Compose..."

docker compose up -d --build

# ====================
# STEP 6: Health Check
# ====================
sleep 5

if docker ps | grep -q coopwise; then
    success "Containers running"
else
    warn "Some containers may not be running — check docker ps"
fi

# ====
# DONE
# ====
echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN} Coopwise deployed via Docker!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""

echo "Run checks:"
echo "  docker ps"
echo "  docker logs coopwise_backend"
echo "  docker compose logs -f"