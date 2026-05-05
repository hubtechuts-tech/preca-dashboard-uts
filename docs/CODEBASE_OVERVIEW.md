# PRECA - Codebase Overview

**Last Updated**: January 2026
**Purpose**: Quick reference for AI assistants to understand the codebase without extensive exploration

---

## 1. Project Architecture

**Framework**: Next.js 14 (App Router) with TypeScript
**Architecture Pattern**: Clean Architecture (Hexagonal Architecture)
**Database**: PostgreSQL with Prisma ORM
**Storage**: Cloudflare R2 (S3-compatible)
**Payments**: Stripe
**Email**: Resend API
**Auth**: Custom JWT-based authentication

### Layer Dependencies (Clean Architecture)
```
Presentation (Next.js Routes, UI Components)
    ↓ depends on
Application (Use Cases, DTOs, Business Logic)
    ↓ depends on
Domain (Entities, Interfaces, Business Rules) ← CORE
    ↑ implemented by
Infrastructure (Repositories, Services, Database)
```

**Golden Rule**: Domain layer has NO dependencies. All dependencies point inward.

---

## 2. Directory Structure

```
preca/
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Database migrations
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       ├── screenings/    # Screening management UI
│   │   │       ├── clients/       # Client management UI
│   │   │       ├── advisors/      # Advisor management UI
│   │   │       └── services/      # Service catalog UI
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── advisors/      # Advisor CRUD (admin only)
│   │   │   │   └── screenings/    # Admin screening operations
│   │   │   ├── screenings/        # Main screening API
│   │   │   ├── clients/           # Client management
│   │   │   ├── files/             # File access with signed URLs
│   │   │   ├── auth/              # Authentication
│   │   │   └── public/            # Public endpoints (no auth)
│   │   └── (public)/              # Public pages
│   ├── application/               # APPLICATION LAYER
│   │   ├── use-cases/
│   │   │   ├── screening/         # Screening business logic
│   │   │   ├── advisor/           # Advisor business logic
│   │   │   ├── client/            # Client business logic
│   │   │   ├── report/            # Report operations
│   │   │   └── public/            # Public screening creation
│   │   └── dto/                   # Data Transfer Objects
│   │       ├── screening/
│   │       ├── advisor/
│   │       └── client/
│   ├── domain/                    # DOMAIN LAYER (Core)
│   │   ├── entities/
│   │   │   ├── Screening.ts       # Main entity
│   │   │   ├── User.ts
│   │   │   ├── Advisor.ts
│   │   │   ├── ServiceCatalog.ts
│   │   │   └── Permission.ts
│   │   ├── interfaces/
│   │   │   ├── repositories/      # Repository contracts
│   │   │   └── services/          # Service contracts
│   │   └── errors/                # Domain-specific errors
│   ├── infrastructure/            # INFRASTRUCTURE LAYER
│   │   ├── database/
│   │   │   ├── repositories/      # Prisma implementations
│   │   │   └── PrismaClient.ts
│   │   └── services/
│   │       ├── SupabaseStorageService.ts   # R2 storage
│   │       ├── StripeService.ts
│   │       ├── ResendEmailService.ts
│   │       └── WeeTrustService.ts
│   ├── components/                # React components
│   │   ├── ui/                    # shadcn/ui components
│   │   └── dashboard/
│   │       ├── screenings/
│   │       ├── advisors/
│   │       └── clients/
│   └── lib/                       # Utilities
│       ├── api-auth.ts            # Authentication helpers
│       ├── permissions.ts         # Permission checking
│       └── file-token.ts          # File access tokens
└── docs/
    ├── FEATURE_DEVELOPMENT_GUIDE.md
    ├── CODEBASE_OVERVIEW.md (this file)
    └── PLAN.md
```

---

## 3. Database Schema (Key Models)

### screenings (Main Entity)
```typescript
{
  id: string (UUID)
  user_id: string | null          // Client who created it
  service_id: number               // Service catalog reference
  advisor_id: number | null        // Advisor who referred
  status: enum                     // Workflow status
  applicant_name: string
  applicant_email: string
  applicant_phone: string | null
  form_data: JSON                  // Dynamic form data

  // Payment
  stripe_session_id: string | null
  payment_amount: Decimal | null
  payment_completed_at: DateTime | null
  payment_link_url: string | null

  // WeeTrust Authorization
  wee_trust_document_id: string | null
  authorization_document_url: string | null
  authorization_signed_at: DateTime | null
  authorization_document_file_key: string | null

  // WeeTrust Identity Verification
  identity_verification_id: string | null
  identity_verification_url: string | null
  identity_verified_at: DateTime | null
  identity_verification_file_key: string | null

  // Reports
  report_url: string | null              // Legacy (deprecated)
  report_urls: string[]                  // Legacy signed URLs
  report_file_keys: string[]             // Current: file keys for reports

  // Admin
  admin_user_id: string | null
  admin_notes: string | null
  additional_emails: string[]

  completed_at: DateTime | null
  created_at: DateTime
  updated_at: DateTime
}
```

**Status Enum**: `pending_payment` → `paid` → `processing_bureau` → `completed` / `rejected`

### users
```typescript
{
  id: string (UUID)
  email: string (unique)
  password_hash: string | null
  full_name: string | null
  phone_number: string | null
  role: enum ('admin' | 'staff' | 'client')
  permissions: string[]
  is_active: boolean
  created_at: DateTime
}
```

### advisors
```typescript
{
  id: number (auto-increment)
  name: string
  email: string (unique)
  phone_number: string
  is_active: boolean
  created_at: DateTime
  updated_at: DateTime
}
```

### service_catalog
```typescript
{
  id: number
  code: string (unique)
  name: string
  description: string | null
  price_mxn: Decimal
  target_person_type: enum ('physical' | 'moral')
  stripe_product_id: string | null
  stripe_price_id: string | null
  is_active: boolean
  form_schema: JSON | null         // Dynamic form configuration
}
```

---

## 4. Key API Endpoints

### Public Endpoints (No Auth)
- `POST /api/public/screenings` - Create public screening request
- `GET /api/public/services` - List active services

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register client
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Screenings (Authenticated)
- `GET /api/screenings` - List screenings (filtered by user)
- `GET /api/screenings/:id` - Get screening details
- `POST /api/screenings/:id/report` - Upload report (admin/staff)
- `POST /api/screenings/:id/complete` - Complete screening (admin/staff)
- `POST /api/screenings/:id/additional-emails` - Add email
- `DELETE /api/screenings/:id/additional-emails` - Remove email

### Admin Only
- `GET /api/admin/advisors` - List advisors
- `POST /api/admin/advisors` - Create advisor
- `GET /api/admin/advisors/:id` - Get advisor
- `PUT /api/admin/advisors/:id` - Update advisor
- `DELETE /api/admin/advisors/:id` - Delete advisor (fails if has screenings)
- `PATCH /api/admin/advisors/:id/status` - Toggle active/inactive
- `GET /api/admin/advisors/:id/details` - Advisor with screenings & stats
- `GET /api/admin/advisors/stats` - Top advisors by screening count

### Clients
- `GET /api/clients` - List clients (admin/staff)
- `GET /api/clients/:id/details` - Client with screenings & stats

### Files (Generates fresh signed URLs)
- `GET /api/files/[...fileKey]` - Access file (auth or token-based)
  - Example: `/api/files/reports/1767119139785-report.pdf`
  - Generates fresh 5-minute signed URL and redirects
  - Handles both authenticated users and token-based access

---

## 5. Domain Entities (Core Business Objects)

### Screening Entity
**File**: `src/domain/entities/Screening.ts`

**Key Methods**:
- `create()` - Factory method for new screening
- `reconstitute()` - Factory from database
- `markAsPaid()` - Transition to paid status
- `startProcessing()` - Transition to processing
- `complete()` - Mark as completed
- `addReportUrl()` - Add report URL (deprecated)
- `addReportFileKey()` - Add report file key (current)
- `canBeCompleted()` - Business rule validation
- `requiresPayment()` - Check if payment needed

**Business Rules**:
- Cannot complete without payment (unless free service)
- Cannot process without signed authorization
- Status transitions follow strict workflow

### User Entity
**File**: `src/domain/entities/User.ts`

**Roles**: `admin`, `staff`, `client`

**Key Methods**:
- `create()` - Create new user
- `hasPermission()` - Check permission
- `isAdmin()` - Check if admin
- `authenticate()` - Verify password

### Advisor Entity
**File**: `src/domain/entities/Advisor.ts`

**Key Methods**:
- `create()` - Create new advisor
- `activate()` / `deactivate()` - Status management
- `updateContactInfo()` - Update email/phone

---

## 6. Common Patterns

### API Route Pattern
```typescript
// src/app/api/[resource]/route.ts
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request); // or requireAdmin()
    const controller = createController();
    const response = await controller.list();

    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json({ error: response.error }, { status: response.statusCode });
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    // ... handle other errors
  }
}
```

### Controller Pattern
```typescript
export class ResourceController {
  constructor(
    private useCase1: UseCase1,
    private useCase2: UseCase2
  ) {}

  async create(request: any): Promise<ApiResponse> {
    try {
      const dto = new CreateDTO(request);
      const result = await this.useCase.execute(dto);
      return {
        success: true,
        data: ResponseDTO.fromDomain(result),
        statusCode: 201
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): ApiResponse {
    // Map domain errors to HTTP responses
  }
}
```

### Use Case Pattern
```typescript
export class DoSomethingUseCase {
  constructor(
    private repository: IRepository,
    private service: IService
  ) {}

  async execute(dto: DoSomethingDTO): Promise<Result> {
    // 1. Validate
    // 2. Fetch entities
    // 3. Apply business logic
    // 4. Persist changes
    // 5. Return result
  }
}
```

---

## 7. Authentication & Permissions

### Auth Helpers (`src/lib/api-auth.ts`)
```typescript
requireAuth(request) // Returns SessionData { userId, email, role }
requireAdmin(request) // Throws ForbiddenError if not admin/staff
```

**IMPORTANT**: `requireAuth` returns an object, not a string!
```typescript
// ❌ Wrong
const userId = await requireAuth(request);

// ✅ Correct
const session = await requireAuth(request);
const userId = session.userId;
```

### Permissions (`src/domain/entities/Permission.ts`)
```typescript
enum Permission {
  SCREENINGS_READ = 'screenings:read',
  SCREENINGS_WRITE = 'screenings:write',
  ADVISORS_READ = 'advisors:read',
  ADVISORS_WRITE = 'advisors:write',
  CLIENTS_READ = 'clients:read',
  // ...
}
```

---

## 8. File Storage Architecture

### Storage Service
**Implementation**: `SupabaseStorageService` (actually Cloudflare R2)
- Uploads to R2 bucket
- Returns file key (e.g., `reports/1767119139785-report.pdf`)
- File keys stored in database (`report_file_keys[]`)

### File Access Pattern
1. **Old Way (Deprecated)**: Store full signed URLs in `report_urls[]`
   - ❌ URLs expire after 7 days → ExpiredRequest error

2. **Current Way**: Store file keys in `report_file_keys[]`
   - ✅ File key is permanent: `reports/1767119139785-report.pdf`
   - ✅ Generate fresh signed URL on-demand via `/api/files/{fileKey}`
   - ✅ URLs never expire because they're regenerated on each access

### Backward Compatibility
Frontend extracts file keys from old signed URLs:
```typescript
// Old URL: "reports/file.pdf?X-Amz-Algorithm=AWS4-..."
// Extracted: "reports/file.pdf"
// New URL: "/api/files/reports/file.pdf"
```

---

## 9. WeeTrust Integration

### Authorization Document Flow
1. Create screening → WeeTrust document created
2. Backend calls WeeTrust API to get authorization URL
3. User signs document via WeeTrust
4. Webhook updates `authorization_signed_at`

### Identity Verification Flow
1. User completes payment
2. Backend creates WeeTrust identity verification
3. User verifies identity via WeeTrust
4. Webhook updates `identity_verified_at`

**Service**: `src/infrastructure/services/WeeTrustService.ts`

---

## 10. Error Handling Patterns

### Domain Errors
```typescript
// src/domain/errors/
export class ScreeningNotFoundError extends Error { ... }
export class AdvisorNotFoundError extends Error { ... }
export class ValidationError extends Error { ... }
```

### Prisma Errors (in Controllers)
```typescript
if (error.code === 'P2002') {
  // Unique constraint violation
  return { success: false, error: 'Ya existe...', statusCode: 409 };
}
if (error.code === 'P2003') {
  // Foreign key constraint
  return { success: false, error: 'No se puede eliminar...', statusCode: 409 };
}
if (error.code === 'P2025') {
  // Record not found
  return { success: false, error: 'No encontrado', statusCode: 404 };
}
```

---

## 11. Recent Features & Changes

### Advisor Management (January 2026)
- ✅ Advisor detail page with stats (total precas, revenue, screenings history)
- ✅ Top advisors stats cards showing top 3 by preca count
- ✅ Clickable advisor names to navigate to detail page
- ✅ Proper error handling for duplicate emails/phones
- ✅ Cannot delete advisors with associated screenings

### Report URL Fix (January 2026)
- ✅ Fixed expired report URLs by using file keys
- ✅ `/api/files/{fileKey}` generates fresh signed URLs on-demand
- ✅ Backward compatibility for old signed URLs
- ✅ Clean filename display (removed AWS query parameters)

### Client Details Page (Previous)
- ✅ Client detail page with stats and screening history
- ✅ Clickable client names in screening list

---

## 12. Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Cloudflare R2 Storage
R2_ENDPOINT=https://...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=preca-files
R2_ACCOUNT_ID=...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@preca.com

# WeeTrust
WEETRUST_API_KEY=...
WEETRUST_API_URL=https://api.weetrust.com

# App
NEXT_PUBLIC_APP_URL=https://preca.com
JWT_SECRET=...
```

---

## 13. Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type check
npx tsc --noEmit

# Database
npx prisma migrate dev          # Create migration
npx prisma migrate deploy       # Apply migrations (production)
npx prisma studio              # Database GUI
npx prisma generate            # Generate Prisma Client

# Git
git add .
git commit -m "message"
git push
```

---

## 14. Important Notes for AI Assistants

### When Creating New Features
1. **Follow Clean Architecture**: Start with Domain → Infrastructure → Application → Presentation
2. **Use existing patterns**: Look at similar features (e.g., advisor vs client management)
3. **Check FEATURE_DEVELOPMENT_GUIDE.md**: Complete step-by-step guide with examples
4. **Auth pattern**: Always use `requireAuth()` or `requireAdmin()`
5. **Error handling**: Map domain errors to HTTP status codes in controllers
6. **DTOs**: Create DTOs with validation in Application layer
7. **File operations**: Use Read, Edit, Write tools (not cat/echo/sed)

### When Fixing Bugs
1. **Read first**: Always read files before editing
2. **Understand context**: Check related files (entity, repository, use case, controller)
3. **Test implications**: Consider backward compatibility
4. **Error messages**: Use Spanish for user-facing messages
5. **Prisma errors**: Handle P2002, P2003, P2025 explicitly

### Common Pitfalls to Avoid
- ❌ Don't use `requireAuth()` result directly as userId (it's an object!)
- ❌ Don't store signed URLs in database (use file keys instead)
- ❌ Don't skip reading files before editing
- ❌ Don't create new files when editing existing ones is better
- ❌ Don't use bash for file operations (use dedicated tools)

---

## 15. Quick Reference: Key Files

| Purpose | File |
|---------|------|
| Database schema | `prisma/schema.prisma` |
| Main screening entity | `src/domain/entities/Screening.ts` |
| Screening repository | `src/infrastructure/database/repositories/PrismaScreeningRepository.ts` |
| Screening API | `src/app/api/screenings/route.ts` |
| Auth helpers | `src/lib/api-auth.ts` |
| File storage service | `src/infrastructure/services/SupabaseStorageService.ts` |
| File access endpoint | `src/app/api/files/[...fileKey]/route.ts` |
| Advisor detail page | `src/app/(dashboard)/dashboard/advisors/[id]/page.tsx` |
| Feature guide | `docs/FEATURE_DEVELOPMENT_GUIDE.md` |

---

**This document provides 80% of the context needed to start development without extensive exploration. For detailed implementation examples, refer to FEATURE_DEVELOPMENT_GUIDE.md.**
