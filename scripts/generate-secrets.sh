#!/bin/bash

# ===================================
# Production Secrets Generator
# ===================================
# Generates cryptographically secure random secrets for production deployment.
#
# Usage:
#   chmod +x scripts/generate-secrets.sh
#   ./scripts/generate-secrets.sh
#
# Copy the output and add to your Coolify environment variables.

set -e

echo "=================================================="
echo "🔐 Preca Production Secrets Generator"
echo "=================================================="
echo ""
echo "Copy these values to your Coolify environment variables:"
echo ""
echo "---------------------------------------------------"

# Generate SESSION_SECRET (64 characters)
SESSION_SECRET=$(openssl rand -base64 48)
echo "SESSION_SECRET=${SESSION_SECRET}"

# Generate JWT_SECRET (64 characters)
JWT_SECRET=$(openssl rand -base64 48)
echo "JWT_SECRET=${JWT_SECRET}"

echo ""
echo "---------------------------------------------------"
echo "✅ Secrets generated successfully!"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "   1. Never commit these secrets to Git"
echo "   2. Store them securely in Coolify's environment variables"
echo "   3. Different secrets for staging and production"
echo "   4. Rotate secrets periodically (every 90 days recommended)"
echo "=================================================="
echo ""
echo "📋 Next Steps:"
echo "   1. Copy the secrets above"
echo "   2. Go to Coolify → Your Application → Environment Variables"
echo "   3. Add SESSION_SECRET and JWT_SECRET"
echo "   4. Add other required environment variables from .env.example"
echo "   5. Deploy your application"
echo "=================================================="
