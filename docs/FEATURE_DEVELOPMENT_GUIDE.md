# Feature Development Guide - Clean Architecture

This guide shows you how to build new features and API routes following Clean Architecture principles in this project.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Flow](#development-flow)
3. [Step-by-Step: Creating a New Feature](#step-by-step-creating-a-new-feature)
4. [Example: Creating a "Create Screening" Feature](#example-creating-a-create-screening-feature)
5. [Best Practices](#best-practices)
6. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  (Next.js Routes, Controllers, UI Components)               │
│                                                             │
│  Dependencies: Application, Infrastructure                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
│         (Use Cases, DTOs, Business Logic)                   │
│                                                             │
│  Dependencies: Domain only                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│    (Entities, Interfaces, Business Rules, Errors)           │
│                                                             │
│  Dependencies: NONE (Pure TypeScript)                       │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│  (Repositories, Services, Database, External APIs)          │
│                                                             │
│  Dependencies: Domain (implements interfaces)               │
└─────────────────────────────────────────────────────────────┘
```

**Golden Rule**: Dependencies flow INWARD. Domain never depends on outer layers.

---

## Development Flow

When building a new feature, follow this order:

```
1. Domain Layer
   ↓
2. Infrastructure Layer
   ↓
3. Application Layer
   ↓
4. Presentation Layer
```

**Why this order?**
- You start with business rules and entities
- Then implement data access and external services
- Then create use cases that orchestrate the logic
- Finally, expose it via HTTP routes

---

## Step-by-Step: Creating a New Feature

### Step 1: Domain Layer (Business Logic)

#### 1.1 Create Entity (if needed)
**File**: `src/domain/entities/YourEntity.ts`

```typescript
// Example: Screening entity
export class Screening {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly serviceId: string,
    public readonly status: ScreeningStatus,
    public readonly applicantName: string,
    public readonly applicantEmail: string
  ) {}

  // Business rules go here
  canBeProcessed(): boolean {
    return this.status === ScreeningStatus.PAID;
  }
}

export enum ScreeningStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  PROCESSING = 'processing',
  COMPLETED = 'completed'
}
```

#### 1.2 Define Repository Interface
**File**: `src/domain/interfaces/repositories/IYourRepository.ts`

```typescript
import { YourEntity } from '../../entities/YourEntity';

export interface IYourRepository {
  findById(id: string): Promise<YourEntity | null>;
  save(entity: YourEntity): Promise<YourEntity>;
  // Add other methods as needed
}
```

#### 1.3 Create Domain Errors
**File**: `src/domain/errors/YourErrors.ts`

```typescript
export class EntityNotFoundError extends Error {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id ${id} not found`);
    this.name = 'EntityNotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

---

### Step 2: Infrastructure Layer (Implementations)

#### 2.1 Implement Repository
**File**: `src/infrastructure/database/repositories/PrismaYourRepository.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { IYourRepository } from '../../../domain/interfaces/repositories/IYourRepository';
import { YourEntity } from '../../../domain/entities/YourEntity';

export class PrismaYourRepository implements IYourRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<YourEntity | null> {
    const record = await this.prisma.yourTable.findUnique({
      where: { id }
    });

    if (!record) return null;

    // Map Prisma model to domain entity
    return this.toDomain(record);
  }

  async save(entity: YourEntity): Promise<YourEntity> {
    const data = this.toPrisma(entity);

    const saved = await this.prisma.yourTable.upsert({
      where: { id: entity.id },
      update: data,
      create: data
    });

    return this.toDomain(saved);
  }

  private toDomain(record: any): YourEntity {
    return new YourEntity(
      record.id,
      record.userId,
      record.serviceId,
      record.status,
      record.applicantName,
      record.applicantEmail
    );
  }

  private toPrisma(domain: YourEntity) {
    return {
      id: domain.id,
      userId: domain.userId,
      serviceId: domain.serviceId,
      status: domain.status,
      applicantName: domain.applicantName,
      applicantEmail: domain.applicantEmail
    };
  }
}
```

#### 2.2 Create External Service (if needed)
**File**: `src/infrastructure/services/YourExternalService.ts`

```typescript
import { IYourService } from '../../domain/interfaces/services/IYourService';

export class YourExternalService implements IYourService {
  async performAction(data: string): Promise<void> {
    // Call external API, send email, etc.
  }
}
```

---

### Step 3: Application Layer (Use Cases)

#### 3.1 Create DTO (Data Transfer Object)
**File**: `src/application/dto/your-feature/YourDTO.ts`

```typescript
export class CreateScreeningDTO {
  serviceId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;

  constructor(data: any) {
    this.serviceId = data.serviceId;
    this.applicantName = data.applicantName;
    this.applicantEmail = data.applicantEmail;
    this.applicantPhone = data.applicantPhone;
    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    if (!this.serviceId) errors.push('Service ID is required');
    if (!this.applicantName) errors.push('Applicant name is required');
    if (!this.applicantEmail) errors.push('Applicant email is required');
    if (this.applicantEmail && !this.isValidEmail(this.applicantEmail)) {
      errors.push('Invalid email format');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

#### 3.2 Create Use Case
**File**: `src/application/use-cases/your-feature/YourUseCase.ts`

```typescript
import { IYourRepository } from '../../../domain/interfaces/repositories/IYourRepository';
import { YourEntity } from '../../../domain/entities/YourEntity';
import { CreateScreeningDTO } from '../../dto/your-feature/YourDTO';

export class CreateScreeningUseCase {
  constructor(
    private screeningRepository: IScreeningRepository,
    private serviceRepository: IServiceRepository
  ) {}

  async execute(dto: CreateScreeningDTO, userId?: string): Promise<Screening> {
    // 1. Validate service exists
    const service = await this.serviceRepository.findById(dto.serviceId);
    if (!service) {
      throw new EntityNotFoundError('Service', dto.serviceId);
    }

    // 2. Create screening entity
    const screening = new Screening(
      crypto.randomUUID(), // or use ID generator
      userId || null,
      dto.serviceId,
      ScreeningStatus.PENDING_PAYMENT,
      dto.applicantName,
      dto.applicantEmail
    );

    // 3. Save to repository
    const saved = await this.screeningRepository.save(screening);

    // 4. Return created entity
    return saved;
  }
}
```

---

### Step 4: Presentation Layer (Routes & Controllers)

#### 4.1 Create Controller
**File**: `src/app/api/your-feature/_controllers/YourController.ts`

```typescript
import { YourUseCase } from '@/application/use-cases/your-feature/YourUseCase';
import { CreateScreeningDTO } from '@/application/dto/your-feature/YourDTO';
import { EntityNotFoundError } from '@/domain/errors/YourErrors';

interface CreateRequest {
  serviceId: string;
  applicantName: string;
  applicantEmail: string;
}

interface CreateResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode: number;
}

export class YourController {
  constructor(private useCase: YourUseCase) {}

  async create(request: CreateRequest, userId?: string): Promise<CreateResponse> {
    try {
      // 1. Validate with DTO
      const dto = new CreateScreeningDTO(request);

      // 2. Execute use case
      const result = await this.useCase.execute(dto, userId);

      // 3. Return success response
      return {
        success: true,
        data: {
          id: result.id,
          status: result.status,
          applicantName: result.applicantName,
        },
        statusCode: 201,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): CreateResponse {
    console.error('Error:', error);

    if (error instanceof ValidationError) {
      return { success: false, error: error.message, statusCode: 400 };
    }

    if (error instanceof EntityNotFoundError) {
      return { success: false, error: error.message, statusCode: 404 };
    }

    return { success: false, error: 'Internal server error', statusCode: 500 };
  }
}
```

#### 4.2 Create Route
**File**: `src/app/api/your-feature/route.ts`

```typescript
/**
 * Presentation Layer - Your Feature Route
 * Thin HTTP layer that delegates to Controller
 */

import { NextRequest, NextResponse } from 'next/server';
import { YourController } from './_controllers/YourController';
import { YourUseCase } from '@/application/use-cases/your-feature/YourUseCase';
import { PrismaYourRepository } from '@/infrastructure/database/repositories/PrismaYourRepository';
import { prisma } from '@/infrastructure/database/PrismaClient';

async function createController(): Promise<YourController> {
  const repository = new PrismaYourRepository(prisma);
  const useCase = new YourUseCase(repository);

  return new YourController(useCase);
}

export async function POST(request: NextRequest) {
  try {
    // IMPORTANT: requireAuth returns SessionData object { userId, email, role }
    // Extract userId from the session object
    const session = await requireAuth(request);
    const body = await request.json();

    const controller = await createController();
    const response = await controller.create(body, session.userId);

    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json({ error: response.error }, { status: response.statusCode });
    }
  } catch (error: any) {
    console.error('Unexpected error:', error);

    // Handle authentication errors
    if (error.message === 'Unauthorized' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Implement GET logic similarly
}
```

---

## Example: Creating a "Create Screening" Feature

Let's walk through creating a complete feature:

### 1. Define the requirement
> "Users should be able to create a background screening request by providing applicant details and selecting a service"

### 2. Create domain entities and interfaces

```typescript
// src/domain/entities/Screening.ts
export class Screening {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly serviceId: string,
    public readonly status: ScreeningStatus,
    public readonly applicantName: string,
    public readonly applicantEmail: string,
    public readonly applicantPhone: string | null,
    public readonly formData: Record<string, any>
  ) {}
}

// src/domain/interfaces/repositories/IScreeningRepository.ts
export interface IScreeningRepository {
  save(screening: Screening): Promise<Screening>;
  findById(id: string): Promise<Screening | null>;
}
```

### 3. Implement repository

```typescript
// src/infrastructure/database/repositories/PrismaScreeningRepository.ts
export class PrismaScreeningRepository implements IScreeningRepository {
  constructor(private prisma: PrismaClient) {}

  async save(screening: Screening): Promise<Screening> {
    // Implementation using Prisma
  }
}
```

### 4. Create use case

```typescript
// src/application/use-cases/screening/CreateScreeningUseCase.ts
export class CreateScreeningUseCase {
  constructor(
    private screeningRepo: IScreeningRepository,
    private serviceRepo: IServiceRepository
  ) {}

  async execute(dto: CreateScreeningDTO): Promise<Screening> {
    // Validate service exists
    // Create screening
    // Save to database
    // Return result
  }
}
```

### 5. Create route and controller

```typescript
// src/app/api/screenings/_controllers/ScreeningController.ts
export class ScreeningController {
  async create(request: CreateRequest): Promise<CreateResponse> {
    // Orchestrate the flow
  }
}

// src/app/api/screenings/route.ts
export async function POST(request: NextRequest) {
  // Delegate to controller
}
```

---

## Best Practices

### 1. **Always Start with Domain**
- Define entities and business rules first
- Don't let database or API constraints drive your domain model

### 2. **Keep Routes Thin**
- Routes should only handle HTTP concerns (parsing, response)
- Move all logic to controllers and use cases

### 3. **Use DTOs for Validation**
- Validate input at the application layer
- Throw descriptive errors that can be mapped to HTTP codes

### 4. **Separate Concerns**
- Database logic → Repository
- Business logic → Use Case
- HTTP logic → Route
- Orchestration → Controller

### 5. **Use Dependency Injection**
- Pass dependencies via constructors
- Makes testing easier
- Reduces coupling

### 6. **Handle Errors Properly**
- Create domain-specific errors
- Map them to HTTP status codes in controllers
- Log errors appropriately

### 7. **Follow Naming Conventions**
```
UseCase: CreateScreeningUseCase
DTO: CreateScreeningDTO
Repository: PrismaScreeningRepository
Controller: ScreeningController
Route: /api/screenings/route.ts
```

### 8. **Authentication Pattern**
This project uses `requireAuth` and `requireAdmin` from `@/lib/api-auth`:

```typescript
import { requireAuth, requireAdmin } from '@/lib/api-auth';

// For authenticated routes
export async function POST(request: NextRequest) {
  try {
    // IMPORTANT: requireAuth returns SessionData { userId, email, role }
    const session = await requireAuth(request);

    // Use session.userId to access the user ID
    const userId = session.userId;

    // Access user role if needed
    if (session.role === 'admin') {
      // Admin-specific logic
    }
  } catch (error: any) {
    // Handle auth errors
    if (error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
}

// For admin-only routes
export async function DELETE(request: NextRequest) {
  try {
    // requireAdmin throws ForbiddenError if user is not admin
    const session = await requireAdmin(request);
    // Proceed with admin operation
  } catch (error: any) {
    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
}
```

**Common Mistakes to Avoid:**
- ❌ `const userId = await requireAuth(request)` - Wrong! Returns object, not string
- ✅ `const session = await requireAuth(request); const userId = session.userId` - Correct!

---

## Testing Strategy

### Unit Tests (No dependencies)

```typescript
// Test use cases in isolation
describe('CreateScreeningUseCase', () => {
  it('should create a screening successfully', async () => {
    const mockRepo = {
      save: jest.fn().mockResolvedValue(mockScreening)
    };

    const useCase = new CreateScreeningUseCase(mockRepo, mockServiceRepo);
    const result = await useCase.execute(validDTO);

    expect(result.id).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

### Integration Tests (With database)

```typescript
// Test repositories with real database
describe('PrismaScreeningRepository', () => {
  beforeAll(async () => {
    // Prisma connects automatically
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should save and retrieve screening', async () => {
    const repo = new PrismaScreeningRepository(prisma);
    const saved = await repo.save(screening);
    const found = await repo.findById(saved.id);

    expect(found).toEqual(saved);
  });
});
```

### E2E Tests (Full HTTP flow)

```typescript
// Test complete API routes
describe('POST /api/screenings', () => {
  it('should create a screening via HTTP', async () => {
    const response = await fetch('/api/screenings', {
      method: 'POST',
      body: JSON.stringify(validRequest)
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBeDefined();
  });
});
```

---

## Quick Reference Checklist

When creating a new feature:

- [ ] Domain entity created
- [ ] Domain interface (repository/service) defined
- [ ] Domain errors defined
- [ ] Infrastructure implementation (repository/service) created
- [ ] DTO created with validation
- [ ] Use case created
- [ ] Controller created
- [ ] Route created
- [ ] Unit tests written
- [ ] Integration tests written (if applicable)
- [ ] Documentation updated

---

## Common Patterns

### Pattern 1: CRUD Operations

For basic CRUD:
1. Create repository with `findAll`, `findById`, `save`, `delete`
2. Create use cases for each operation
3. Create one controller with multiple methods
4. Create one route file with GET, POST, PUT, DELETE

### Pattern 2: Complex Business Logic

For complex operations:
1. Break into smaller use cases
2. Each use case does ONE thing
3. Compose use cases in controllers if needed
4. Don't let use cases call other use cases directly

### Pattern 3: External Service Integration

When integrating with external APIs:
1. Define interface in domain layer
2. Implement in infrastructure layer
3. Inject into use cases
4. Easy to mock for testing

---

## Summary

Following Clean Architecture gives you:

✅ **Testability** - Test business logic without HTTP or DB
✅ **Maintainability** - Clear boundaries between layers
✅ **Scalability** - Easy to add features without breaking existing code
✅ **Flexibility** - Swap implementations without changing business logic
✅ **Team Productivity** - Multiple developers can work on different layers simultaneously

**Remember**: Start from the inside (Domain) and work your way out (Presentation).
