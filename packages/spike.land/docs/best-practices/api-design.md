# REST API Design Best Practices

A comprehensive guide to building scalable, maintainable, and secure REST APIs
with modern industry standards.

---

## Table of Contents

1. [URL Design](#url-design)
2. [HTTP Methods](#http-methods)
3. [Response Formats](#response-formats)
4. [Authentication & Authorization](#authentication--authorization)
5. [Rate Limiting](#rate-limiting)
6. [API Documentation](#api-documentation)
7. [Advanced Patterns](#advanced-patterns)

---

## URL Design

### Core Principles

REST APIs should be designed around **nouns (resources)** rather than verbs
(actions). HTTP methods define the operations.

#### 1. Use Nouns, Not Verbs

**Good:**

```
GET /orders
POST /orders
PUT /orders/{id}
DELETE /orders/{id}
```

**Bad:**

```
GET /get-orders
POST /create-order
PUT /update-order/{id}
DELETE /delete-order/{id}
```

#### 2. Use Plural Nouns for Collections

Always use plural nouns to maintain consistency and clarity:

```
/customers          # Collection of customers
/customers/{id}     # Single customer
/orders             # Collection of orders
/orders/{id}        # Single order
```

#### 3. Resource Archetypes

**Document** (Singular resource)

```
/users/123
/users/admin
/products/42
```

**Collection** (Server-managed directory)

```
/users
/products
/orders
```

**Store** (Client-managed repository)

```
/users/{id}/playlists
/users/{id}/favorites
```

#### 4. Formatting Standards

| Practice         | Good                 | Bad                                              |
| ---------------- | -------------------- | ------------------------------------------------ |
| Case sensitivity | `/device-management` | `/Device-Management`                             |
| Word separators  | `/user-management`   | `/user_management`                               |
| Trailing slashes | `/devices`           | `/devices/`                                      |
| File extensions  | `/devices.json`      | `/devices`                                       |
| Hierarchy depth  | `/orders/{id}`       | `/orders/{id}/items/{itemId}/details/{detailId}` |

#### 5. Query Parameters for Filtering, Sorting & Pagination

Keep base resource URLs lean. Use query parameters for complex operations:

```
# Filtering
GET /products?category=electronics&brand=Sony

# Sorting
GET /products?sort=price&order=asc

# Pagination
GET /orders?page=2&limit=25

# Field selection
GET /users/123?fields=id,name,email

# Search
GET /products?search=laptop&minPrice=500&maxPrice=1500

# Combined
GET /orders?status=pending&sort=date&limit=10&offset=20
```

#### 6. Resource Relationships

For nested resources, limit depth to improve readability:

**Good (up to 2 levels):**

```
GET /customers/1/orders
GET /orders/123/items
```

**Better (consider flattening):**

```
# Instead of: GET /customers/1/orders/123/items/456
# Use:
GET /orders/123/items/456
# And include customer information in the response
```

#### 7. API Versioning

**Recommended: Media Type Versioning**

```
GET /api/customers/123
Accept: application/vnd.company.v2+json

Response:
Content-Type: application/vnd.company.v2+json
```

**Alternative: URI Versioning** (simpler but less RESTful)

```
GET /api/v2/customers/123
```

**Alternative: Query String Versioning** (cache-friendly)

```
GET /api/customers/123?version=2
```

**Avoid: Header Versioning** (complicates caching)

```
GET /api/customers/123
X-API-Version: 2
```

#### 8. Hypermedia Links (HATEOAS)

Include navigation links to guide clients:

```json
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "_links": {
    "self": {
      "href": "/customers/123",
      "method": "GET"
    },
    "orders": {
      "href": "/customers/123/orders",
      "method": "GET"
    },
    "update": {
      "href": "/customers/123",
      "method": "PUT"
    },
    "delete": {
      "href": "/customers/123",
      "method": "DELETE"
    }
  }
}
```

---

## HTTP Methods

### GET - Retrieve Resources

**Purpose:** Fetch resource representations without modification.

**Characteristics:**

- Safe (no side effects)
- Idempotent (multiple calls = same result)
- Cacheable

**Examples:**

```bash
# Get all resources
GET /products

# Get single resource
GET /products/123

# Get with filtering
GET /products?category=electronics&inStock=true

# Get with pagination
GET /products?page=1&limit=20

# Get with field selection
GET /products/123?fields=id,name,price
```

**Response Codes:**

- `200 OK` - Resource retrieved successfully
- `204 No Content` - Success with no body
- `304 Not Modified` - Cached version is valid
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource doesn't exist

### POST - Create Resources

**Purpose:** Create new subordinate resources within a collection.

**Characteristics:**

- Not safe (creates side effects)
- Not idempotent (multiple calls create multiple resources)
- Returns 201 Created with Location header

**Examples:**

```bash
# Create new resource
POST /products
Content-Type: application/json

{
  "name": "Laptop",
  "price": 999.99,
  "category": "electronics"
}

# Response
HTTP/1.1 201 Created
Location: /products/456
Content-Type: application/json

{
  "id": 456,
  "name": "Laptop",
  "price": 999.99,
  "category": "electronics",
  "createdAt": "2025-12-06T10:30:00Z"
}
```

**For Idempotency:** Use idempotency keys to prevent duplicate resource
creation:

```bash
POST /payments
Idempotency-Key: unique-request-id-12345
Content-Type: application/json

{
  "amount": 100.00,
  "currency": "USD"
}
```

**Response Codes:**

- `201 Created` - Resource created (include Location header)
- `200 OK` - Resource created with response body
- `202 Accepted` - Request queued for processing
- `400 Bad Request` - Invalid request data
- `409 Conflict` - Resource already exists
- `422 Unprocessable Entity` - Validation error

### PUT - Replace Full Resources

**Purpose:** Update or replace an entire resource.

**Characteristics:**

- Idempotent (multiple calls produce same result)
- Replaces entire resource
- Includes all fields

**Examples:**

```bash
# Replace entire resource
PUT /products/123
Content-Type: application/json

{
  "name": "Updated Laptop",
  "price": 1099.99,
  "category": "electronics",
  "description": "High-performance laptop"
}

# Response
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 123,
  "name": "Updated Laptop",
  "price": 1099.99,
  "category": "electronics",
  "description": "High-performance laptop",
  "updatedAt": "2025-12-06T11:45:00Z"
}
```

**Important:** PUT must include all required fields. Omitted fields may be
nullified.

**Response Codes:**

- `200 OK` - Resource updated
- `201 Created` - Resource created at URI
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Conflict with current state

### PATCH - Partial Updates

**Purpose:** Apply partial modifications to existing resources.

**Characteristics:**

- Idempotent (depending on operation)
- Only updates specified fields
- Uses JSON Patch format (RFC 6902)

**Examples:**

```bash
# Partial update using JSON Patch
PATCH /products/123
Content-Type: application/json-patch+json

[
  { "op": "replace", "path": "/price", "value": 899.99 },
  { "op": "add", "path": "/tags", "value": ["sale", "featured"] },
  { "op": "remove", "path": "/description" }
]

# Response
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 123,
  "name": "Laptop",
  "price": 899.99,
  "category": "electronics",
  "tags": ["sale", "featured"],
  "updatedAt": "2025-12-06T12:00:00Z"
}
```

**JSON Patch Operations:**

```json
[
  { "op": "replace", "path": "/price", "value": 99.99 },
  { "op": "add", "path": "/tags/0", "value": "new" },
  { "op": "remove", "path": "/deprecated" },
  { "op": "copy", "path": "/backup", "from": "/current" },
  { "op": "move", "path": "/newField", "from": "/oldField" },
  { "op": "test", "path": "/version", "value": 1 }
]
```

**Response Codes:**

- `200 OK` - Resource updated
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid patch document
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Conflict with current state
- `415 Unsupported Media Type` - Wrong content type

### DELETE - Remove Resources

**Purpose:** Remove identified resources.

**Characteristics:**

- Idempotent (multiple calls have same effect)
- Second deletion returns 404
- Can be asynchronous

**Examples:**

```bash
# Delete synchronously
DELETE /products/123

HTTP/1.1 204 No Content

# Delete asynchronously
DELETE /products/123

HTTP/1.1 202 Accepted
Location: /operations/456

# Check deletion status
GET /operations/456

{
  "status": "in_progress",
  "operation": "delete_product",
  "resourceId": 123
}
```

**Response Codes:**

- `204 No Content` - Deleted successfully
- `202 Accepted` - Deletion queued (async operation)
- `200 OK` - Deleted with response body
- `404 Not Found` - Resource already deleted or doesn't exist
- `409 Conflict` - Cannot delete (e.g., has dependencies)

### Comparison Table

| Method | Safe | Idempotent | Cacheable | Use Case                |
| ------ | ---- | ---------- | --------- | ----------------------- |
| GET    | Yes  | Yes        | Yes       | Retrieve data           |
| POST   | No   | No         | No        | Create new resource     |
| PUT    | No   | Yes        | No        | Replace entire resource |
| PATCH  | No   | Sometimes  | No        | Partial update          |
| DELETE | No   | Yes        | No        | Remove resource         |

---

## Response Formats

### Standard Response Structure

Always return consistent, predictable response structures:

**Success Response (2xx):**

```json
{
  "status": "success",
  "code": 200,
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "meta": {
    "timestamp": "2025-12-06T10:30:00Z",
    "version": "1.0"
  }
}
```

**Error Response (4xx, 5xx):**

```json
{
  "status": "error",
  "code": 400,
  "error": {
    "type": "ValidationError",
    "message": "Invalid email format",
    "details": [
      {
        "field": "email",
        "message": "Email is not valid",
        "value": "invalid-email"
      },
      {
        "field": "age",
        "message": "Age must be at least 18",
        "value": 16
      }
    ]
  },
  "meta": {
    "timestamp": "2025-12-06T10:31:00Z",
    "requestId": "req-12345"
  }
}
```

**List Response with Pagination:**

```json
{
  "status": "success",
  "code": 200,
  "data": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "timestamp": "2025-12-06T10:32:00Z"
  }
}
```

### HTTP Status Codes

**2xx Success Codes**

| Code | Name            | Usage                                     |
| ---- | --------------- | ----------------------------------------- |
| 200  | OK              | Request succeeded, body contains response |
| 201  | Created         | Resource created, include Location header |
| 202  | Accepted        | Request accepted for async processing     |
| 204  | No Content      | Success, no response body                 |
| 206  | Partial Content | Partial response due to range header      |

**3xx Redirection Codes**

| Code | Name               | Usage                          |
| ---- | ------------------ | ------------------------------ |
| 301  | Moved Permanently  | Resource permanently relocated |
| 302  | Found              | Temporary redirect             |
| 304  | Not Modified       | Cached version is valid        |
| 307  | Temporary Redirect | Retry with same method         |

**4xx Client Error Codes**

| Code | Name                 | Usage                                |
| ---- | -------------------- | ------------------------------------ |
| 400  | Bad Request          | Malformed request syntax             |
| 401  | Unauthorized         | Authentication required              |
| 403  | Forbidden            | Authenticated but not authorized     |
| 404  | Not Found            | Resource doesn't exist               |
| 405  | Method Not Allowed   | HTTP method not allowed              |
| 409  | Conflict             | Request conflicts with current state |
| 410  | Gone                 | Resource permanently deleted         |
| 422  | Unprocessable Entity | Validation error                     |
| 429  | Too Many Requests    | Rate limit exceeded                  |

**5xx Server Error Codes**

| Code | Name                  | Usage                       |
| ---- | --------------------- | --------------------------- |
| 500  | Internal Server Error | Unhandled server error      |
| 501  | Not Implemented       | Feature not yet implemented |
| 502  | Bad Gateway           | Invalid upstream response   |
| 503  | Service Unavailable   | Server temporarily down     |
| 504  | Gateway Timeout       | Upstream timeout            |

### Content Type Headers

Always set appropriate content types:

```bash
# JSON response (recommended)
Content-Type: application/json; charset=utf-8

# XML response
Content-Type: application/xml; charset=utf-8

# Specific API version
Content-Type: application/vnd.company.v2+json

# Chunked transfer
Content-Type: application/json
Transfer-Encoding: chunked
```

### Pagination Best Practices

**Limit/Offset Pagination** (offset-based):

```bash
GET /products?limit=20&offset=40

Response:
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "offset": 40,
    "total": 1000,
    "hasMore": true
  }
}
```

**Cursor-Based Pagination** (recommended for large datasets):

```bash
GET /products?first=20&after=cursor_123

Response:
{
  "data": [...],
  "pageInfo": {
    "hasNextPage": true,
    "endCursor": "cursor_456"
  }
}
```

**Keyset Pagination** (most performant):

```bash
GET /products?limit=20&from_id=100

# Useful for real-time data where new items may be inserted
```

**Pagination Rules:**

- Default limit: 20-25 records
- Maximum limit: 100-1000 (prevent DoS)
- Include total count in response
- Support sorting for consistent ordering
- Return pagination metadata

### Error Response RFC 9457 (Problem Details)

Follow RFC 9457 for standardized error responses:

```json
{
  "type": "https://api.company.com/errors/validation-error",
  "title": "Validation Failed",
  "status": 422,
  "detail": "One or more fields failed validation",
  "instance": "/api/v1/products/invalid-request",
  "invalidParams": [
    {
      "name": "email",
      "reason": "Invalid email format"
    },
    {
      "name": "age",
      "reason": "Must be at least 18"
    }
  ]
}
```

---

## Authentication & Authorization

### 1. API Keys

Simple authentication using a static key.

**When to Use:**

- Public APIs with non-sensitive data
- Server-to-server communication
- Testing and development

**Implementation:**

```bash
# In header (recommended)
GET /products
X-API-Key: sk_live_abc123def456

# In query parameter (less secure)
GET /products?api_key=sk_live_abc123def456
```

**Best Practices:**

- Store keys securely (environment variables, key vaults)
- Support multiple keys with different permissions
- Implement key rotation policies
- Include key information in rate limiting
- Return 401 Unauthorized for invalid keys

### 2. JWT (JSON Web Tokens)

Self-contained tokens with embedded claims, ideal for stateless authentication.

**When to Use:**

- Single-page applications (SPAs)
- Mobile applications
- Microservices
- Session-less APIs

**Structure:**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Implementation:**

```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "secure_password"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}

# Using the token
GET /user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**JWT Claims Structure:**

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "roles": ["user", "admin"],
    "permissions": ["read:products", "write:orders"],
    "iat": 1516239022,
    "exp": 1516242622
  }
}
```

**Best Practices:**

- Set short expiration times (15-60 minutes)
- Use refresh tokens for long-lived sessions
- Sign with strong secrets (256-bit+)
- Store tokens in secure HTTP-only cookies
- Implement token revocation lists for logout
- Use HTTPS only

### 3. OAuth 2.0

Industry-standard protocol for delegated access and third-party authentication.

**When to Use:**

- Third-party application integration
- Social login (Google, GitHub, Facebook)
- Delegated access to resources
- Federated authentication

**Authorization Code Flow** (most secure):

```
1. User clicks "Login with Google"
2. Redirect to: https://accounts.google.com/o/oauth2/auth?
   client_id=xxx&
   redirect_uri=https://app.com/callback&
   response_type=code&
   scope=openid%20email%20profile

3. User authenticates and grants permission
4. Google redirects to: https://app.com/callback?code=auth_code

5. Backend exchanges code for token:
   POST https://accounts.google.com/o/oauth2/token
   {
     "client_id": "xxx",
     "client_secret": "secret",
     "code": "auth_code",
     "redirect_uri": "https://app.com/callback",
     "grant_type": "authorization_code"
   }

6. Response:
   {
     "access_token": "token_xyz",
     "refresh_token": "refresh_abc",
     "expires_in": 3600,
     "token_type": "Bearer"
   }
```

**Best Practices:**

- Always use HTTPS
- Validate `redirect_uri` on server
- Use `state` parameter to prevent CSRF
- Implement PKCE for mobile apps
- Keep client secrets secure
- Set appropriate scopes (minimum required)

### 4. OAuth 2.0 with OpenID Connect (OIDC)

Extends OAuth 2.0 with authentication (identity layer).

```bash
# OIDC includes an ID token
{
  "access_token": "token_xyz",
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "expires_in": 3600,
  "token_type": "Bearer"
}

# ID Token payload contains user identity
{
  "iss": "https://auth.company.com",
  "sub": "user_123",
  "aud": "app_client_id",
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "picture": "https://...",
  "iat": 1516239022,
  "exp": 1516242622
}
```

### 5. Choosing the Right Method

| Method     | Complexity | Security | Use Case                           |
| ---------- | ---------- | -------- | ---------------------------------- |
| API Keys   | Low        | Medium   | Public APIs, server-to-server      |
| JWT        | Medium     | High     | SPAs, mobile, microservices        |
| OAuth 2.0  | High       | High     | Third-party integration            |
| OIDC       | High       | Highest  | Enterprise, SSO, identity          |
| Basic Auth | Low        | Low      | Development only, never production |

---

## Rate Limiting

### Why Rate Limiting Matters

Rate limiting protects API infrastructure from:

- Unintended overload from misbehaving clients
- Denial-of-service (DoS) attacks
- Resource exhaustion
- Cost control

### Rate Limiting Algorithms

**Token Bucket** (most flexible):

```
- Tokens added to bucket at fixed rate
- Each request consumes tokens
- Request allowed if tokens available
- Allows short bursts
```

**Leaky Bucket** (smooth flow):

```
- Requests queued in bucket
- Processed at constant rate
- Prevents bursts
- Good for fair allocation
```

**Fixed Window** (simple):

```
- Fixed number of requests per time window
- Resets at window boundary
- Risk of burst at window edge
```

**Sliding Window** (more accurate):

```
- Timestamps of recent requests tracked
- Calculate rate from sliding window
- More CPU-intensive
- Better fairness
```

### Implementation Strategies

**Per-User Rate Limiting:**

```
- Identify by user ID
- Limits: 1000 requests/hour
- Prevents single user from overloading API
```

**Per-IP Rate Limiting:**

```
- Identify by client IP
- Limits: 100 requests/hour (loose)
- Prevents IP-based abuse
- Issues with corporate networks
```

**Per-API-Key Rate Limiting:**

```
- Identify by API key
- Different limits per tier
- Most accurate for tracking
- Best for paid APIs
```

**Global Rate Limiting:**

```
- Limit total API requests
- Example: 100,000 requests/minute
- Prevents overall system overload
```

### HTTP Headers for Rate Limiting

Include rate limit information in responses:

```bash
Response Headers:
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1640000000
Retry-After: 60
```

**Standard Headers (RFC 6585):**

```
X-RateLimit-Limit: Maximum requests per window
X-RateLimit-Remaining: Requests remaining in current window
X-RateLimit-Reset: Unix timestamp when limit resets
Retry-After: Seconds to wait before retrying
```

### Exceeded Rate Limit Response

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640000000
Retry-After: 60

{
  "status": "error",
  "code": 429,
  "error": {
    "type": "RateLimitExceeded",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 1000,
      "window": "1 hour",
      "retryAfter": 60
    }
  }
}
```

### Rate Limiting Tiers

Offer different limits based on user tier:

```
Free Tier:
  - 100 requests/hour
  - 1000 requests/day

Pro Tier:
  - 1000 requests/hour
  - 100,000 requests/day

Enterprise:
  - Custom limits
  - Dedicated infrastructure
```

### Best Practices

1. **Transparent Communication**
   - Document limits in API documentation
   - Include limits in response headers
   - Provide clear error messages

2. **Reasonable Defaults**
   - Don't make limits too restrictive
   - Account for legitimate use cases
   - Higher limits for authenticated users

3. **Graceful Degradation**
   - Queue requests instead of rejecting
   - Implement request throttling
   - Gradual backoff strategies

4. **Monitoring & Analytics**
   - Track rate limit violations
   - Identify patterns and trends
   - Adjust limits based on data

5. **Tiered Approach**
   - User-level limits (authenticated)
   - IP-level limits (public)
   - API-key limits (clients)
   - Global limits (system health)

6. **Documentation**
   - Clear rate limit policies
   - Tier comparisons
   - Examples and code samples
   - Support contact for higher limits

---

## API Documentation

### OpenAPI/Swagger Specification

Use OpenAPI 3.1.x (current standard) for standardized API documentation.

**OpenAPI Minimal Example:**

```yaml
openapi: 3.1.0
info:
  title: Product API
  version: 1.0.0
  description: API for managing products
  contact:
    name: API Support
    url: https://support.example.com
  license:
    name: MIT
servers:
  - url: https://api.example.com/v1
    description: Production server
  - url: https://staging-api.example.com/v1
    description: Staging server

paths:
  /products:
    get:
      summary: List all products
      description: Returns a paginated list of all products
      operationId: listProducts
      tags:
        - Products
      parameters:
        - name: page
          in: query
          required: false
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          required: false
          schema:
            type: integer
            default: 20
            maximum: 100
        - name: category
          in: query
          required: false
          schema:
            type: string
      responses:
        "200":
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/Product"
                  pagination:
                    $ref: "#/components/schemas/Pagination"
        "400":
          description: Invalid parameters
        "429":
          description: Rate limit exceeded

    post:
      summary: Create a product
      operationId: createProduct
      tags:
        - Products
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateProductRequest"
      responses:
        "201":
          description: Product created
          headers:
            Location:
              schema:
                type: string
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Product"
        "400":
          description: Invalid request
        "401":
          description: Unauthorized

  /products/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string

    get:
      summary: Get a product
      operationId: getProduct
      tags:
        - Products
      responses:
        "200":
          description: Product details
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Product"
        "404":
          description: Product not found

    put:
      summary: Update a product
      operationId: updateProduct
      tags:
        - Products
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UpdateProductRequest"
      responses:
        "200":
          description: Product updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Product"
        "404":
          description: Product not found

    delete:
      summary: Delete a product
      operationId: deleteProduct
      tags:
        - Products
      responses:
        "204":
          description: Product deleted
        "404":
          description: Product not found

components:
  schemas:
    Product:
      type: object
      required:
        - id
        - name
        - price
      properties:
        id:
          type: string
          format: uuid
          description: Unique product identifier
        name:
          type: string
          minLength: 1
          maxLength: 255
          description: Product name
        description:
          type: string
          nullable: true
          description: Product description
        price:
          type: number
          format: decimal
          minimum: 0
          description: Product price
        category:
          type: string
          enum: [electronics, books, clothing, other]
        inStock:
          type: boolean
          default: true
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    CreateProductRequest:
      type: object
      required:
        - name
        - price
      properties:
        name:
          type: string
        description:
          type: string
        price:
          type: number
          minimum: 0
        category:
          type: string

    UpdateProductRequest:
      type: object
      properties:
        name:
          type: string
        description:
          type: string
        price:
          type: number
        category:
          type: string

    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        pages:
          type: integer

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

security:
  - bearerAuth: []
  - apiKeyAuth: []
```

### Documentation Best Practices

1. **Clear Structure**
   - Organize endpoints logically
   - Use consistent naming conventions
   - Group related operations with tags

2. **Comprehensive Examples**
   - Request/response examples
   - Error scenarios
   - Common use cases
   - Code samples in multiple languages

3. **Keep Documentation Synchronized**
   - Auto-generate from source code
   - Use CI/CD to validate specs
   - Document breaking changes
   - Maintain changelog

4. **Security Specification**
   - Define authentication schemes
   - Document required scopes
   - Specify rate limits
   - Include security best practices

5. **Developer Experience**
   - Use Swagger UI for interactive testing
   - Provide quick-start guide
   - Include SDKs and code examples
   - Offer sandbox/test environment

---

## Advanced Patterns

### 1. HATEOAS (Hypermedia As The Engine Of Application State)

Include links to guide clients to related resources:

```json
{
  "id": "order_123",
  "status": "pending",
  "total": 99.99,
  "_links": {
    "self": {
      "href": "/orders/order_123",
      "method": "GET"
    },
    "customer": {
      "href": "/customers/cust_456",
      "method": "GET"
    },
    "items": {
      "href": "/orders/order_123/items",
      "method": "GET"
    },
    "update": {
      "href": "/orders/order_123",
      "method": "PATCH"
    },
    "cancel": {
      "href": "/orders/order_123",
      "method": "DELETE"
    },
    "payment": {
      "href": "/orders/order_123/payment",
      "method": "POST"
    }
  }
}
```

### 2. Asynchronous Operations

For long-running operations, return 202 Accepted and provide status endpoint:

```bash
# Long-running request
POST /batch/process
{
  "items": [...]
}

HTTP/1.1 202 Accepted
Location: /batch/status/job_789

# Later, check status
GET /batch/status/job_789

{
  "id": "job_789",
  "status": "in_progress",
  "progress": 45,
  "estimatedCompletionTime": "2025-12-06T11:00:00Z",
  "resultUrl": null
}

# When complete
{
  "id": "job_789",
  "status": "completed",
  "progress": 100,
  "resultUrl": "/batch/results/job_789"
}
```

### 3. Conditional Requests

Use ETags and Last-Modified headers for efficient caching:

```bash
# Initial request
GET /products/123
Response:
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Wed, 06 Dec 2025 10:30:00 GMT

# Conditional request
GET /products/123
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"
If-Modified-Since: Wed, 06 Dec 2025 10:30:00 GMT

Response:
HTTP/1.1 304 Not Modified
```

### 4. Partial Responses

Allow clients to request specific fields:

```bash
# Get all fields
GET /products/123

# Get only specific fields
GET /products/123?fields=id,name,price

Response:
{
  "id": "123",
  "name": "Laptop",
  "price": 999.99
}
```

### 5. Batch Operations

Support bulk operations for efficiency:

```bash
# Batch create
POST /products/batch
{
  "operations": [
    { "action": "create", "data": {...} },
    { "action": "create", "data": {...} },
    { "action": "create", "data": {...} }
  ]
}

Response:
{
  "status": "success",
  "results": [
    { "status": "created", "id": "p_1" },
    { "status": "created", "id": "p_2" },
    { "status": "error", "error": "Invalid data" }
  ]
}
```

### 6. Webhooks

Send event notifications to registered endpoints:

```bash
# Register webhook
POST /webhooks
{
  "url": "https://myapp.com/webhook",
  "events": ["order.created", "order.updated"],
  "secret": "webhook_secret_123"
}

# Webhook delivery
POST https://myapp.com/webhook
X-Signature: sha256=signature_hash
Content-Type: application/json

{
  "event": "order.created",
  "timestamp": "2025-12-06T10:30:00Z",
  "data": {
    "id": "order_123",
    "total": 99.99
  }
}
```

### 7. API Consistency Rules

- **Timestamps:** Always use ISO 8601 format with timezone
- **Identifiers:** Use UUIDs or consistent format
- **Booleans:** Use true/false (not 1/0)
- **Null values:** Be consistent with null handling
- **Naming:** Use consistent camelCase/snake_case
- **Errors:** Always include error type, message, details
- **Status codes:** Follow HTTP standard semantics

---

## Summary & Quick Reference

### REST API Checklist

- [ ] Use nouns for resources, HTTP verbs for actions
- [ ] Use plural nouns for collections
- [ ] Use lowercase with hyphens for URLs
- [ ] Implement proper HTTP status codes
- [ ] Include pagination for list endpoints
- [ ] Use query parameters for filtering
- [ ] Implement authentication (JWT or OAuth 2.0)
- [ ] Document with OpenAPI/Swagger
- [ ] Implement rate limiting
- [ ] Use consistent response formats
- [ ] Include error details in responses
- [ ] Version your API
- [ ] Implement HTTPS only
- [ ] Monitor and log requests
- [ ] Provide clear documentation with examples

### Resource Naming Quick Reference

```
Collection:    GET /products
Single item:   GET /products/{id}
Sub-resource:  GET /orders/{id}/items
Action:        POST /orders (create), DELETE /orders/{id}
Filter:        GET /products?category=electronics
Pagination:    GET /products?page=2&limit=20
```

### Status Code Quick Reference

```
2xx Success
  200 OK          Most common success response
  201 Created     Resource created (include Location)
  202 Accepted    Async operation queued
  204 No Content  Success, no body

4xx Client Error
  400 Bad Request      Invalid input
  401 Unauthorized     Auth required
  403 Forbidden        Auth OK, not allowed
  404 Not Found        Resource missing
  429 Too Many Requests Rate limit exceeded

5xx Server Error
  500 Internal Error   Unhandled exception
  502 Bad Gateway      Upstream error
  503 Unavailable      Maintenance/overload
```

---

## Additional Resources

- **OpenAPI Specification:** https://spec.openapis.org/
- **HTTP Status Codes:**
  https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- **REST Best Practices:** https://restfulapi.net/
- **JWT:** https://jwt.io/
- **OAuth 2.0:** https://oauth.net/2/

---

## References

- [REST API URI Naming Conventions and Best Practices](https://restfulapi.net/resource-naming/)
- [Web API Design Best Practices - Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design)
- [HTTP Methods - REST API Tutorial](https://restfulapi.net/http-methods/)
- [REST API Design Best Practices - Stack Overflow Blog](https://stackoverflow.blog/2020/03/02/best-practices-for-rest-api-design/)
- [REST API Authentication Guide 2025](https://www.knowi.com/blog/4-ways-of-rest-api-authentication-methods/)
- [Mastering API Rate Limiting: Strategies and Best Practices](https://testfully.io/blog/api-rate-limit/)
- [Rate Limiting Best Practices - Cloudflare WAF Docs](https://developers.cloudflare.com/waf/rate-limiting-rules/best-practices/)
- [API Documentation Best Practices - Swagger Blog](https://swagger.io/blog/api-documentation/best-practices-in-api-documentation/)
- [OpenAPI Specification Standards](https://moldstud.com/articles/p-real-world-examples-of-openapi-specification-best-practices-for-using-swagger)
- [Best Practices for REST API Error Handling - Baeldung](https://www.baeldung.com/rest-api-error-handling-best-practices)
- [RFC 9457 - Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
