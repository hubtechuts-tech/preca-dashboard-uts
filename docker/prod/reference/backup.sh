#!/bin/sh
# ===================================
# PostgreSQL Backup Script
# ===================================

set -e

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/preca_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Starting backup at $(date)"
pg_dump -U "$PGUSER" -h "$PGHOST" "$PGDATABASE" | gzip > "$BACKUP_FILE"

# Verify backup was created
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✓ Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
else
    echo "✗ Backup failed!"
    exit 1
fi

# Clean old backups (keep last N days)
echo "Cleaning backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "preca_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# List remaining backups
echo "Current backups:"
ls -lh "$BACKUP_DIR"/preca_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo "Backup completed at $(date)"
