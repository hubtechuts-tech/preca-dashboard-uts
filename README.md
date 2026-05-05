# Preca - Tenant Screening Platform for Mexico

**Preca** is a production-ready tenant screening platform that bridges AI-driven lead capture with human-verified credit bureau checks, following strict Clean Architecture principles.

## 🚀 Quick Start

### Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/preca.git
cd preca

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development environment with Docker
npm run docker:dev

# Or run locally (requires PostgreSQL)
npm run dev
```

The application will be available at `http://localhost:3000`

**Default Development Credentials:**
- Email: `admin@preca.com`
- Password: `admin123`

### Database Setup

```bash
# Run migrations
npm run prisma:migrate:dev

# Seed initial data (admin user + sample services)
npm run db:seed

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

---

## 📋 Project Overview

### Core Workflow

1. **Lead Capture**: n8n AI Agent collects user data via chat
2. **Registration**: Agent calls API to create screening request
3. **Payment**: System generates Stripe Payment Link
4. **Verification**: User completes identity verification (Wee Trust API)
5. **Manual Processing**: Admin reviews credit bureau and uploads report
6. **Communication**: Automated emails at key stages

### Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 16+ with Prisma ORM
- **Auth**: JWT Sessions (Humans) + API Keys (Bots)
- **Payment**: Stripe Payment Links + Webhooks
- **Email**: Resend
- **Verification**: Wee Trust API (Document Signing)
- **Storage**: Supabase S3-Compatible Storage
- **Infrastructure**: Docker, Coolify

---

## 🏗️ Architecture

This project follows **Clean Architecture** principles with clear separation of concerns:

```
preca/
├── src/
│   ├── domain/              # Business entities & interfaces (no dependencies)
│   ├── application/         # Use cases & business logic
│   ├── infrastructure/      # External services & database
│   └── presentation/        # Next.js UI & API routes
├── prisma/                  # Database schema & migrations
├── docker/                  # Docker configurations
├── docs/                    # Documentation
└── scripts/                 # Utility scripts
```

**Dependency Rule**: Code dependencies point inward only. Domain layer has zero external dependencies.

See [`docs/PLAN.md`](docs/PLAN.md) for detailed architecture documentation.

---

## 🚢 Production Deployment

### Deploy with Coolify

This application is optimized for deployment with Coolify, which handles:
- SSL/TLS certificates (Let's Encrypt)
- Reverse proxy
- Database management
- Automated backups
- CI/CD pipeline

**📖 Complete Deployment Guide**: See [`docs/COOLIFY_DEPLOYMENT_GUIDE.md`](docs/COOLIFY_DEPLOYMENT_GUIDE.md)

### Quick Deployment Steps

1. **Generate production secrets:**
   ```bash
   ./scripts/generate-secrets.sh
   ```

2. **Configure Coolify:**
   - Create new Application from Git repository
   - Create PostgreSQL database
   - Add environment variables (see deployment guide)

3. **Deploy application:**
   - Coolify automatically builds and deploys
   - Migrations run on startup

4. **Post-deployment:**
   - Verify health check: `https://yourdomain.com/api/health`
   - Login to admin dashboard
   - Configure webhooks (Stripe, Wee Trust)

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and configure:

### Critical Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Security
SESSION_SECRET=<generate-with-script>
JWT_SECRET=<generate-with-script>

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com

# Wee Trust
WEETRUST_USER_ID=xxx
WEETRUST_API_KEY=xxx

# Supabase Storage
SUPABASE_S3_ENDPOINT=https://xxx.storage.supabase.co/storage/v1/s3
SUPABASE_ACCESS_KEY_ID=xxx
SUPABASE_SECRET_ACCESS_KEY=xxx
```

See [`.env.example`](.env.example) for complete configuration.

---

## 📚 API Documentation

### Authentication

**Human Users (Admin/Clients):**
- Session-based authentication with JWT
- Login: `POST /api/auth/login`

**System Bots (n8n Agent):**
- API Key authentication via `Authorization: Bearer <key>` header
- Create keys in Admin Dashboard → API Keys

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check (database status) |
| `/api/auth/login` | POST | User login |
| `/api/services` | GET, POST | Service catalog management |
| `/api/screenings` | POST, GET | Create and list screenings |
| `/api/screenings/:id` | GET, PUT | View and update screening |
| `/api/webhooks/stripe` | POST | Stripe webhook handler |
| `/api/webhooks/wee-trust` | POST | Wee Trust webhook handler |

**📖 Interactive API Documentation**: `https://yourdomain.com/api/docs`

### Example: Create Screening (n8n Agent)

```bash
curl -X POST https://yourdomain.com/api/screenings \
  -H "Authorization: Bearer preca_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 1,
    "applicantName": "Juan Pérez",
    "applicantEmail": "juan@example.com",
    "applicantPhone": "+52 555 123 4567",
    "formData": {
      "address": "Calle Principal 123",
      "city": "Ciudad de México"
    }
  }'
```

Response includes `paymentLinkUrl` for user to complete payment.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

---

## 📂 Project Structure

```
preca/
├── src/
│   ├── domain/                           # Core business logic
│   │   ├── entities/                     # Business entities
│   │   ├── interfaces/repositories/      # Repository contracts
│   │   └── interfaces/services/          # Service contracts
│   │
│   ├── application/                      # Use cases
│   │   ├── use-cases/auth/               # Authentication
│   │   ├── use-cases/screening/          # Screening workflow
│   │   ├── use-cases/payment/            # Payment processing
│   │   └── dto/                          # Data transfer objects
│   │
│   ├── infrastructure/                   # External implementations
│   │   ├── database/repositories/        # Prisma repositories
│   │   ├── services/                     # Email, Stripe, Wee Trust
│   │   └── security/                     # Password hashing, JWT
│   │
│   └── presentation/                     # Next.js layer
│       ├── app/(auth)/                   # Login pages
│       ├── app/(dashboard)/              # Admin dashboard
│       ├── app/api/                      # API routes
│       ├── components/                   # UI components
│       └── middleware/                   # Auth middleware
│
├── prisma/
│   ├── schema.prisma                     # Database schema
│   └── migrations/                       # Migration history
│
├── docker/
│   ├── dev/                              # Development config
│   └── prod/                             # Production config
│
├── docs/
│   ├── PLAN.md                           # Implementation roadmap
│   ├── COOLIFY_DEPLOYMENT_GUIDE.md       # Deployment instructions
│   └── FEATURE_DEVELOPMENT_GUIDE.md      # Development guide
│
└── scripts/
    └── generate-secrets.sh               # Security secrets generator
```

---

## 🔒 Security Features

- ✅ Security headers (XSS, Clickjacking, HSTS)
- ✅ Rate limiting (100 requests/min per IP)
- ✅ CORS protection
- ✅ JWT session authentication
- ✅ API key authentication (SHA-256 hashed)
- ✅ HTTPS enforced (production)
- ✅ Password hashing (bcrypt, cost factor 12)
- ✅ SQL injection protection (Prisma ORM)
- ✅ Stripe webhook signature verification

---

## 📖 Documentation

- **[Implementation Roadmap](docs/PLAN.md)** - Complete project plan and progress
- **[Coolify Deployment Guide](docs/COOLIFY_DEPLOYMENT_GUIDE.md)** - Production deployment
- **[Feature Development Guide](docs/FEATURE_DEVELOPMENT_GUIDE.md)** - Clean Architecture patterns
- **[API Reference](https://yourdomain.com/api/docs)** - Interactive API documentation

---

## 🤝 Contributing

This project follows Clean Architecture principles. When adding features:

1. **Start with Domain Layer**: Define entities and interfaces
2. **Infrastructure Layer**: Implement database/external services
3. **Application Layer**: Create use cases
4. **Presentation Layer**: Add API routes and UI

See [`docs/FEATURE_DEVELOPMENT_GUIDE.md`](docs/FEATURE_DEVELOPMENT_GUIDE.md) for detailed guidelines.

---

## 📜 License

Proprietary - All rights reserved

---

## 📞 Support

For issues or questions:
- Check documentation in `/docs`
- Review deployment guide for production issues
- Contact: support@preca.mx

---

**Built with ❤️ using Clean Architecture**
