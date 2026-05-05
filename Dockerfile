# syntax=docker.io/docker/dockerfile:1

FROM node:20-alpine AS base

# Install ALL dependencies (for building)
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
# Force development mode to install ALL dependencies including devDependencies
# This overrides any NODE_ENV build args from Coolify
RUN NODE_ENV=development npm ci

# Install ONLY production dependencies (for runtime)
FROM base AS prod-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
# Explicitly set production mode to install only production dependencies
RUN NODE_ENV=production npm ci

# Build application
FROM base AS build

# Accept build arguments for Next.js client bundle
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SERVER_ACTIONS_ALLOWED_ORIGINS

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Set NEXT_PUBLIC_* for client-side bundle
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_SERVER_ACTIONS_ALLOWED_ORIGINS=${NEXT_PUBLIC_SERVER_ACTIONS_ALLOWED_ORIGINS}

RUN npm run build

# Production runner
FROM base AS production
WORKDIR /app

# Install wget for health check and Chromium dependencies for PDF generation
RUN apk add --no-cache \
    wget \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto \
    font-noto-cjk

# Set Puppeteer to use system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME="0.0.0.0" \
    PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build /app/public ./public

RUN mkdir .next

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy entrypoint script
COPY --from=build --chown=nextjs:nodejs /app/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Copy seed files and source code for seeding
COPY --from=build --chown=nextjs:nodejs /app/src ./src
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=build --chown=nextjs:nodejs /app/package.json ./package.json

# Copy production-only node_modules (smaller footprint)
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
# Copy generated Prisma client from build stage
COPY --from=build --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Install tsx for running seeds (better ESM support)
RUN npm install -g tsx

# Create uploads directory
RUN mkdir -p uploads && chown -R nextjs:nodejs uploads

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
