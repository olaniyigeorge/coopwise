#!/bin/bash
# =============================================================
# setup-gcp.sh - Coopwise GCP Infrastructure Provisioning Script
# Runs on LOCAL machine
# =============================================================

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

# =============
# CONFIGURATION
# =============
PROJECT_ID="coopwise-prod"
VM_NAME="coopwise-engine"
ZONE="us-central1-b"
MACHINE_TYPE="e2-medium"
DISK_SIZE="20GB"
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"

REPO_URL="https://github.com/olaniyigeorge/coopwise.git"

STATIC_IP_NAME="coopwise-static-ip"

# ====================
# STEP 1: gcloud check
# ====================
log "Checking gcloud setup..."

if ! command -v gcloud &>/dev/null; then
    error "gcloud CLI not installed"
fi

gcloud config set project "$PROJECT_ID"
success "Project set to $PROJECT_ID"

# ===================
# STEP 2: Enable APIs
# ===================
log "Enabling Compute Engine API..."
gcloud services enable compute.googleapis.com --quiet
success "APIs enabled"

# ======================
# STEP 3: Firewall rules
# ======================
log "Setting up firewall rules..."

create_fw() {
    if ! gcloud compute firewall-rules describe "$1" --quiet &>/dev/null; then
        gcloud compute firewall-rules create "$1" \
            --allow "$2" \
            --target-tags=http-server \
            --quiet
        success "Firewall created: $1"
    else
        warn "Firewall exists: $1"
    fi
}

create_fw allow-http tcp:80
create_fw allow-https tcp:443
create_fw allow-api tcp:8000

# ================================
# STEP 4: Create VM (Docker-ready)
# ================================
log "Creating VM..."

if gcloud compute instances describe "$VM_NAME" --zone="$ZONE" --quiet &>/dev/null; then
    warn "VM already exists"
else
    gcloud compute instances create "$VM_NAME" \
        --zone="$ZONE" \
        --machine-type="$MACHINE_TYPE" \
        --image-family="$IMAGE_FAMILY" \
        --image-project="$IMAGE_PROJECT" \
        --boot-disk-size="$DISK_SIZE" \
        --tags=http-server,https-server \
        --metadata=startup-script='#!/bin/bash
            apt-get update -qq
            apt-get install -y -qq curl git ca-certificates

            # install docker
            curl -fsSL https://get.docker.com | sh

            systemctl enable docker
            systemctl start docker
        ' \
        --quiet

    success "VM created"
fi

# =================
# STEP 5: Static IP
# =================
log "Reserving static IP..."

REGION="${ZONE%-*}"

if ! gcloud compute addresses describe "$STATIC_IP_NAME" --region="$REGION" --quiet &>/dev/null; then
    gcloud compute addresses create "$STATIC_IP_NAME" --region="$REGION"
    success "Static IP created"
else
    warn "Static IP exists"
fi

STATIC_IP=$(gcloud compute addresses describe "$STATIC_IP_NAME" \
    --region="$REGION" \
    --format="get(address)")

# Attach IP
gcloud compute instances delete-access-config "$VM_NAME" \
    --zone="$ZONE" \
    --access-config-name="External NAT" \
    --quiet || true

gcloud compute instances add-access-config "$VM_NAME" \
    --zone="$ZONE" \
    --access-config-name="External NAT" \
    --address="$STATIC_IP" \
    --quiet

success "Static IP assigned: $STATIC_IP"

# ================================
# STEP 6: Deploy Coopwise (Docker)
# ================================
log "Waiting for VM boot..."
sleep 15

log "Copying deploy.sh..."

gcloud compute scp deploy.sh "${VM_NAME}:~/deploy.sh" \
    --zone="$ZONE" \
    --quiet

log "Running deployment on VM..."

gcloud compute ssh "$VM_NAME" \
    --zone="$ZONE" \
    --command="chmod +x ~/deploy.sh && bash ~/deploy.sh" \
    --quiet

# ====
# DONE
# ====
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Coopwise GCP deployment complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

echo -e "🖥️  VM:         $VM_NAME"
echo -e "🌐 Frontend:   http://${STATIC_IP}"
echo -e "🔌 API:        http://${STATIC_IP}/api"
echo -e "📖 Docs:       http://${STATIC_IP}:8000/docs"
echo ""

echo "SSH:"
echo "  gcloud compute ssh $VM_NAME --zone=$ZONE"