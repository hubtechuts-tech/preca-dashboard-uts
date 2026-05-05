# Preca - Coolify Deployment Guide

Complete step-by-step guide to deploy Preca to production using Coolify.

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Coolify Setup](#coolify-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Application Deployment](#application-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Webhook Configuration](#webhook-configuration)
8. [Troubleshooting](#troubleshooting)

---

## 🔍 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] **Domain name** configured and pointing to your server
- [ ] **Stripe account** with live API keys
- [ ] **Resend account** with API key
- [ ] **Wee Trust account** with production credentials
- [ ] **Supabase project** with S3-compatible storage configured
- [ ] **Git repository** pushed to GitHub/GitLab/Bitbucket
- [ ] **Coolify instance** running and accessible

### Generate Production Secrets

Run the secrets generator script:

```bash
./scripts/generate-secrets.sh
```

**Save the output securely** - you'll need it for environment variables.

---

## ⚙️ Coolify Setup

### 1. Create New Application

1. Log into your Coolify dashboard
2. Click **"+ New Resource"**
3. Select **"Application"**
4. Choose **"Public Repository"** or **"Private Repository"**

### 2. Configure Application

**Repository Settings:**
- **Git Repository URL**: `https://github.com/yourusername/preca.git`
- **Branch**: `main` (or your production branch)
- **Build Pack**: Docker
- **Dockerfile Location**: `./Dockerfile`
- **Docker Build Target**: `production`

**General Settings:**
- **Application Name**: `preca-production`
- **Port**: `3000` (internal port)
- **Health Check Path**: `/api/health`
- **Health Check Interval**: `30s`

**Build Settings:**
- **Build Command**: (leave empty, Dockerfile handles build)
- **Start Command**: (leave empty, Dockerfile handles start)

---

## 🗄️ Database Configuration

### Create PostgreSQL Database in Coolify

1. Go to **"+ New Resource" → "Database"**
2. Select **"PostgreSQL"**
3. Configure:
   - **Database Name**: `preca-db`
   - **Version**: `16` (or latest)
   - **Username**: `preca_user`
   - **Password**: **(generate strong password)**

4. **Note the connection details** - you'll need them for `DATABASE_URL`

### Connection String Format

```bash
postgresql://USERNAME:PASSWORD@DATABASE_HOST:5432/DATABASE_NAME
```

Example:
```bash
postgresql://preca_user:your_password@preca-db:5432/preca_production
```

**Important**: Coolify databases use internal Docker network names (e.g., `preca-db`), not `localhost`.

---

## 🔐 Environment Variables

### Add Environment Variables in Coolify

Go to **Your Application → Environment Variables** and add the following:

#### **Application**
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
APP_PORT=3000
NEXT_PUBLIC_SERVER_ACTIONS_ALLOWED_ORIGINS=https://yourdomain.com
NEXT_TELEMETRY_DISABLED=1
```

#### **Database**
```bash
DATABASE_URL=postgresql://preca_user:YOUR_DB_PASSWORD@preca-db:5432/preca_production
```
*(Replace with your actual database connection string)*

#### **Authentication & Security**
```bash
SESSION_SECRET=<paste-from-generate-secrets-script>
JWT_SECRET=<paste-from-generate-secrets-script>
SESSION_MAX_AGE=86400
BCRYPT_COST=12
```

#### **Stripe Payment Integration**
```bash
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Payment URLs
STRIPE_SUCCESS_URL=https://yourdomain.com/payment/success
STRIPE_CANCEL_URL=https://yourdomain.com/payment/cancel
```

**⚠️ Important**: Use **live** keys (`sk_live_`, `pk_live_`), not test keys!

#### **Email Service (Resend)**
```bash
# Get from: https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_PROVIDER=resend
```

**Note**: Verify your domain in Resend before sending emails.

#### **Wee Trust Authorization Documents**
```bash
# Get from: https://app.weetrust.mx (production)
WEETRUST_USER_ID=your_production_user_id
WEETRUST_API_KEY=your_production_api_key
WEETRUST_BASE_URL=https://api.weetrust.mx/

# Authorization document template
AUTHORIZATION_DOCUMENT_PATH=./public/documents/carta_autorizacion.pdf
```

**⚠️ Important**: Use **production** credentials, not sandbox!

#### **File Storage (Supabase)**
```bash
# Get from: Supabase Dashboard → Project Settings → API → S3 Access Keys
SUPABASE_S3_ENDPOINT=https://your-project-ref.storage.supabase.co/storage/v1/s3
SUPABASE_S3_REGION=us-east-1
SUPABASE_ACCESS_KEY_ID=your_access_key_id
SUPABASE_SECRET_ACCESS_KEY=your_secret_access_key
SUPABASE_BUCKET=preca-reports
```

**Pre-requisite**: Create the `preca-reports` bucket in Supabase Storage (set to **private**).

#### **CORS & Security**
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://n8n.yourdomain.com
```

#### **Rate Limiting**
```bash
RATE_LIMIT_DURATION_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

#### **Feature Flags**
```bash
ENABLE_WEETRUST_VERIFICATION=false
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_STRIPE_PAYMENTS=true
```

#### **Monitoring (Optional)**
```bash
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true

# Sentry (optional, for error tracking)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## 🚀 Application Deployment

### 1. Deploy the Application

1. Click **"Deploy"** in Coolify
2. Monitor build logs for errors
3. Wait for health check to pass (status: ✅ Healthy)

### 2. Initial Database Setup

After first deployment, run migrations and seed:

```bash
# SSH into Coolify server or use Coolify's terminal
docker exec -it preca-production sh

# Inside container:
npx prisma migrate deploy
npm run db:seed

# Exit container
exit
```

This creates:
- Database tables
- Initial admin user
- Sample service catalog entries

**Default Admin Credentials:**
- Email: `admin@preca.com`
- Password: `admin123`

**⚠️ CRITICAL**: Change the admin password immediately after first login!

---

## ✅ Post-Deployment Verification

### 1. Health Check

Visit: `https://yourdomain.com/api/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-05T10:30:00.000Z",
  "uptime": 120.5,
  "database": "connected",
  "responseTime": "15ms",
  "version": "1.0.0",
  "environment": "production"
}
```

### 2. Admin Dashboard Login

1. Visit: `https://yourdomain.com/login`
2. Login with default admin credentials
3. **Change password immediately**

### 3. Test API Endpoints

```bash
# Test authentication
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@preca.com","password":"admin123"}'

# Test service catalog (requires auth)
curl https://yourdomain.com/api/services \
  -H "Cookie: session=YOUR_SESSION_COOKIE"
```

---

## 🔗 Webhook Configuration

### Stripe Webhooks

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"+ Add endpoint"**
3. Configure:
   - **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
   - **Events to send**:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
   - **API Version**: Latest

4. **Copy the Signing Secret** (`whsec_xxx`)
5. Update `STRIPE_WEBHOOK_SECRET` in Coolify environment variables
6. **Redeploy** the application

### Wee Trust Webhooks

1. Go to [Wee Trust Dashboard → Webhooks](https://app.weetrust.mx/webhooks)
2. Click **"Create Webhook"**
3. Configure:
   - **Webhook URL**: `https://yourdomain.com/api/webhooks/wee-trust`
   - **Events**:
     - `sentDocument`
     - `signedDocument`
     - `completedDocument`
   - **Status**: Active

4. Test webhook delivery using Wee Trust dashboard

---

## 🔧 Troubleshooting

### Database Connection Failed

**Symptom**: Health check shows `"database": "disconnected"`

**Solutions**:
1. Verify `DATABASE_URL` is correct
2. Ensure database container is running
3. Check database network connectivity:
   ```bash
   docker exec -it preca-production sh
   nc -zv preca-db 5432
   ```

### Webhook Not Working

**Stripe Webhooks**:
1. Check webhook logs in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Test locally with Stripe CLI:
   ```bash
   stripe listen --forward-to https://yourdomain.com/api/webhooks/stripe
   ```

**Wee Trust Webhooks**:
1. Check webhook delivery logs in Wee Trust dashboard
2. Verify endpoint is publicly accessible
3. Check application logs for webhook processing errors

### Email Not Sending

**Solutions**:
1. Verify domain is verified in Resend dashboard
2. Check `RESEND_API_KEY` is correct
3. Verify `EMAIL_FROM` matches verified domain
4. Check application logs for email errors

### File Upload Failed

**Solutions**:
1. Verify Supabase bucket `preca-reports` exists
2. Check bucket is set to **private** (not public)
3. Verify S3 credentials are correct
4. Test S3 connection:
   ```bash
   docker exec -it preca-production sh
   npm run test:storage
   ```

### CORS Errors from n8n

**Symptom**: API requests from n8n fail with CORS error

**Solutions**:
1. Add n8n domain to `ALLOWED_ORIGINS`:
   ```bash
   ALLOWED_ORIGINS=https://yourdomain.com,https://n8n.yourdomain.com
   ```
2. Redeploy application
3. Verify CORS headers in browser network tab

### Build Failed

**Common Issues**:
1. **Node version mismatch**: Dockerfile uses Node 20
2. **Missing dependencies**: Run `npm install` locally first
3. **TypeScript errors**: Run `npm run build` locally to check
4. **Prisma errors**: Ensure `prisma/schema.prisma` is committed

### Health Check Failing

**Solutions**:
1. Check application logs in Coolify
2. Verify port `3000` is exposed
3. Test health endpoint manually:
   ```bash
   curl https://yourdomain.com/api/health
   ```
4. Increase health check timeout in Coolify settings

---

## 📊 Monitoring & Maintenance

### Monitoring Checklist

- [ ] Enable Coolify uptime monitoring
- [ ] Configure Sentry for error tracking (optional)
- [ ] Set up database backup schedule (Coolify handles this)
- [ ] Monitor disk space (file uploads)
- [ ] Monitor API rate limits

### Regular Maintenance

**Weekly**:
- Review error logs
- Check webhook delivery status

**Monthly**:
- Review database backups
- Update dependencies (`npm update`)
- Rotate API keys (if compromised)

**Quarterly**:
- Rotate `SESSION_SECRET` and `JWT_SECRET`
- Security audit
- Performance optimization

---

## 🎉 Deployment Complete!

Your Preca application is now live in production!

### Next Steps

1. **Change admin password**
2. **Create API key for n8n Agent**
3. **Configure n8n workflows**
4. **Test complete user flow**:
   - Lead capture → Payment → Authorization → Report upload
5. **Monitor logs for first few days**

### Support Resources

- **Documentation**: `docs/PLAN.md`
- **API Reference**: `https://yourdomain.com/api/docs`
- **Architecture**: `docs/FEATURE_DEVELOPMENT_GUIDE.md`

---

**🚀 Happy Deploying!**
