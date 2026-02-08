#!/bin/bash

# Production Deployment Script
# Usage: ./deploy.sh [production|staging] [build|deploy|restart|logs]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
ACTION=${2:-deploy}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-docker.io}
IMAGE_NAME=${DOCKER_REGISTRY}/admin-web
CONTAINER_APP=admin_web_app
CONTAINER_NGINX=admin_web_nginx
COMPOSE_FILE=docker-compose.yml
DEPLOY_PATH=/opt/admin-web

# Helper functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment checks
check_prerequisites() {
  log_info "Checking prerequisites..."
  
  if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
  fi
  
  if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
  fi
  
  log_info "Prerequisites check passed"
}

# Build Docker image
build_image() {
  log_info "Building Docker image for $ENVIRONMENT..."
  
  docker build \
    --build-arg ENVIRONMENT=$ENVIRONMENT \
    -t ${IMAGE_NAME}:${ENVIRONMENT}-latest \
    -t ${IMAGE_NAME}:${ENVIRONMENT}-$(date +%s) \
    .
  
  log_info "Docker image built successfully"
}

# Push image to registry
push_image() {
  log_info "Pushing Docker image to registry..."
  
  docker push ${IMAGE_NAME}:${ENVIRONMENT}-latest
  docker push ${IMAGE_NAME}:${ENVIRONMENT}-$(date +%s)
  
  log_info "Docker image pushed successfully"
}

# Deploy using docker-compose
deploy() {
  log_info "Deploying to $ENVIRONMENT environment..."
  
  # Load environment variables
  if [ -f ".env.$ENVIRONMENT" ]; then
    export $(cat .env.$ENVIRONMENT | grep -v '#' | xargs)
  else
    log_warn "Environment file .env.$ENVIRONMENT not found"
  fi
  
  # Pull latest images
  docker-compose -f $COMPOSE_FILE pull || true
  
  # Stop existing containers
  log_info "Stopping existing containers..."
  docker-compose -f $COMPOSE_FILE down || true
  
  # Start new containers
  log_info "Starting new containers..."
  docker-compose -f $COMPOSE_FILE up -d
  
  # Wait for services to be healthy
  log_info "Waiting for services to become healthy..."
  sleep 10
  
  # Check service health
  if ! docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
    log_error "Services failed to start"
    docker-compose -f $COMPOSE_FILE logs
    exit 1
  fi
  
  log_info "Deployment completed successfully"
}

# Restart containers
restart_containers() {
  log_info "Restarting containers..."
  
  docker-compose -f $COMPOSE_FILE restart
  
  log_info "Containers restarted successfully"
}

# View logs
view_logs() {
  log_info "Displaying logs (Ctrl+C to exit)..."
  
  docker-compose -f $COMPOSE_FILE logs -f
}

# Rollback to previous version
rollback() {
  log_warn "Rolling back to previous version..."
  
  # This assumes you have a previous_image tag or version
  if [ -z "$PREVIOUS_VERSION" ]; then
    log_error "No previous version specified. Set PREVIOUS_VERSION environment variable"
    exit 1
  fi
  
  docker tag ${IMAGE_NAME}:${PREVIOUS_VERSION} ${IMAGE_NAME}:${ENVIRONMENT}-latest
  
  docker-compose -f $COMPOSE_FILE down
  docker-compose -f $COMPOSE_FILE up -d
  
  log_info "Rollback completed"
}

# Health check
health_check() {
  log_info "Running health checks..."
  
  # Check container health
  local app_health=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_APP 2>/dev/null || echo "unknown")
  local nginx_health=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NGINX 2>/dev/null || echo "unknown")
  
  log_info "App container health: $app_health"
  log_info "Nginx container health: $nginx_health"
  
  # Check API endpoint
  local api_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health 2>/dev/null || echo "000")
  log_info "API health check: $api_status"
  
  if [ "$api_status" != "200" ]; then
    log_error "Health check failed"
    return 1
  fi
  
  log_info "All health checks passed"
  return 0
}

# Main script execution
main() {
  log_info "Admin Web Deployment Script"
  log_info "Environment: $ENVIRONMENT"
  log_info "Action: $ACTION"
  
  check_prerequisites
  
  case $ACTION in
    build)
      build_image
      ;;
    push)
      push_image
      ;;
    deploy)
      build_image
      deploy
      health_check
      ;;
    restart)
      restart_containers
      health_check
      ;;
    logs)
      view_logs
      ;;
    rollback)
      rollback
      ;;
    health)
      health_check
      ;;
    *)
      log_error "Unknown action: $ACTION"
      log_info "Available actions: build, push, deploy, restart, logs, rollback, health"
      exit 1
      ;;
  esac
  
  log_info "Script completed successfully"
}

# Run main function
main
