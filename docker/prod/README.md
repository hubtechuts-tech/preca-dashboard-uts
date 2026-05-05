# Production Docker Configuration

This folder contains production Docker configuration optimized for **Coolify deployment**.

## What's Included

### `postgresql.conf`
PostgreSQL configuration file with production-optimized settings. **Only used if you run your own PostgreSQL instance**.

With Coolify's managed PostgreSQL, this file is not needed (Coolify optimizes the database automatically).

### `reference/` Folder
Contains configuration files that are **not used** with Coolify but kept for reference:
- `nginx.conf` - Reverse proxy config (Coolify handles this)
- `backup.sh` - Database backup script (Coolify handles this)

See `reference/README.md` for details.

## Coolify Deployment (Recommended)

Coolify handles these services automatically:
- ✅ PostgreSQL database (managed, optimized, backed up)
- ✅ Nginx reverse proxy (Traefik)
- ✅ SSL/TLS certificates (Let's Encrypt)
- ✅ Database backups (automated)
- ✅ Health checks
- ✅ Load balancing

**You only need to:**
1. Push code to Git
2. Create application in Coolify
3. Configure environment variables
4. Deploy

See `/docs/COOLIFY_DEPLOYMENT_GUIDE.md` for complete instructions.

## Docker Compose

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production (Coolify-optimized)
```bash
# Coolify handles this automatically
# For manual testing only:
docker-compose -f docker-compose.prod.yml up
```

**Note**: `docker-compose.prod.yml` contains only the app service. Database and other services are managed by Coolify.

## Alternative Deployment (Without Coolify)

If deploying without Coolify, you'll need to:
1. Copy files from `reference/` folder
2. Update `docker-compose.prod.yml` to include nginx, postgres, and backup services
3. Set up SSL certificates manually (Let's Encrypt or purchased)
4. Configure database backups with cron
5. Set up monitoring and alerts

This is significantly more work than using Coolify. **Coolify is the recommended deployment method.**
