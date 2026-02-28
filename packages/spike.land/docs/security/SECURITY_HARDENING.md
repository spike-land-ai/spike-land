# Security Hardening

This document outlines security improvements implemented in the application.

## CSP Nonces

We have implemented a nonce-based Content Security Policy (CSP) to strictly
control which scripts can execute.

### Implementation

- **Middleware**: A `src/middleware.ts` generates a cryptographically secure
  nonce for each request.
- **CSP Header**: The `Content-Security-Policy` header is set dynamically in the
  middleware, including the `nonce-{value}` directive in `script-src`.
- **Utility**: `src/lib/security/csp-nonce.ts` provides nonce generation
  (middleware safe).
- **Server Utility**: `src/lib/security/csp-nonce-server.ts` provides nonce
  retrieval for server components.

### Usage

To use the nonce in server components (e.g., layouts):

```typescript
import { getNonce } from "@/lib/security/csp-nonce-server";

export default async function Layout({ children }) {
  const nonce = await getNonce();
  return (
    <html lang="en">
      <body>
        {/* ... */}
        <Script src="..." nonce={nonce} />
      </body>
    </html>
  );
}
```

Next.js automatically handles nonces for its internal scripts when the `x-nonce`
header is present.

## Bcrypt Cost Factor

The bcrypt cost factor (salt rounds) has been increased from 10 to 12.

### Rationale

- **NIST Recommendation**: Higher cost factors make brute-force and rainbow
  table attacks significantly slower.
- **Performance**: A cost of 12 provides a good balance between security and
  server performance for login operations.

### Affected Areas

- User Signup (`src/app/api/auth/signup/route.ts`)
- Admin Password Management (`src/app/api/admin/users/password/route.ts`)

## CSS Injection Sanitization

**Added:** 2026-02-26

User-supplied CSS content is sanitized to prevent CSS injection XSS attacks.

### Threat Vector

CSS injection can be exploited in several ways:

- `expression()` in older IE browsers executes JavaScript
- `url()` with `javascript:` protocol executes code
- `-moz-binding` can load XBL bindings containing JavaScript
- CSS-based data exfiltration via `background-image: url()` to attacker-controlled servers

### Implementation

CSS values are sanitized before rendering by stripping dangerous patterns:

- Removes `expression(...)` calls
- Blocks `url()` with `javascript:` or `data:` schemes
- Strips `-moz-binding` properties
- Removes `@import` rules pointing to external origins

### Scope

Applied to all user-generated CSS content rendered in the platform, including
custom component styles and theme customizations.

## Cron Authentication (Timing-Safe Comparison)

**Added:** 2026-02-26

The `src/lib/cron-auth.ts` module provides `validateCronSecret()` for
authenticating cron job requests.

### Security Properties

- Uses `crypto.timingSafeEqual()` instead of `===` for secret comparison,
  preventing timing-based side-channel attacks
- **Fail-closed design**: If `CRON_SECRET` environment variable is not set, all
  cron requests are rejected with 401 (unlike the previous fail-open pattern)
- Expects the secret as a `Bearer` token in the `Authorization` header

### Usage

```typescript
import { validateCronSecret } from "@/lib/cron-auth";

export async function POST(request: Request) {
  const authResult = validateCronSecret(request);
  if (authResult) return authResult; // 401 Response

  // ... cron job logic
}
```

### Previous Vulnerability

The previous pattern used a simple `===` comparison that would skip
authentication entirely when `CRON_SECRET` was not set:

```typescript
// BROKEN (fail-open):
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) return 401;
```

This has been replaced across all cron routes with the new `validateCronSecret()`
function.
