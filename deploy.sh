#!/bin/bash
# =============================================================================
#  deploy.sh — WDIC Production Deploy Script
#  Usage: ./deploy.sh [--no-cache]
# =============================================================================

set -e  # exit on any error

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── Config ───────────────────────────────────────────────────────────────────
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
NO_CACHE=""

# ── Parse args ────────────────────────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --no-cache)
      NO_CACHE="--no-cache"
      ;;
  esac
done

# ── Helpers ───────────────────────────────────────────────────────────────────
log()     { echo -e "${CYAN}[deploy]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }
error()   { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║        WDIC Production Deploy        ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Pre-flight checks ────────────────────────────────────────────────────────
log "Checking prerequisites..."

command -v docker >/dev/null 2>&1 || error "Docker is not installed"
command -v docker compose >/dev/null 2>&1 || error "Docker Compose v2 is not installed"

[ -f "$ENV_FILE" ] || error ".env file not found. Copy .env_template to .env and fill in values."
[ -f "$COMPOSE_FILE" ] || error "docker-compose.yml not found"

# Check required env vars
. "$ENV_FILE"
[ -z "$SECRET_KEY" ] && error "SECRET_KEY is not set in .env"
[ -z "$DB_PASSWORD" ] && error "DB_PASSWORD is not set in .env"
[ -z "$NEXT_PUBLIC_API_BASE_URL" ] && error "NEXT_PUBLIC_API_BASE_URL is not set in .env"

success "Prerequisites OK"

# ── Pull latest code (optional — comment out if deploying manually) ───────────
if [ -d ".git" ]; then
  log "Pulling latest code from git..."
  git pull --ff-only || warn "Git pull failed or nothing to pull — continuing with local code"
  echo ""
fi

# ── Stop running containers (graceful) ───────────────────────────────────────
log "Stopping existing containers..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans
success "Containers stopped"

# ── Build images ──────────────────────────────────────────────────────────────
log "Building Docker images... ${NO_CACHE:+(--no-cache)}"
docker compose -f "$COMPOSE_FILE" build $NO_CACHE
success "Images built"

# ── Start services ────────────────────────────────────────────────────────────
log "Starting services..."
docker compose -f "$COMPOSE_FILE" up -d
success "Services started"

# ── Wait for backend health check ────────────────────────────────────────────
log "Waiting for backend to be healthy..."
MAX_WAIT=90
WAITED=0
until docker compose -f "$COMPOSE_FILE" ps backend | grep -q "healthy"; do
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo ""
    warn "Backend did not become healthy within ${MAX_WAIT}s. Showing logs:"
    docker compose -f "$COMPOSE_FILE" logs --tail=50 backend
    error "Deploy failed — backend unhealthy"
  fi
  printf "."
  sleep 3
  WAITED=$((WAITED + 3))
done
echo ""
success "Backend is healthy"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║           Deploy Complete! 🚀         ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Frontend :${NC} ${FRONTEND_BASE_URL:-https://wdic.arnisongk.com}"
echo -e "  ${CYAN}Backend  :${NC} ${NEXT_PUBLIC_API_BASE_URL:-https://wdic-api.arnisongk.com/api}"
echo -e "  ${CYAN}Admin    :${NC} ${NEXT_PUBLIC_API_BASE_URL%%/api}/admin/"
echo ""
log "Running containers:"
docker compose -f "$COMPOSE_FILE" ps
echo ""
