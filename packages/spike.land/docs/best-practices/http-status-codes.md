# HTTP Status Code Standards

A comprehensive guide for consistent HTTP status code usage across all API
endpoints in the spike.land platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Client Error Codes (4xx)](#client-error-codes-4xx)
3. [Success Codes (2xx)](#success-codes-2xx)
4. [Server Error Codes (5xx)](#server-error-codes-5xx)
5. [Decision Tree](#decision-tree)
6. [Implementation Guide](#implementation-guide)
7. [Migration Notes](#migration-notes)

---

## Overview

This document establishes clear guidelines for HTTP status code usage to ensure
consistency across all 262+ API routes in the spike.land platform. The key
distinction between similar status codes (especially 400 vs 422 and 401 vs 403)
is critical for proper API semantics and client error handling.

### Core Principles

1. **Be Specific**: Use the most specific status code that applies
2. **Be Consistent**: Same error type = same status code across all endpoints
3. **Be Informative**: Always include descriptive error messages
4. **Be RESTful**: Follow HTTP specification semantics

---

## Client Error Codes (4xx)

### 400 Bad Request

**Use When**: The request is malformed and cannot be parsed or processed.

**Scenarios**:

- Missing required fields (structural issues)
- Wrong data types (string where number expected)
- Malformed JSON body
- Invalid query parameter format
- Missing Content-Type header for POST/PUT/PATCH
- Request body too large (though 413 is also valid)
- Invalid characters in input

**Examples**:

```typescript
// Missing required field
if (!body.email) {
  return badRequest("Email is required");
}

// Wrong data type
if (typeof body.amount !== "number") {
  return badRequest("Amount must be a number");
}

// Malformed JSON (typically caught by framework)
// Returns: 400 Bad Request
```

**Response Format**:

```json
{
  "error": "Email is required",
  "code": "BAD_REQUEST"
}
```

---

### 422 Unprocessable Entity

**Use When**: The request is well-formed but contains semantic errors that fail
validation rules.

**Scenarios**:

- Zod/schema validation failures
- Business rule violations (e.g., "Password must be at least 8 characters")
- Invalid email format (syntactically wrong)
- Date range errors (end before start)
- Value out of acceptable range
- Invalid enum value
- Cross-field validation failures

**Examples**:

```typescript
// Zod validation failure
const result = schema.safeParse(body);
if (!result.success) {
  return validationError(result.error.flatten().fieldErrors);
}

// Business rule validation
if (password.length < 8) {
  return validationError({
    password: ["Password must be at least 8 characters"],
  });
}

// Invalid email format
if (!EMAIL_REGEX.test(email)) {
  return validationError({
    email: ["Invalid email format"],
  });
}
```

**Response Format**:

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": ["Invalid email format"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

---

### 401 Unauthorized

**Use When**: The request lacks valid authentication credentials.

**Scenarios**:

- No authentication token/session provided
- Expired authentication token
- Invalid authentication token
- Malformed Authorization header
- Session not found

**Examples**:

```typescript
// No session
const session = await auth();
if (!session?.user) {
  return unauthorized();
}

// Invalid API key
const apiKey = request.headers.get("Authorization");
if (!apiKey || !isValidApiKey(apiKey)) {
  return unauthorized("Invalid or missing API key");
}
```

**Response Format**:

```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

**Note**: Despite the name "Unauthorized", this code is for authentication
failures. Use 403 for authorization failures.

---

### 403 Forbidden

**Use When**: The user is authenticated but lacks permission for the requested
action.

**Scenarios**:

- User doesn't own the resource
- User role insufficient (not admin)
- Feature not available for user's tier
- IP blocked or rate limited (though 429 preferred for rate limits)
- Resource access denied by policy

**Examples**:

```typescript
// Not the resource owner
const image = await prisma.image.findUnique({ where: { id: imageId } });
if (image.userId !== session.user.id) {
  return forbidden("You do not have permission to access this image");
}

// Not an admin
if (session.user.role !== "ADMIN") {
  return forbidden("Admin access required");
}

// Tier restriction
if (user.tier === "FREE" && feature === "TIER_4K") {
  return forbidden("Upgrade to access 4K enhancements");
}
```

**Response Format**:

```json
{
  "error": "You do not have permission to access this resource",
  "code": "FORBIDDEN"
}
```

---

### 404 Not Found

**Use When**: The requested resource does not exist.

**Scenarios**:

- Resource ID not found in database
- Route/endpoint doesn't exist
- Resource was deleted
- User looking for resource that never existed

**Examples**:

```typescript
// Resource not found
const image = await prisma.image.findUnique({ where: { id: imageId } });
if (!image) {
  return notFound("Image");
}

// User not found
const user = await prisma.user.findUnique({ where: { id: userId } });
if (!user) {
  return notFound("User");
}
```

**Response Format**:

```json
{
  "error": "Image not found",
  "code": "NOT_FOUND"
}
```

---

### 409 Conflict

**Use When**: The request conflicts with the current state of the target
resource.

**Scenarios**:

- Duplicate resource (unique constraint violation)
- Resource already exists with same identifier
- Concurrent modification conflict (optimistic locking)
- State transition not allowed (e.g., can't cancel completed order)
- Version mismatch

**Examples**:

```typescript
// Duplicate email
const existingUser = await prisma.user.findUnique({
  where: { email },
});
if (existingUser) {
  return conflict("An account with this email already exists");
}

// Duplicate codespace name
const existingCodespace = await prisma.codespace.findFirst({
  where: { name, userId },
});
if (existingCodespace) {
  return conflict("A codespace with this name already exists");
}

// State conflict
if (order.status === "COMPLETED") {
  return conflict("Cannot cancel a completed order");
}
```

**Response Format**:

```json
{
  "error": "An account with this email already exists",
  "code": "CONFLICT"
}
```

---

### 429 Too Many Requests

**Use When**: The user has sent too many requests in a given time period.

**Scenarios**:

- Rate limit exceeded
- Quota exhausted
- Burst limit hit

**Examples**:

```typescript
const rateLimitResult = await checkRateLimit(key, config);
if (rateLimitResult.isLimited) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(
          Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        ),
        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
      },
    },
  );
}
```

**Response Format**:

```json
{
  "error": "Too many requests. Please try again later.",
  "code": "RATE_LIMITED"
}
```

**Headers**:

```
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640000000
```

---

### 402 Payment Required

**Use When**: The request cannot be processed due to insufficient funds/tokens.

**Scenarios**:

- Insufficient token balance
- Subscription expired
- Payment required to proceed

**Examples**:

```typescript
if (user.tokenBalance < cost) {
  return NextResponse.json(
    {
      error: "Insufficient tokens",
      code: "PAYMENT_REQUIRED",
      required: cost,
      balance: user.tokenBalance,
    },
    { status: 402 },
  );
}
```

---

## Success Codes (2xx)

### 200 OK

**Use When**: The request succeeded and returns data.

**Scenarios**:

- GET request returning data
- PUT/PATCH request with updated resource in response
- POST request that doesn't create a new resource (e.g., login, search)
- DELETE with confirmation response

```typescript
return success({ user: userData });
```

---

### 201 Created

**Use When**: A new resource was created as a result of the request.

**Scenarios**:

- POST creating a new resource
- PUT creating a resource at a specific URI

**Examples**:

```typescript
const newImage = await prisma.image.create({ data: imageData });
return success({ image: newImage }, 201);
```

---

### 204 No Content

**Use When**: The request succeeded but there's no content to return.

**Scenarios**:

- DELETE operation completed
- PUT/PATCH when no response body needed
- Background job triggered

```typescript
await prisma.image.delete({ where: { id: imageId } });
return new NextResponse(null, { status: 204 });
```

---

## Server Error Codes (5xx)

### 500 Internal Server Error

**Use When**: An unexpected error occurred on the server.

**Scenarios**:

- Unhandled exceptions
- Database connection failures
- Third-party service failures (when not user-facing)
- Programming errors

**Examples**:

```typescript
try {
  // ... operation
} catch (error) {
  console.error("Unexpected error:", error);
  return serverError();
}
```

**Response Format**:

```json
{
  "error": "An unexpected error occurred",
  "code": "INTERNAL_ERROR"
}
```

**Note**: Never expose internal error details to clients in production. Log them
server-side for debugging.

---

## Decision Tree

Use this decision tree to determine the correct status code:

```
Is the request authenticated?
  No -> Is authentication required?
    Yes -> 401 Unauthorized
    No -> Continue

Is the user authorized for this action?
  No -> 403 Forbidden
  Yes -> Continue

Is the request body parseable?
  No -> 400 Bad Request
  Yes -> Continue

Does the request have required fields with correct types?
  No -> 400 Bad Request
  Yes -> Continue

Does the data pass validation rules?
  No -> 422 Unprocessable Entity
  Yes -> Continue

Does the requested resource exist?
  No -> 404 Not Found
  Yes -> Continue

Does the request conflict with current state?
  Yes -> 409 Conflict
  No -> Continue

Does the user have sufficient tokens/payment?
  No -> 402 Payment Required
  Yes -> Continue

Is the user within rate limits?
  No -> 429 Too Many Requests
  Yes -> Continue

Did the operation succeed?
  No -> 500 Internal Server Error
  Yes -> 200/201/204 Success
```

---

## Implementation Guide

### Using Response Utilities

Import and use the standardized response utilities from `@/lib/api/responses`:

```typescript
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  serverError,
  success,
  unauthorized,
  validationError,
} from "@/lib/api/responses";

export async function POST(request: NextRequest) {
  // Authentication check
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  // Parse body
  const { data: body, error: parseError } = await tryCatch(request.json());
  if (parseError) {
    return badRequest("Invalid JSON body");
  }

  // Structural validation
  if (!body.email || typeof body.email !== "string") {
    return badRequest("Email is required");
  }

  // Schema validation
  const result = userSchema.safeParse(body);
  if (!result.success) {
    return validationError(result.error.flatten().fieldErrors);
  }

  // Resource existence
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (existingUser) {
    return conflict("An account with this email already exists");
  }

  // Create resource
  const user = await prisma.user.create({ data: result.data });
  return success({ user }, 201);
}
```

### Error Logging

Always log server errors with context:

```typescript
try {
  // ... operation
} catch (error) {
  console.error("Failed to process request:", {
    error,
    userId: session?.user?.id,
    endpoint: request.url,
  });
  return serverError();
}
```

---

## Migration Notes

### Current Inconsistencies to Fix

The codebase currently has some inconsistencies that should be addressed:

1. **400 for validation errors**: Some routes return 400 for validation failures
   that should be 422

   ```typescript
   // Before (incorrect)
   if (!EMAIL_REGEX.test(email)) {
     return NextResponse.json(
       { error: "Invalid email format" },
       { status: 400 },
     );
   }

   // After (correct)
   if (!EMAIL_REGEX.test(email)) {
     return validationError({ email: ["Invalid email format"] });
   }
   ```

2. **Missing 409 for duplicates**: Some duplicate checks return 400 instead of
   409

   ```typescript
   // Before (incorrect)
   if (existingUser) {
     return NextResponse.json(
       { error: "Email already exists" },
       { status: 400 },
     );
   }

   // After (correct)
   if (existingUser) {
     return conflict("An account with this email already exists");
   }
   ```

3. **Inconsistent error response format**: Standardize on the response format
   from `@/lib/api/responses`

### Gradual Migration Strategy

1. New endpoints must use `@/lib/api/responses` utilities
2. When modifying existing endpoints, update to use the utilities
3. Track migration progress in GitHub issues
4. Update API documentation (docs/architecture/API_REFERENCE.md) as endpoints
   are migrated

---

## Quick Reference Table

| Status | Name                  | When to Use                                     |
| ------ | --------------------- | ----------------------------------------------- |
| 200    | OK                    | Success with response body                      |
| 201    | Created               | New resource created                            |
| 204    | No Content            | Success, no response body                       |
| 400    | Bad Request           | Malformed request (missing fields, wrong types) |
| 401    | Unauthorized          | Not authenticated                               |
| 402    | Payment Required      | Insufficient tokens/payment                     |
| 403    | Forbidden             | Authenticated but not authorized                |
| 404    | Not Found             | Resource doesn't exist                          |
| 409    | Conflict              | Resource state conflict (duplicates, etc.)      |
| 422    | Unprocessable Entity  | Semantic validation errors (Zod failures)       |
| 429    | Too Many Requests     | Rate limit exceeded                             |
| 500    | Internal Server Error | Unexpected server error                         |

---

## References

- [RFC 9110 - HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [RFC 9457 - Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457)
- [MDN HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [spike.land API Reference](../API_REFERENCE.md)
- [spike.land API Design Best Practices](./api-design.md)
