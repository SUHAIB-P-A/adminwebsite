# Deployment Guide

## Overview

This guide covers deploying the Admin Web application to production using Docker, Docker Compose, and Nginx.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [SSL Certificate Setup](#ssl-certificate-setup)
4. [Local Testing](#local-testing)
5. [Production Deployment](#production-deployment)
6. [Monitoring & Logging](#monitoring--logging)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Docker (v20.10+)
- Docker Compose (v2.0+)
- Git
- OpenSSL (for SSL certificate generation)

### System Requirements
- Minimum 2GB RAM
- Minimum 2 CPU cores
- At least 5GB disk space

### Network Requirements
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 3000 (Application - internal only)

---

## Environment Setup

### 1. Environment Variables

Create environment-specific configuration files:

```bash
# Production environment
.env.production

# Staging environment
.env.staging

# Development environment
.env.development
```

**Key Environment Variables:**
- `VITE_API_BASE_URL` - Backend API URL (e.g., https://api.example.com)
- `VITE_ENV` - Environment name (production, staging, development)
- `VITE_WEBSOCKET_URL` - WebSocket server URL (e.g., wss://api.example.com)
- `VITE_SENTRY_DSN` - Sentry monitoring DSN (optional)
- `NODE_ENV` - Node.js environment (should be `production`)

**Example .env.production:**
```
VITE_API_BASE_URL=https://api.example.com
VITE_ENV=production
NODE_ENV=production
VITE_WEBSOCKET_URL=wss://api.example.com
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_LOG_LEVEL=warn
VITE_ENABLE_DEV_TOOLS=false
```

### 2. Backend API Configuration

Ensure your backend API is:
- Accessible from the application
- Properly configured with CORS headers
- Using HTTPS in production

---

## SSL Certificate Setup

### Development (Self-Signed)

Generate self-signed certificates for local testing:

```bash
chmod +x generate-ssl.sh
./generate-ssl.sh
```

This creates certificates in the `ssl/` directory.

### Production (Let's Encrypt)

For production deployment with Let's Encrypt:

```bash
# Install Certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Point nginx to the certificates
# Update docker-compose.yml volumes:
volumes:
  - /etc/letsencrypt/live/your-domain.com/fullchain.pem:/etc/nginx/ssl/cert.pem:ro
  - /etc/letsencrypt/live/your-domain.com/privkey.pem:/etc/nginx/ssl/key.pem:ro
```

**Certificate Renewal:**
```bash
sudo certbot renew --dry-run  # Test renewal
sudo certbot renew             # Actual renewal
```

---

## Local Testing

### Build Docker Image

```bash
# Build for development
docker build -t admin-web:dev .

# Build for production
docker build -t admin-web:prod .
```

### Run with Docker Compose

```bash
# Start services (development)
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f app
docker-compose logs -f nginx

# Stop services
docker-compose down
```

### Verify Services

```bash
# Check application health
curl http://localhost/health

# Check API connectivity
curl http://localhost/api/health

# View container logs
docker-compose logs app
docker-compose logs nginx
```

---

## Production Deployment

### Using Deployment Script

```bash
# Make script executable
chmod +x deploy.sh

# Deploy to production
./deploy.sh production deploy

# Deploy to staging
./deploy.sh staging deploy

# Restart containers
./deploy.sh production restart

# View logs
./deploy.sh production logs

# Rollback to previous version
PREVIOUS_VERSION=v1.0.0 ./deploy.sh production rollback

# Health check
./deploy.sh production health
```

### Manual Deployment

```bash
# 1. Build image
docker build -t admin-web:prod .

# 2. Push to registry (if using Docker Hub/ECR)
docker tag admin-web:prod your-registry/admin-web:latest
docker push your-registry/admin-web:latest

# 3. SSH to production server
ssh user@production-server

# 4. Pull latest code
cd /opt/admin-web
git pull origin main

# 5. Load environment
export $(cat .env.production | grep -v '#' | xargs)

# 6. Start services
docker-compose -f docker-compose.yml pull
docker-compose -f docker-compose.yml up -d

# 7. Verify deployment
docker-compose ps
curl http://localhost/health
```

### Zero-Downtime Deployment

For minimal downtime during updates:

```bash
# 1. Build and push new image
docker build -t admin-web:prod .
docker push admin-web:prod

# 2. Update docker-compose.yml with new image tag
vim docker-compose.yml

# 3. Pull new image
docker-compose pull

# 4. Restart app container (nginx stays running)
docker-compose up -d app

# 5. Verify health
docker-compose exec app curl http://localhost:3000
```

---

## Monitoring & Logging

### View Logs

```bash
# Application logs
docker-compose logs app

# Nginx logs
docker-compose logs nginx

# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app --tail=100
```

### Health Checks

The application includes automatic health checks:
- Application health: `http://localhost:3000`
- Nginx health: `http://localhost/health`
- API health: `http://localhost/api/health`

### Monitoring Setup

#### Sentry Integration

1. Create Sentry account: https://sentry.io
2. Get your DSN
3. Add to `.env.production`:
   ```
   VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```

The application automatically sends errors to Sentry.

#### Performance Monitoring

- Real-time API call tracking
- Error rate monitoring
- User session tracking
- Component render performance

### Log Levels

```
VITE_LOG_LEVEL=debug   # Development - very verbose
VITE_LOG_LEVEL=info    # Staging - normal
VITE_LOG_LEVEL=warn    # Production - warnings and errors only
VITE_LOG_LEVEL=error   # Production - errors only
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check Docker logs
docker-compose logs app

# Verify image exists
docker images | grep admin-web

# Check port availability
netstat -tulpn | grep :3000
netstat -tulpn | grep :80

# Rebuild image
docker-compose down
docker build --no-cache -t admin-web:prod .
docker-compose up -d
```

### Health Checks Failing

```bash
# Test application directly
curl http://localhost:3000

# Check if app is responding
docker-compose exec app curl http://localhost:3000

# Verify network connectivity
docker-compose exec app ping api.example.com

# Check environment variables
docker-compose exec app env | grep VITE
```

### SSL Certificate Issues

```bash
# Test certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Test SSL connection
curl -v https://localhost --insecure

# Check nginx SSL configuration
docker-compose exec nginx openssl s_client -connect localhost:443
```

### API Connection Issues

```bash
# Test API connectivity from app
docker-compose exec app curl http://api-server:8000/api/health

# Check DNS resolution
docker-compose exec app nslookup api.example.com

# Verify CORS headers
curl -i -X OPTIONS http://localhost/api/ -H "Origin: http://localhost"
```

### Performance Issues

```bash
# Check container resource usage
docker stats

# Check logs for errors
docker-compose logs --tail=200

# Restart containers
docker-compose restart

# Clear unused resources
docker system prune -a
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Remove unused Docker images
docker image prune -a

# Remove unused volumes
docker volume prune

# Check log file sizes
ls -lh /var/lib/docker/containers/*/

# Rotate logs
docker-compose logs --timestamps --tail=1000 > logs.txt
```

---

## Security Checklist

- [ ] SSL certificate configured and valid
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers configured in nginx
- [ ] Rate limiting enabled
- [ ] Authentication required for API endpoints
- [ ] Sensitive environment variables not committed to git
- [ ] `.env` files added to `.gitignore`
- [ ] Docker images scanned for vulnerabilities
- [ ] Database credentials stored securely
- [ ] CORS properly configured
- [ ] Regular backups configured
- [ ] Monitoring and alerting enabled

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor application logs for errors
- Check health endpoints

**Weekly:**
- Review error tracking (Sentry)
- Check API performance metrics
- Update security patches

**Monthly:**
- Review and analyze logs
- Update dependencies
- Test disaster recovery

### Backup Strategy

```bash
# Backup application data
docker-compose exec app tar czf /backup/app-$(date +%s).tar.gz /app/data

# Backup database
docker-compose exec app mysqldump -u user -p database > backup.sql
```

### Updates

```bash
# Check for available updates
docker pull admin-web:prod

# Update and test in staging first
./deploy.sh staging deploy

# After testing, deploy to production
./deploy.sh production deploy
```

---

## Getting Help

- Check logs: `docker-compose logs -f`
- Review documentation: `DEPLOYMENT.md`, `README.md`
- Check GitHub issues: https://github.com/your-repo/issues
- Contact support: support@example.com

---

**Last Updated:** 2024
**Version:** 1.0.0
