# Reference Files

This folder contains configuration files that are **NOT used** when deploying with Coolify, but are kept for reference or for alternative deployment methods.

## Files in This Folder

### `nginx.conf`
**Status**: Not used with Coolify

Nginx reverse proxy configuration. Coolify handles reverse proxy, SSL/TLS certificates, and load balancing automatically, so this file is not needed.

**If you deploy without Coolify**, you can use this nginx configuration for:
- Reverse proxy setup
- SSL/TLS termination
- Rate limiting at the proxy level
- Static file serving

### `backup.sh`
**Status**: Not used with Coolify

PostgreSQL backup script. Coolify provides automated database backups through its managed PostgreSQL service.

**If you deploy without Coolify** or want to run manual backups, you can use this script with cron:
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

## Coolify Deployment

When deploying with Coolify, these services are handled automatically:

- **Reverse Proxy**: Coolify's built-in Traefik reverse proxy
- **SSL/TLS**: Automatic Let's Encrypt certificate management
- **Database Backups**: Automated PostgreSQL backups via Coolify
- **Load Balancing**: Automatic load balancing for scaled applications
- **Health Checks**: Configured via Coolify UI

See `docs/COOLIFY_DEPLOYMENT_GUIDE.md` for complete deployment instructions.

## Alternative Deployments

If you're deploying **without Coolify** (e.g., direct Docker Compose, VPS, etc.), you can:

1. Copy these files back to `docker/prod/`
2. Update `docker-compose.prod.yml` to include nginx and backup services
3. Configure SSL certificates manually
4. Set up cron jobs for backups

For questions, see the deployment guide or project documentation.
