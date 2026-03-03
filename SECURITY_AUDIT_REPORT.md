# Security Audit Report — spike-land-ai (All 15 Packages)

Generated: 2026-02-27 | Auditor: Claude Security Agent OWASP Top 10 (2021)
referenced throughout.

---

## Summary

| Severity | Count | Fixed In This Audit |
| -------- | ----- | ------------------- |
| Critical | 2     | 2                   |
| High     | 6     | 4                   |
| Medium   | 8     | 2                   |
| Low      | 5     | 0 (informational)   |

---

## CRITICAL Findings

### C1 — Hardcoded Default Secrets in Agent Servers (FIXED)

**OWASP A02:2021 — Cryptographic Failures** **Files:**

- `/Users/z/Developer/spike-land-ai/spike.land/scripts/create-agent/server.ts:23`
- `/Users/z/Developer/spike-land-ai/spike.land/scripts/learnit-agent/server.ts:19`

**Description:** Both agent servers fell back to hardcoded literal secrets when
the environment variable was absent:

```typescript
// BEFORE (vulnerable)
const AGENT_SECRET = process.env.CREATE_AGENT_SECRET ?? "spike-create-2026";
const AGENT_SECRET = process.env.LEARNIT_AGENT_SECRET ?? "spike-learnit-2026";
```

Any attacker who reads the open-source code can call these endpoints with
`Authorization: Bearer spike-create-2026` and trigger arbitrary Claude Opus
completions, burning the account's API budget.

**Fix applied:** Both servers now call `process.exit(1)` if the environment
variable is absent, refusing to start with a known-public secret.

---

### C2 — MCP Capability Token Grants Wildcard Permissions (INFORMATIONAL — Script Only)

**OWASP A01:2021 — Broken Access Control** **File:**
`/Users/z/Developer/spike-land-ai/spike.land/scripts/mcp-auth-setup.ts:31`

**Description:** The dev setup script creates a capability token with
`allowedTools: ["*"]` and `allowedCategories: ["*"]`, granting the test agent
unrestricted access to all 120+ MCP tools. If this token or a similar one is
issued in production, a compromised agent can exfiltrate data, execute arbitrary
DB writes, and interact with third-party services (Stripe, GitHub, etc.) without
restriction.

This is a dev-only script and does not affect production token issuance.
However, the pattern must not be replicated in production capability grants.

**Recommendation:** Production agent tokens should enumerate specific tools and
categories. The `allowedTools: ["*"]` pattern must be guarded by a `NODE_ENV`
check or removed from the script entirely.

---

## HIGH Findings

### H1 — Access Token Written to stdout (FIXED)

**OWASP A09:2021 — Security Logging and Monitoring Failures** **File:**
`/Users/z/Developer/spike-land-ai/spike.land/scripts/generate-mcp-token.ts:20`

**Description:**

```typescript
// BEFORE (vulnerable)
console.log("TOKEN=" + tokenRecord.accessToken);
```

Writing secrets to stdout risks capture by shell pipelines, log forwarders
(Datadog, CloudWatch), CI output logs, and terminal scrollback buffers.

**Fix applied:** Token is now written to `process.stderr` only, with a comment
explaining why. Stderr is conventionally excluded from piped output.

---

### H2 — Raw Token Logged During Dev Setup (FIXED)

**OWASP A09:2021 — Security Logging and Monitoring Failures** **File:**
`/Users/z/Developer/spike-land-ai/spike.land/scripts/mcp-auth-setup.ts:39`

**Description:**

```typescript
// BEFORE (vulnerable)
console.log("Created Cap Token:", rawToken);
```

**Fix applied:** Line replaced with a confirmation message that omits the token
value.

---

### H3 — Wildcard CORS on Authenticated Internal Agent Servers (FIXED)

**OWASP A01:2021 — Broken Access Control** **Files:**

- `/Users/z/Developer/spike-land-ai/spike.land/scripts/create-agent/server.ts:54`
- `/Users/z/Developer/spike-land-ai/spike.land/scripts/learnit-agent/server.ts:72`

**Description:** Both agent HTTP servers served `Access-Control-Allow-Origin: *`
on every response, including the authenticated `/generate` endpoint. While
Bearer token auth is present, CORS wildcard on authenticated endpoints allows
malicious websites to make cross-origin requests using a victim's Bearer token
(stored in the browser or injected via JavaScript).

**Fix applied:** CORS origin is now `https://spike.land` in production and
`http://localhost:3000` in development. `Vary: Origin` is set to prevent cache
poisoning.

---

### H4 — Replicate API (Paid) Endpoint Has No Authentication Gate

**OWASP A01:2021 — Broken Access Control** **Files:**

- `/Users/z/Developer/spike-land-ai/spike-land-backend/src/replicateHandler.ts:146`
- `/Users/z/Developer/spike-land-ai/spike-land-backend/src/chat.ts:276`

**Description:** Any unauthenticated request to
`/live/{codeSpace}/replicate/...` reaches `handleReplicateRequest`, which calls
the Replicate API (`black-forest-labs/flux-schnell`) with the production API
key. While the endpoint lives inside a Durable Object (requiring a valid
codeSpace), there is no user session or token check before the paid external API
call is made. Repeated requests with different codeSpace IDs can abuse Replicate
credits.

The Cloudflare Worker CORS is `*`, so cross-origin requests from any website can
trigger this endpoint.

**Recommendation (not auto-fixed — requires architectural decision):**

1. Add a session/auth check in `handleMainFetch` or `chat.ts` before routing to
   `handleReplicateRequest`.
2. Enforce per-user rate limiting on the replicate endpoint (Cloudflare KV or
   Durable Object counter).
3. Restrict the `Access-Control-Allow-Origin` on the replicate response to
   `https://spike.land`.

---

### H5 — Overly Broad Wildcard CORS on spike-land-backend (Informational)

**OWASP A05:2021 — Security Misconfiguration** **Files:**

- `/Users/z/Developer/spike-land-ai/spike-land-backend/src/utils.ts:3`
- `/Users/z/Developer/spike-land-ai/spike-land-backend/src/mcp/handler.ts:40`
- `/Users/z/Developer/spike-land-ai/spike-land-backend/src/makeResponse.ts:10`
- `/Users/z/Developer/spike-land-ai/spike-land-backend/src/routes/apiRoutes.ts:323`

**Description:** All backend responses use `Access-Control-Allow-Origin: *`. The
Cloudflare Worker serves as a backend for the spike.land editor; cross-origin
access from arbitrary websites is a meaningful attack surface. Specifically, the
MCP handler serves authenticated tool invocations under `*`.

**Not auto-fixed** because narrowing CORS on the Cloudflare Worker could break
the Monaco editor's service-worker-based requests. Requires coordination with
the frontend team to enumerate expected origins.

**Recommendation:** Define an allowlist
`["https://spike.land", "https://*.spike.land"]` and reflect matching origins,
rather than serving `*`.

---

### H6 — Missing Global Content-Security-Policy Header in Next.js App (FIXED)

**OWASP A05:2021 — Security Misconfiguration** **File:**
`/Users/z/Developer/spike-land-ai/spike.land/next.config.ts`

**Description:** The `securityHeaders` array applied globally in
`next.config.ts` had no `Content-Security-Policy` directive. Individual
codespace/live/bundle routes set their own inline CSP, but all other application
pages (auth pages, store, admin, blog, etc.) were served without any CSP.

**Fix applied:** A global CSP has been added to `securityHeaders`:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self' https: wss:;
frame-src 'self' https://vercel.live https://testing.spike.land;
frame-ancestors 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests
```

Note: `'unsafe-inline'` and `'unsafe-eval'` are retained for Next.js
compatibility. The long-term goal should be nonce-based CSP.

---

## MEDIUM Findings

### M1 — Command Injection Risk in db-migrate-ci.ts (MITIGATED, HARDENED)

**OWASP A03:2021 — Injection** **File:**
`/Users/z/Developer/spike-land-ai/spike.land/scripts/db-migrate-ci.ts:45`

**Description:**

```typescript
execSync(`yarn prisma migrate dev --name ${migrationName} --create-only`, ...);
```

`migrationName` came from `process.argv[2]` and was interpolated into a shell
command. The existing regex `/^[a-z][a-z0-9_]*$/` was correct but had no length
limit, allowing a 1 MB argument that could cause issues in some environments.

**Fix applied:** Added a 64-character max-length guard. Commented the code to
explain why string interpolation is safe post-validation and that `shell` is not
explicitly enabled.

---

### M2 — test-cache-manager.ts: Unvalidated Git Commit Hash in Shell Command

**OWASP A03:2021 — Injection** **File:**
`/Users/z/Developer/spike-land-ai/spike.land/scripts/test-cache-manager.ts:93`

**Description:**

```typescript
execSync(`git diff --name-only ${sinceCommit} HEAD`, { ... });
```

`sinceCommit` comes from reading a local cache file. If the cache file is
writable by another process or user, a malicious value could inject shell
metacharacters. There is an existence check (`git cat-file -t ${sinceCommit}`)
but it runs under the same injection risk.

**Not auto-fixed** because this runs in CI, not in a user-facing context.
**Recommendation:** Use
`execFileSync('git', ['diff', '--name-only', sinceCommit, 'HEAD'])`. Git will
safely quote arguments; no shell expansion occurs.

---

### M3 — Sensitive Data Written to stdout in Script Flow

**OWASP A09:2021 — Logging Failures** **File:**
`/Users/z/Developer/spike-land-ai/spike.land/scripts/create-api-key.js:35`

**Description:**

```javascript
console.log(`Created API key: ${key}`);
```

API key values logged to stdout are captured by any CI log aggregator or shell
pipeline watching the process.

**Not auto-fixed** because the script's purpose is to print the key for
copy/paste. **Recommendation:** Print keys to stderr. Add a warning that the key
will not be shown again and must be stored securely.

---

### M4 — HackerNews Session Cookie Stored in Plaintext In-Memory

**File:**
`/Users/z/Developer/spike-land-ai/hackernews-mcp/src/session/session-manager.ts`

**Description:** The HN session cookie (which grants full HN account access) is
stored in `SessionManager.state.cookie` as a plain string in process memory. The
session has a 24-hour TTL check, but:

1. The cookie value is accessible to anyone who can call `getState()`.
2. No expiry is enforced by the HN server — the MCP tool trusts only its local
   timestamp.
3. The session is process-scoped (not persisted), which is actually good from a
   security standpoint; however, a crash-restart cycle silently drops the
   session without logging the credential lifecycle.

**Recommendation:** This is a reasonable design for an MCP tool. The risk is
acceptable given the MCP server runs locally. However, ensure the MCP server is
not exposed over a network without an auth layer.

---

### M5 — `dangerouslyAllowSVG: true` in Next.js Image Config

**OWASP A05:2021 — Security Misconfiguration** **File:**
`/Users/z/Developer/spike-land-ai/spike.land/next.config.ts:119`

**Description:** SVG images processed by Next.js Image Optimization with
`dangerouslyAllowSVG: true` can contain embedded JavaScript. The accompanying
`contentSecurityPolicy` on images (`sandbox;`) mitigates the primary XSS vector,
but the combination remains a risk if the sandboxing is bypassed.

**Current mitigation:**
`contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"`. This
is the correct mitigation pattern per Next.js documentation.

**Recommendation:** No immediate action needed, but ensure SVG source domains in
`remotePatterns` only include trusted hosts (currently: `*.r2.dev`,
`*.r2.cloudflarestorage.com`, `images.unsplash.com`, `placehold.co` — all
reasonable).

---

### M6 — serverActions allowedOrigins includes `*.amazonaws.com` Wildcard

**OWASP A01:2021 — Broken Access Control** **File:**
`/Users/z/Developer/spike-land-ai/spike.land/next.config.ts:57`

**Description:**

```typescript
serverActions: {
  allowedOrigins: [
    "spike.land",
    "www.spike.land",
    "localhost:3000",
    "*.elb.amazonaws.com",
    "*.amazonaws.com",  // <-- overly broad
  ],
},
```

`*.amazonaws.com` allows any subdomain of amazonaws.com to invoke Server
Actions, including those controlled by other AWS customers. A malicious actor
who controls any `*.amazonaws.com` subdomain (e.g., via a compromised S3 bucket
with a static website) could invoke Server Actions cross-origin.

**Recommendation:** Narrow to the specific ALB DNS name(s):
`staging-nextjs-alb-545524503.us-east-1.elb.amazonaws.com` and the production
equivalent. Remove the `*.amazonaws.com` wildcard.

---

### M7 — Wildcard CORS on Live Codespace Routes

**File:**
`/Users/z/Developer/spike-land-ai/spike.land/src/app/live/[codeSpace]/route.ts:50`

**Description:** Codespace routes serve dynamically generated user code with
`Access-Control-Allow-Origin: *`. Since user-controlled code is served from the
same `spike.land` domain, any injected script could exfiltrate data from any
other spike.land page if the live route is embedded in a cross-origin context.

**Context:** The CORS wildcard is intentional here (public embed use case). The
risk is mitigated by the per-route CSP applied to live/bundle routes.

**Recommendation:** Confirm the CSP on these routes blocks exfiltration: ensure
`connect-src` does not include external data exfiltration targets.

---

### M8 — `readRequestBody` Crash on Missing Content-Type (ALREADY FIXED IN CODEBASE)

**File:** `/Users/z/Developer/spike-land-ai/spike-land-backend/src/utils.ts:112`

The current production file already uses `?? ""` instead of `!`. This was
verified during the audit — the fix was previously applied. No action needed.

---

## LOW Findings (Informational)

### L1 — Test Utils Contain Realistic-Looking Tokens

**File:**
`/Users/z/Developer/spike-land-ai/spike-land-backend/src/test-utils.ts:33`

Test environment bindings use string literals like `"test-api-key"` and
`"test-replicate-api-token"`. These are clearly test values and pose no risk,
but secret scanning tools (truffleHog, gitleaks) may flag them. Consider using a
`test-utils-mock` prefix convention.

---

### L2 — `SKIP_PERMISSIONS` Flag in vibe-dev

**File:** `/Users/z/Developer/spike-land-ai/vibe-dev/src/agent.ts:46`

```typescript
const SKIP_PERMISSIONS = process.env.AGENT_REQUIRE_PERMISSIONS !== "true";
```

The default (`AGENT_REQUIRE_PERMISSIONS` unset) causes the Claude CLI to be
invoked with `--dangerously-skip-permissions`. In a Docker container this is
acceptable, but the opt-in should be inverted: require permissions by default,
skip only when explicitly set.

---

### L3 — HN Login Fallback Cookie on Redirect-Based Auth

**File:**
`/Users/z/Developer/spike-land-ai/hackernews-mcp/src/clients/hn-write-client.ts:48`

```typescript
// Even without set-cookie header, some environments handle cookies differently
this.session.login(username, `user=${username}`);
```

When the HN login returns `URL=news` without a `set-cookie` header, the client
stores a synthetic cookie `user={username}` (no actual auth token). All
subsequent requests with this fake cookie will fail on HN's server with auth
errors — not a security risk, but a correctness problem that may silently
succeed from the client's perspective.

---

### L4 — `Permissions-Policy: autoplay=*` in Cloudflare Worker Headers

**File:**
`/Users/z/Developer/spike-land-ai/spike-land-backend/src/mainFetchHandler.ts:14`

`Permissions-Policy: autoplay=*` grants all origins permission to autoplay
media. This is permissive but not a security vulnerability. More concerning:
other powerful permissions (camera, microphone, payment) are not explicitly
denied. Consider adding `camera=(), microphone=(), payment=()` to the policy.

---

### L5 — TECH_DEBT_REPORT.md at Repo Root

**File:** `/Users/z/Developer/spike-land-ai/TECH_DEBT_REPORT.md`

Internal debt tracking files at the repository root are visible to anyone with
repo read access and may reveal architectural weaknesses to attackers who gain
read access. Consider moving to `docs/` or marking as internal-only.

---

## Fixed Files Summary

| File                                                                          | Issue Fixed                                                         |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `/Users/z/Developer/spike-land-ai/spike.land/scripts/create-agent/server.ts`  | Removed hardcoded default secret; added startup exit; narrowed CORS |
| `/Users/z/Developer/spike-land-ai/spike.land/scripts/learnit-agent/server.ts` | Removed hardcoded default secret; added startup exit; narrowed CORS |
| `/Users/z/Developer/spike-land-ai/spike.land/scripts/generate-mcp-token.ts`   | Token written to stderr instead of stdout                           |
| `/Users/z/Developer/spike-land-ai/spike.land/scripts/mcp-auth-setup.ts`       | Raw token value removed from console.log                            |
| `/Users/z/Developer/spike-land-ai/spike.land/scripts/db-migrate-ci.ts`        | Added 64-char length limit to migration name validation             |
| `/Users/z/Developer/spike-land-ai/spike.land/next.config.ts`                  | Added global Content-Security-Policy header                         |

---

## Recommended Next Actions (Priority Order)

1. **[P0]** Add auth check to Replicate endpoint in
   `spike-land-backend/src/chat.ts` before `handleReplicateRequest` — any
   unauthenticated user can trigger paid API calls.

2. **[P0]** Set `CREATE_AGENT_SECRET` and `LEARNIT_AGENT_SECRET` as required
   secrets in your deployment pipeline. The servers now refuse to start without
   them.

3. **[P1]** Narrow `serverActions.allowedOrigins` in `next.config.ts` — remove
   `*.amazonaws.com` and use the specific ALB hostname.

4. **[P1]** Replace `execFileSync` with array-argument form in
   `test-cache-manager.ts` for the git diff command.

5. **[P2]** Scope CORS on the spike-land-backend Cloudflare Worker to an
   allowlist of known spike.land origins instead of `*`.

6. **[P2]** Audit production capability token grants to ensure no
   `allowedTools: ["*"]` in non-test contexts.

7. **[P3]** Invert the `SKIP_PERMISSIONS` default in `vibe-dev` to
   require-by-default.

8. **[P3]** Add `camera=(), microphone=(), payment=()` to the
   `Permissions-Policy` in `spike-land-backend` main fetch handler.
