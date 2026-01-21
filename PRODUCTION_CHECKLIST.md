# Production Setup Checklist

## Pre-Deployment Checklist

### Code Quality & Testing
- [ ] All unit tests pass: `npm test -- --run`
- [ ] All linting passes: `npm run lint`
- [ ] No console errors or warnings
- [ ] Build succeeds: `npm run build`
- [ ] Build size is optimized (check with `npm run build`)
- [ ] No console.log statements left in production code

### Environment Configuration
- [ ] `.env.production` created with correct values
- [ ] `VITE_API_BASE_URL` points to production backend
- [ ] `VITE_WEBSOCKET_URL` configured correctly
- [ ] `VITE_SENTRY_DSN` set for error monitoring
- [ ] `NODE_ENV=production` set
- [ ] `.env.production` NOT committed to git (verify in .gitignore)
- [ ] `.env` files are in .gitignore

### Docker Setup
- [ ] Dockerfile builds successfully
- [ ] Docker image builds without warnings
- [ ] Docker image size is reasonable (<300MB)
- [ ] docker-compose.yml has correct service configuration
- [ ] Health checks are configured
- [ ] Container resource limits are set (optional but recommended)
- [ ] `.dockerignore` is configured

### SSL/HTTPS Setup
- [ ] SSL certificates generated or obtained
- [ ] Certificate files placed in `ssl/` directory
- [ ] nginx.conf has correct SSL configuration
- [ ] HTTP redirects to HTTPS in production
- [ ] Security headers configured in nginx.conf
- [ ] CORS headers properly configured

### Database & API
- [ ] Backend API is deployed and accessible
- [ ] API endpoints are CORS-enabled
- [ ] Database migrations are run
- [ ] Database connection string is secure (not in code)
- [ ] API rate limiting is configured
- [ ] Authentication tokens are handled securely

### Monitoring & Logging
- [ ] Sentry account created and DSN configured
- [ ] Error logging is working
- [ ] API call tracking is enabled
- [ ] User session tracking configured
- [ ] Performance monitoring enabled
- [ ] Log level set to `warn` for production

### Security
- [ ] Security headers configured:
  - [ ] X-Frame-Options: SAMEORIGIN
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-XSS-Protection: 1; mode=block
  - [ ] Content-Security-Policy: configured
  - [ ] Strict-Transport-Security: configured
- [ ] Rate limiting configured in nginx
- [ ] DDoS protection measures in place
- [ ] No sensitive data in client-side code
- [ ] API authentication required for all endpoints
- [ ] Input validation on backend
- [ ] SQL injection protection verified
- [ ] CSRF tokens configured (if applicable)

### Performance
- [ ] Build size optimized (<500KB gzipped)
- [ ] Images optimized (WebP format, lazy loading)
- [ ] API endpoints are paginated
- [ ] Caching strategy configured
- [ ] Database indexes created for frequently queried fields
- [ ] CDN configured for static assets (optional)
- [ ] Gzip compression enabled in nginx

### Infrastructure
- [ ] Server meets minimum requirements (2GB RAM, 2 CPU)
- [ ] Sufficient disk space available (>5GB)
- [ ] Firewall rules configured correctly
- [ ] SSH access secured (key-based auth, no root login)
- [ ] Automatic security updates enabled
- [ ] Backup strategy configured
- [ ] DNS records configured correctly
- [ ] Load balancer configured (if applicable)

### Deployment Automation
- [ ] GitHub Actions workflow configured
- [ ] CI/CD pipeline tests pass
- [ ] Docker image push configured
- [ ] Deployment script tested
- [ ] Rollback procedure documented
- [ ] Zero-downtime deployment tested

### Documentation
- [ ] DEPLOYMENT.md reviewed and updated
- [ ] Troubleshooting guide created
- [ ] API documentation created
- [ ] Environment variables documented
- [ ] Database schema documented
- [ ] Deployment runbook created

---

## Deployment Day Checklist

### Pre-Deployment
- [ ] Backup current production state
- [ ] Notify team about deployment
- [ ] All team members have access to rollback procedure
- [ ] Monitoring dashboards ready
- [ ] Incident response plan reviewed

### Deployment Steps
1. [ ] Pull latest code: `git pull origin main`
2. [ ] Load environment: `export $(cat .env.production | xargs)`
3. [ ] Build image: `docker build -t admin-web:prod .`
4. [ ] Test image: `docker run -it admin-web:prod npm test`
5. [ ] Deploy: `./deploy.sh production deploy`
6. [ ] Monitor: `docker-compose logs -f`

### Post-Deployment Verification (First 15 minutes)
- [ ] Application loads without errors
- [ ] Health check endpoints respond (200 OK)
- [ ] Login functionality works
- [ ] Key user flows work correctly
- [ ] API calls succeed
- [ ] WebSocket connections established
- [ ] No console errors visible
- [ ] Sentry not showing new critical errors
- [ ] Performance metrics look normal

### Post-Deployment Monitoring (First 24 hours)
- [ ] Monitor error rates in Sentry
- [ ] Monitor API response times
- [ ] Monitor server resource usage
- [ ] Monitor user sessions
- [ ] Check for any reported issues
- [ ] Review logs for warnings/errors

---

## Environment Variables Reference

```bash
# Core Settings
VITE_ENV=production              # Environment name
NODE_ENV=production              # Node environment
VITE_APP_VERSION=1.0.0          # Application version

# API Configuration
VITE_API_BASE_URL=https://api.example.com    # Backend API URL
VITE_API_TIMEOUT=30000          # API timeout in ms

# WebSocket
VITE_WEBSOCKET_URL=wss://api.example.com     # WebSocket server
VITE_WEBSOCKET_RECONNECT_ATTEMPTS=5          # Reconnect attempts
VITE_WEBSOCKET_RECONNECT_DELAY=3000          # Reconnect delay in ms

# Logging
VITE_LOG_LEVEL=warn             # Log level: debug, info, warn, error
VITE_LOG_TO_SERVER=true         # Send logs to server

# Monitoring
VITE_SENTRY_DSN=https://...     # Sentry DSN for error tracking
VITE_ENABLE_PERFORMANCE_MONITORING=true      # Performance tracking

# Features
VITE_ENABLE_DEV_TOOLS=false     # Dev tools (always false in production)
VITE_ENABLE_ERROR_OVERLAY=false # Error overlay (always false in production)
VITE_ENABLE_ANALYTICS=true      # Analytics tracking

# Security
VITE_SECURE_COOKIES=true        # Use secure flag for cookies
VITE_CORS_ENABLED=true          # CORS enabled

# Performance
VITE_ENABLE_COMPRESSION=true    # Enable gzip compression
VITE_CACHE_DURATION=3600        # Cache duration in seconds
```

---

## Rollback Procedure

If something goes wrong during deployment:

```bash
# 1. Stop current deployment
docker-compose down

# 2. View previous image versions
docker images | grep admin-web

# 3. Set previous version
export PREVIOUS_VERSION=<previous-tag>

# 4. Rollback
./deploy.sh production rollback

# 5. Verify
docker-compose ps
curl http://localhost/health

# 6. Investigate issue
docker-compose logs app
```

---

## Post-Deployment Tasks

### Day 1
- [ ] Verify all key features work
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify backups are working

### Week 1
- [ ] Review user feedback
- [ ] Analyze usage patterns
- [ ] Performance optimization opportunities
- [ ] Security audit

### Month 1
- [ ] Disaster recovery test
- [ ] Database maintenance
- [ ] Log rotation verification
- [ ] Dependency update check

---

## Quick Commands Reference

```bash
# Build and deploy
./deploy.sh production deploy

# View logs
./deploy.sh production logs

# Restart services
./deploy.sh production restart

# Health check
./deploy.sh production health

# Rollback
PREVIOUS_VERSION=v1.0.0 ./deploy.sh production rollback

# Generate SSL certificates
./generate-ssl.sh

# Check container status
docker-compose ps

# Stop all services
docker-compose down

# View resource usage
docker stats

# Execute command in container
docker-compose exec app npm run build

# Remove unused resources
docker system prune -a
```

---

**Created:** 2024
**Version:** 1.0
**Status:** Ready for Production Deployment
