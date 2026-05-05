# Source Code Architecture

This project follows **Clean Architecture** principles with strict layer separation.

## Layer Structure

### 1. Domain Layer (`/domain`)
**Purpose**: Core business logic and entities (innermost layer)

**Rules**:
- NO dependencies on external frameworks
- NO database code
- NO HTTP/API code
- Pure TypeScript/JavaScript

**Contents**:
- `entities/`: Business objects (User, Screening, ApiKey, ServiceCatalog)
- `interfaces/`: Contracts (ports) for repositories and services

**Example**:
```typescript
// domain/entities/User.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly role: UserRole
  ) {}
}
```

---

### 2. Application Layer (`/application`)
**Purpose**: Business use cases and orchestration

**Rules**:
- Can depend on: Domain layer only
- Implements business workflows
- Coordinates between repositories and services

**Contents**:
- `use-cases/`: Business logic (CreateScreeningUseCase, LoginUseCase)
- `dto/`: Data Transfer Objects for input/output

**Example**:
```typescript
// application/use-cases/auth/LoginUseCase.ts
export class LoginUseCase {
  constructor(
    private userRepo: IUserRepository,
    private passwordHasher: IPasswordHasher
  ) {}

  async execute(email: string, password: string): Promise<User> {
    // Business logic here
  }
}
```

---

### 3. Infrastructure Layer (`/infrastructure`)
**Purpose**: Implementations of interfaces (adapters)

**Rules**:
- Implements domain interfaces
- Contains framework-specific code
- Database, external APIs, file systems

**Contents**:
- `database/repositories/`: PostgreSQL implementations
- `services/`: EmailService, StripeService, WeeTrustService
- `security/`: Password hashing, API key generation

**Example**:
```typescript
// infrastructure/database/repositories/PostgresUserRepository.ts
export class PostgresUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    // Postgres query here
  }
}
```

---

### 4. Presentation Layer (`/presentation`)
**Purpose**: Next.js UI and API routes

**Rules**:
- Only layer that knows about Next.js
- Calls use cases
- Handles HTTP requests/responses

**Contents**:
- `app/`: Next.js App Router
- `components/`: React components
- `middleware/`: Authentication middleware

**Example**:
```typescript
// presentation/app/api/v1/screenings/route.ts
export async function POST(request: Request) {
  const useCase = new CreateScreeningUseCase(screeningRepo);
  const result = await useCase.execute(data);
  return Response.json(result);
}
```

---

## Dependency Flow

```
Presentation → Application → Domain
     ↓              ↓
Infrastructure ----→
```

**Golden Rule**: Dependencies point INWARD. Domain never depends on outer layers.

---

## Benefits

1. **Testability**: Business logic can be tested without database/UI
2. **Flexibility**: Swap Postgres for MongoDB without changing business logic
3. **Maintainability**: Clear boundaries between layers
4. **Scalability**: Add new use cases without breaking existing code

---

## Common Patterns

### Dependency Injection
Use cases receive dependencies via constructor:
```typescript
const userRepo = new PostgresUserRepository(db);
const loginUseCase = new LoginUseCase(userRepo, passwordHasher);
```

### Repository Pattern
Abstract data access behind interfaces:
```typescript
// Domain interface
interface IUserRepository {
  findById(id: string): Promise<User | null>;
}

// Infrastructure implementation
class PostgresUserRepository implements IUserRepository {
  // Implementation
}
```

### Service Pattern
External integrations behind interfaces:
```typescript
// Domain interface
interface IEmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

// Infrastructure implementation
class ResendEmailService implements IEmailService {
  // Implementation
}
```
