# Production Deployment Preparation Plan

## Introduction

This document outlines the critical issues that must be addressed before the Preca Dashboard project is deployed to a production environment. While the project has a strong architectural foundation based on Clean Architecture, several key areas require attention to ensure security, stability, and proper functionality in a live environment.

The following sections detail the identified issues and the proposed plan to remediate them.

## Critical Issues to Address

### 1. Unsafe Database Migration Script

-   **Issue:** The `package.json` file currently uses `prisma migrate dev` as the migration command.
-   **Why it's a problem:** The `prisma migrate dev` command is designed for development environments only. It can generate new migrations and, in some cases, reset the database, which could lead to **catastrophic data loss** in a production environment.
-   **Solution:** We must use `prisma migrate deploy`, which is the production-safe command that only applies existing migrations and will fail if the database schema has drifted from the migrations, preventing accidental data loss.

### 2. Authentication Middleware Vulnerability

-   **Issue:** The `src/presentation/middleware/authMiddleware.ts` file checks for the existence of a session cookie but contains a `// TODO` for the actual validation logic.
-   **Why it's a problem:** This is a **critical security vulnerability**. Without proper validation, any user can forge a session cookie and gain unauthorized access to protected dashboard routes and APIs. This would expose sensitive user data and allow an attacker to perform administrative actions.
-   **Solution:** We must implement robust session validation by verifying the JWT signature, checking its expiration, and ensuring the user associated with the session exists and has the required permissions.

### 3. Hardcoded `localhost` in `next.config.js`

-   **Issue:** The `next.config.js` file has `allowedOrigins` for Server Actions hardcoded to `['localhost:3000']`.
-   **Why it's a problem:** This configuration will prevent Server Actions from working in the production environment because the application will be running on a different domain. Any request coming from the production domain will be blocked, breaking parts of the application that rely on Server Actions.
    -   **Solution:** The allowed origins must be configured using an environment variable (`process.env.NEXT_PUBLIC_SERVER_ACTIONS_ALLOWED_ORIGINS`) so that the application can be configured for different environments without code changes. This variable should contain a comma-separated list of allowed origins.
### 4. Missing Security Features

-   **Issue:** The project currently lacks crucial security features like security headers and rate limiting, which are mentioned as part of the Phase 7 deployment plan.
-   **Why it's a problem:**
    -   **Security Headers:** Without headers like `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, and `Strict-Transport-Security`, the application is more vulnerable to common web attacks such as Cross-Site Scripting (XSS), clickjacking, and man-in-the-middle attacks.
    -   **Rate Limiting:** Without rate limiting, the API endpoints (especially authentication) are vulnerable to brute-force attacks and Denial-of-Service (DoS) attacks, which can overwhelm the server and make the application unavailable for legitimate users.
    -   **Solution:** We have implemented security headers in `next.config.js`. A basic in-memory rate limiter has been added to the authentication middleware.

## Proposed Action Plan

To address these issues, I will perform the following steps:

1.  **Update Database Migration Script:**
    -   Modify the `start` script in `package.json` to run `npx prisma migrate deploy` before starting the application, ensuring that migrations are always applied safely in production.

2.  **Implement Secure Authentication Middleware:**
    -   Complete the `authMiddleware.ts` file by adding logic to:
        -   Read the session cookie.
        -   Verify the JWT token using the secret key.
        -   Handle cases where the token is invalid or expired.
        -   Attach the authenticated user's session data to the request for use in protected routes.

3.  **Configure Server Actions for Production:**
    -   Modify `next.config.js` to read the allowed origins from an environment variable (e.g., `process.env.ALLOWED_ORIGINS`).
    -   Update `.env.example` to include this new variable, with instructions for setting it in production.

4.  **Implement Security Headers and Rate Limiting:**
    -   Add a `headers` function to `next.config.js` to apply recommended security headers to all responses.
    -   Implemented a basic in-memory rate limiter directly within the `authMiddleware.ts` to protect against basic brute-force attacks. For scaled production environments, a more robust, distributed solution (e.g., using Redis) is recommended, or configuring rate limiting at the reverse proxy (Nginx/Coolify) level.
## Conclusion

By completing these steps, we will significantly improve the security and stability of the application, making it ready for a production deployment. These changes are essential to protect user data, prevent common vulnerabilities, and ensure the application runs smoothly in a live environment.
