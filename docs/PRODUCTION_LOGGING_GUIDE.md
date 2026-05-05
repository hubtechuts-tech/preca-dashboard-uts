# Production Logging Guide

## Overview

This guide explains how to view and analyze detailed logs in your production environment to debug issues like the Wee Trust 504 Gateway Timeout.

## Understanding the 504 Gateway Timeout

A **504 Gateway Timeout** occurs when:
- The upstream server (Wee Trust API) takes too long to respond
- The reverse proxy/gateway times out waiting for a response
- Network connectivity issues between servers

Possible causes:
1. **Large PDF files** - The authorization document might be too large
2. **Wee Trust API issues** - Their sandbox API might be slow or overloaded
3. **Network problems** - Connectivity issues between your server and Wee Trust
4. **Server resource constraints** - Your server might be under high load

## Viewing Production Logs

### Method 1: Docker/Coolify Logs (Real-time)

If you're using Coolify or Docker, view logs in real-time:

```bash
# View all logs from the application container
docker logs -f <container_name>

# Or if using Coolify CLI
coolify logs -f <service_name>
```

To find your container name:
```bash
docker ps | grep preca
```

### Method 2: SSH into Production Server

```bash
# SSH into your production server
ssh user@preca.admin.botia.pro

# Navigate to your application directory
cd /path/to/preca

# View logs (if using PM2)
pm2 logs preca --lines 200

# Or view Node.js console output
tail -f /var/log/preca/app.log
```

### Method 3: Filter Logs for WeeTrust Service

To see only WeeTrust-related logs:

```bash
# Using grep to filter
docker logs <container_name> 2>&1 | grep "WeeTrustService"

# Or save to a file for analysis
docker logs <container_name> 2>&1 | grep "WeeTrustService" > weetrust-logs.txt
```

## Analyzing the Enhanced Logs

The enhanced logging in `WeeTrustService.createDocument()` now provides:

### 1. Request Start Information
```
[WeeTrustService] ========================================
[WeeTrustService] Starting document upload
[WeeTrustService] File: authorization-document-abc123.pdf
[WeeTrustService] File size: 245.67 KB
[WeeTrustService] URL: https://api-sandbox.weetrust.com.mx/documents
[WeeTrustService] User ID: your-user-id
[WeeTrustService] Timestamp: 2025-12-10T15:30:45.123Z
```

**What to check:**
- **File size**: If > 5MB, might cause timeout
- **URL**: Verify it's the correct Wee Trust endpoint
- **Timestamp**: Correlate with when the 504 occurred

### 2. Response Timing
```
[WeeTrustService] Response received after 125000ms
[WeeTrustService] Status: 504 Gateway Time-out
```

**What to check:**
- **Elapsed time**: If > 120000ms (2 minutes), it's hitting the default timeout
- **Status code**: 504 means upstream timeout, not a client-side issue

### 3. Error Details
```
[WeeTrustService] ❌ Exception during upload
[WeeTrustService] Error type: FetchError
[WeeTrustService] Error message: network timeout at: https://api-sandbox.weetrust.com.mx/documents
[WeeTrustService] Time before error: 120543ms
[WeeTrustService] Stack trace: [full stack trace]
```

**What to check:**
- **Error type**: Network errors vs API errors
- **Error message**: Specific details about what failed
- **Time before error**: How long before the timeout

## Debugging the 504 Issue

### Step 1: Test with Retry Button

1. Go to the screening detail page in the admin dashboard
2. Click the "Reintentar" button
3. Monitor the logs in real-time (using Method 1 above)
4. Look for the enhanced log output

### Step 2: Check File Size

```bash
# SSH into server and check PDF size
ls -lh /tmp/authorization-*.pdf

# Or add this to the logs (already done in enhanced logging)
```

If files are consistently > 2MB, consider:
- Optimizing PDF generation
- Compressing PDFs before upload

### Step 3: Test Wee Trust API Directly

Test if Wee Trust API is responding:

```bash
# Get access token
curl -X POST https://api-sandbox.weetrust.com.mx/access/token \
  -H "user-id: YOUR_USER_ID" \
  -H "api-key: YOUR_API_KEY" \
  -w "\nTime: %{time_total}s\n"

# Check response time - should be < 5 seconds
```

### Step 4: Increase Timeout (if needed)

If Wee Trust legitimately needs more time, increase the fetch timeout:

In `src/infrastructure/services/WeeTrustService.ts`:

```typescript
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'token': token,
    'user-id': this.userId,
    ...formData.getHeaders()
  },
  body: formData as unknown as BodyInit,
  signal: AbortSignal.timeout(180000) // 3 minutes instead of default 2
});
```

## Production Logging Best Practices

### Current Setup (Console Logs)

✅ **Pros:**
- Simple to implement
- Works with any hosting provider
- No external dependencies

❌ **Cons:**
- Logs are lost when container restarts
- Hard to search across multiple servers
- No alerting capabilities

### Recommended: Add Log Aggregation

Consider adding a proper logging service:

#### Option 1: Better Stack (formerly Logtail)

```bash
npm install @logtail/node @logtail/winston
```

```typescript
// src/lib/logger.ts
import { Logtail } from '@logtail/node';

export const logger = new Logtail(process.env.LOGTAIL_TOKEN!);
```

**Benefits:**
- Real-time log streaming
- Search and filter logs
- Alerts on errors
- Free tier: 1GB/month

#### Option 2: Sentry (for errors)

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

**Benefits:**
- Automatic error tracking
- Performance monitoring
- Stack traces with source maps
- Free tier: 5k events/month

#### Option 3: Self-hosted (Free)

Use **Grafana Loki** + **Promtail**:

```yaml
# docker-compose.yml
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
```

## Immediate Action Items

1. **View current logs:**
   ```bash
   docker logs -f <your-container-name> | grep WeeTrustService
   ```

2. **Test retry button** with a failed screening

3. **Monitor the detailed output** to identify:
   - How long requests take before failing
   - What the exact error message is
   - If file size is the issue

4. **Share findings** - Once you see the detailed logs, you'll know:
   - Is it timing out after exactly 2 minutes? → Need to increase timeout
   - Is the file too large? → Need to optimize PDF generation
   - Is Wee Trust API slow? → Contact Wee Trust support

## Quick Commands Reference

```bash
# Real-time logs (Docker)
docker logs -f $(docker ps | grep preca | awk '{print $1}')

# Filter for WeeTrust only
docker logs -f $(docker ps | grep preca | awk '{print $1}') 2>&1 | grep WeeTrust

# Filter for errors only
docker logs -f $(docker ps | grep preca | awk '{print $1}') 2>&1 | grep -E "ERROR|❌|Failed"

# Save logs to file for analysis
docker logs $(docker ps | grep preca | awk '{print $1}') > preca-logs-$(date +%Y%m%d-%H%M%S).txt

# Count 504 errors
docker logs $(docker ps | grep preca | awk '{print $1}') 2>&1 | grep -c "504"
```

## Next Steps

1. ✅ Enhanced logging is now in place
2. 🔄 Use retry button to trigger a new upload attempt
3. 📊 Monitor logs to see detailed timing and error info
4. 🐛 Debug based on what the logs reveal
5. 🚀 Consider implementing log aggregation for better production visibility
