# Token Bank — Community API Key Pool for spike.land

**Status:** Draft
**Date:** 2026-03-16
**Authors:** The Arena — Radix, Zoltan, Spike, Erdos, Arnold, Bazdmeg
**Source:** `src/edge-api/main/api/routes/spike-api.ts` (lines 363–447)
**Schema:** `src/edge-api/main/db/migrations/0018_spike_api.sql`

---

## Current State (Honest Assessment)

The `/v1/donate-token` endpoint exists and writes to `donated_tokens` in D1.
Here is what is broken right now:

1. **Keys are stored in plaintext.** The column is called `encrypted_key` but
   the code does `.bind(id, userId, provider, apiKey, now)` — raw key, zero
   encryption. Anyone with D1 console access sees every donated key.
2. **No validation.** We accept any string as `api_key`. No ping to the
   provider. Could be `"lol"`.
3. **No consumption path.** Nothing in `resolveSynthesisTarget` reads from
   `donated_tokens`. The keys sit in D1 doing nothing.
4. **No audit trail.** No log of who used a donated key or when.
5. **No health checks.** Dead keys stay `active = 1` forever.
6. **10-credit reward is trivially farmable.** Donate garbage key, get credits.

This PRD defines the target architecture and a 14-day plan to fix all of it.

---

## 1. Accepted Token Types

| Provider    | Key Format                          | Validation Endpoint              | Notes                                             |
| ----------- | ----------------------------------- | -------------------------------- | ------------------------------------------------- |
| `anthropic` | `sk-ant-*` or OAuth token           | `POST /v1/messages` (dry run)    | OAuth tokens expire; API keys don't               |
| `openai`    | `sk-*` or `sk-proj-*`              | `GET /v1/models`                 | Org keys need `OpenAI-Organization` header         |
| `google`    | `AIza*`                            | `GET /v1beta/models`             | Free tier has 15 RPM — low value for pool          |
| `xai`       | `xai-*`                            | `GET /v1/models`                 | Grok API, relatively new                          |
| `deepseek`  | `sk-*`                             | `GET /v1/models`                 | Cheap tokens, high value for bulk work            |
| `mistral`   | API key string                      | `GET /v1/models`                 | Good for European data residency                  |

### CLAUDE_CODE_OAUTH_TOKEN (Special Case)

This is the crown jewel and the landmine.

- **What it is:** An OAuth2 access token from Anthropic's Claude Code flow.
  Scoped to the user's Claude Pro/Team/Enterprise plan. Enables
  `claude-sonnet-4`, `claude-opus-4` access at the user's plan rate.
- **Expiry:** OAuth tokens expire (typically 1 hour). Refresh tokens last
  longer. We would need the refresh token to maintain access.
- **What we could do with it:** Route inference requests through the donor's
  plan. Effectively multiplexing one Pro subscription across multiple callers.
- **ToS risk: HIGH.** Anthropic's Acceptable Use Policy prohibits sharing
  credentials. Sharing an OAuth token is credential sharing by definition.
  Anthropic could revoke the token, suspend the account, or ban the user.
  We must not pretend this is fine. **We should accept these tokens only with
  an explicit "I understand the risk" consent gate, and we should not
  actively solicit them.**
- **Recommendation:** Accept but label as `experimental`. Show a warning.
  Do not advertise. If Anthropic contacts us, disable immediately.

---

## 2. Security Architecture (Erdos + Bazdmeg)

### 2.1 Encryption at Rest

Cloudflare Workers have access to the Web Crypto API (`crypto.subtle`). No
Node.js `crypto` needed.

**Scheme: AES-256-GCM with per-key IV**

```
encrypt(plaintext, masterKey):
  iv = crypto.getRandomValues(new Uint8Array(12))
  ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    masterKey,
    encode(plaintext)
  )
  return base64(iv + ciphertext)

decrypt(stored, masterKey):
  bytes = base64decode(stored)
  iv = bytes.slice(0, 12)
  ciphertext = bytes.slice(12)
  plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    masterKey,
    ciphertext
  )
  return decode(plaintext)
```

- **Master key:** Stored as a Cloudflare Worker secret (`TOKEN_BANK_KEY`),
  a 256-bit base64-encoded key. Generated once with
  `crypto.getRandomValues(new Uint8Array(32))`.
- **Key rotation:** When rotating the master key, run a migration worker that
  decrypts all keys with the old master and re-encrypts with the new one.
  Store `key_version INTEGER DEFAULT 1` in the table to support concurrent
  old/new keys during rotation.

### 2.2 Access Control

- **Who can donate:** Any authenticated user.
- **Who can consume (use donated keys):** Only the edge worker itself.
  No human, no API caller, no admin panel ever sees a decrypted key.
  The key is decrypted in-memory inside the Worker, used for one API call,
  then discarded. The response is proxied back to the caller.
- **Admin access:** D1 console shows only ciphertext. Even Cloudflare
  dashboard access does not reveal keys without the Worker secret.

### 2.3 Audit Trail

New table: `token_bank_audit`

```sql
CREATE TABLE token_bank_audit (
  id TEXT PRIMARY KEY,
  token_id TEXT NOT NULL,
  donor_user_id TEXT NOT NULL,
  caller_user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  action TEXT NOT NULL,         -- 'call', 'error', 'deactivated', 'health_check'
  status_code INTEGER,
  latency_ms INTEGER,
  error_message TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_audit_token ON token_bank_audit(token_id, created_at);
CREATE INDEX idx_audit_caller ON token_bank_audit(caller_user_id, created_at);
```

Every single proxied call through a donated key gets a row. No exceptions.

### 2.4 Rate Limiting

| Scope                   | Limit                 | Window  | Enforcement        |
| ----------------------- | --------------------- | ------- | ------------------- |
| Per donated key         | 60 calls              | 1 hour  | D1 count query      |
| Per donated key         | 500 calls             | 1 day   | D1 count query      |
| Per caller on pool      | 20 calls              | 1 hour  | Durable Object      |
| Per caller on pool      | 100 calls             | 1 day   | Durable Object      |
| Global pool             | 2000 calls            | 1 hour  | Durable Object      |

### 2.5 Automatic Deactivation

If a key returns 401 or 403 from the upstream provider:

1. Increment `error_count` on the token row.
2. If `error_count >= 3` within 1 hour, set `active = 0`,
   `deactivated_reason = 'auth_failure'`.
3. Log to audit trail with action `'deactivated'`.
4. Notify donor (if we have email/webhook) that their key was deactivated.

### 2.6 Proxy-Only Architecture

```
Caller -> spike.land /v1/ask -> Token Pool Selector -> decrypt key in memory
  -> upstream provider API call with decrypted key -> response back to caller
```

The decrypted key exists only in the Worker's V8 isolate memory for the
duration of one `fetch()` call. It is never:
- Returned in any response body or header
- Logged (not even partially — no `sk-ant-...xxx` style masking in logs)
- Written to any persistent store in decrypted form
- Passed to any Durable Object or service binding

---

## 3. Token Pool Strategy (Arnold + Zoltan)

### 3.1 Selection Algorithm: Weighted Least-Recently-Used

Not round-robin (ignores health), not pure random (no fairness), not pure LRU
(ignores capacity differences).

**Algorithm:**

```
1. Query active tokens for requested provider
2. Filter out tokens that hit their hourly/daily rate limit
3. Score each token:
     score = (time_since_last_use_seconds * 0.6)
           + (remaining_hourly_quota_pct * 0.3)
           + (success_rate_last_hour * 0.1)
4. Select token with highest score
5. On tie, random selection
```

### 3.2 Handling 429s (Rate Limits from Providers)

When a provider returns 429:

1. Parse `Retry-After` header (or default to 60 seconds).
2. Mark token as `cooldown_until = now + retry_after` in Durable Object state.
3. Token is excluded from selection until cooldown expires.
4. If ALL tokens for a provider are in cooldown, return 503 to caller with
   `Retry-After` header set to the earliest cooldown expiry.
5. Do NOT count 429 as an auth error (don't deactivate).

### 3.3 Health Checks

**Periodic (every 15 minutes via Cron Trigger):**

- For each active token, make a lightweight validation call (e.g.,
  `GET /v1/models` for OpenAI, minimal `/v1/messages` for Anthropic).
- Update `last_health_check`, `health_status` columns.
- Deactivate tokens that fail 3 consecutive health checks.

**Cost-conscious:** Health checks should use the cheapest possible endpoint.
Never send a real inference request as a health check.

### 3.4 Graceful Degradation

Priority order for resolving an API key:

1. User's own key (from their profile / BYOK)
2. Platform keys (`GEMINI_API_KEY`, `CLAUDE_OAUTH_TOKEN` from env)
3. Donated token pool (this system)
4. Return 503 with helpful error: "No keys available. Donate one or add your
   own at /api/keys."

### 3.5 Provider-Specific Quirks

| Provider  | Quirk                                                        |
| --------- | ------------------------------------------------------------ |
| Anthropic | API keys use `x-api-key` header. OAuth uses `Authorization: Bearer`. Must detect which format. |
| OpenAI    | Org keys need `OpenAI-Organization` header. Store org ID alongside key. |
| Google    | Gemini API keys go in query param `?key=`. Not a header.     |
| xAI       | Standard Bearer token. No quirks known yet.                   |

### 3.6 Durable Object for Pool State

A `TokenPoolDO` Durable Object holds the hot state:

- In-memory map of `{ tokenId -> { lastUsed, cooldownUntil, hourlyCount, errorCount } }`
- Avoids D1 reads on every inference call (D1 is ~5ms per read, DO alarm is sub-ms)
- Syncs back to D1 every 60 seconds via `alarm()` handler
- On cold start, hydrates from D1

This is critical. Without the DO, every `/v1/ask` call would need 2-3 D1
queries just for token selection. With the DO, it is one in-memory lookup.

---

## 4. User Experience (Spike + Radix)

### 4.1 Donation Flow

```
User clicks "Donate a Key" on /pricing or /dashboard
  -> Modal: paste key, select provider (auto-detected from key prefix)
  -> Frontend calls POST /v1/donate-token
  -> Backend validates key against provider API (real call, ~500ms)
  -> If valid: encrypt, store, return success + credits earned
  -> If invalid: return error "Key is not valid for [provider]"
  -> If key already donated (by anyone): return error "Key already in pool"
```

Key prefix auto-detection:
- `sk-ant-` -> anthropic
- `sk-` or `sk-proj-` -> openai
- `AIza` -> google
- `xai-` -> xai

### 4.2 Donor Dashboard

At `/dashboard/tokens`:

- List of your donated keys (masked: `sk-ant-...a3f2`)
- Per-key stats: total calls served, last used, status (active/deactivated/cooldown)
- Aggregate: "Your keys have served X community requests"
- Revoke button: immediately deactivates a donated key
- Privacy: you see only your own keys and your own aggregate stats

### 4.3 Pool Transparency (Public)

At `/v1/donate-token/stats` (already exists, enhance it):

```json
{
  "pool": [
    { "provider": "anthropic", "active_keys": 12, "calls_today": 847 },
    { "provider": "openai", "active_keys": 8, "calls_today": 423 }
  ],
  "total_donors": 15,
  "total_calls_all_time": 24891,
  "pool_health": "healthy",
  "message": "spike.land runs on donated API keys. Every key helps."
}
```

Never expose: individual key IDs, donor identities, actual key values.

### 4.4 Gamification

- **Token Hero** badge: donated 1+ active key
- **Power Donor** badge: donated 5+ active keys
- **Community Backbone** badge: keys have served 1000+ total calls
- Badges shown on user profile (public, opt-in)
- Leaderboard: "Top donors this month" (by calls served, not by key count)
  — opt-in only, anonymous by default

---

## 5. Anti-Abuse (Bazdmeg)

Bazdmeg here. Let me tell you how every one of these will be exploited and
what we do about it.

### 5.1 Garbage Key Farming

**Attack:** Donate invalid keys to farm 10 credits per donation.

**Fix:** Validate before storing. Call the provider's cheapest endpoint with
the key. Only store and reward credits if validation succeeds. This is already
the #1 priority fix.

### 5.2 Revoked Key Donation

**Attack:** Donate a key, wait for credits, then revoke it on the provider side.

**Fix:**
- Credits are earned upfront (10) but the real value is reputation/badges
  based on actual calls served.
- Health checks will catch revoked keys within 15 minutes.
- If a key is deactivated within 24 hours of donation, claw back the credits.
  New column: `credits_clawed_back INTEGER DEFAULT 0`.

### 5.3 Pool Draining

**Attack:** One caller sends thousands of expensive requests (long context,
max tokens) through the pool, burning through everyone's donated keys.

**Fix:**
- Per-caller rate limits (20/hour, 100/day on pool usage).
- Max token cap on pool-sourced requests: 4096 tokens. Want more? Use your
  own key.
- Cost estimation: track estimated cost per call. If a caller's estimated
  daily cost exceeds $5, cut them off from the pool.

### 5.4 Credential Stuffing

**Attack:** Donate stolen API keys.

**Fix:** This is the hardest problem. We cannot verify key ownership. Mitigations:
- Require authenticated users (already done).
- Log donor identity in audit trail.
- If a key is reported stolen, deactivate immediately and flag the donor account.
- Include in ToS: "You must be the legitimate owner of any donated key."
- Rate limit donations: max 5 keys per user per day.

### 5.5 Anomaly Detection

Flag for manual review when:
- A single caller uses >50% of a single token's daily budget
- A token's error rate exceeds 20% in an hour
- A new account donates >3 keys within 1 hour of signup
- Same key prefix donated by multiple accounts (possible key sharing ring)

---

## 6. Target Architecture

### Schema (Migration 0019)

```sql
-- Upgrade donated_tokens
ALTER TABLE donated_tokens ADD COLUMN key_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE donated_tokens ADD COLUMN provider_meta TEXT;  -- JSON: org_id, scopes, etc.
ALTER TABLE donated_tokens ADD COLUMN cooldown_until INTEGER;
ALTER TABLE donated_tokens ADD COLUMN error_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE donated_tokens ADD COLUMN last_health_check INTEGER;
ALTER TABLE donated_tokens ADD COLUMN health_status TEXT DEFAULT 'unknown';
ALTER TABLE donated_tokens ADD COLUMN deactivated_reason TEXT;
ALTER TABLE donated_tokens ADD COLUMN credits_clawed_back INTEGER DEFAULT 0;

-- Audit trail
CREATE TABLE IF NOT EXISTS token_bank_audit (
  id TEXT PRIMARY KEY,
  token_id TEXT NOT NULL,
  donor_user_id TEXT NOT NULL,
  caller_user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  action TEXT NOT NULL,
  status_code INTEGER,
  latency_ms INTEGER,
  error_message TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tba_token ON token_bank_audit(token_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tba_caller ON token_bank_audit(caller_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tba_action ON token_bank_audit(action, created_at);
```

### Component Map

```
POST /v1/donate-token
  -> validate key against provider
  -> encrypt with AES-256-GCM
  -> store in D1
  -> grant credits
  -> notify TokenPoolDO to refresh

POST /v1/ask (or /v1/thread)
  -> resolveSynthesisTarget()
     -> try user's own key
     -> try platform keys
     -> ask TokenPoolDO for a donated key
        -> DO returns { tokenId, decryptedKey, provider }
        -> (key decrypted inside DO, passed via internal binding, never leaves Worker)
  -> make upstream call
  -> log to token_bank_audit (waitUntil)
  -> on 401/403: report to DO for deactivation
  -> on 429: report to DO for cooldown

Cron (every 15 min)
  -> TokenPoolDO.healthCheck()
  -> for each active token: lightweight provider ping
  -> deactivate dead tokens
  -> sync stats back to D1
```

---

## 7. Legal and ToS Risks (Honest Section)

**We are not lawyers. This section is our best understanding. Get legal review
before launch.**

### Provider ToS Analysis

| Provider  | Key Sharing Policy                                    | Risk Level |
| --------- | ----------------------------------------------------- | ---------- |
| Anthropic | AUP prohibits sharing credentials. OAuth tokens are credentials. | **HIGH** |
| OpenAI    | Terms say keys are confidential and non-transferable. | **HIGH** |
| Google    | API keys are per-project. Sharing violates ToS.       | **MEDIUM** |
| xAI       | Early-stage ToS, less explicit about sharing.         | **LOW**    |

### Our Position

We are building infrastructure for voluntary, informed key donation. We are
not scraping keys, not tricking users, not hiding what happens. The donor
explicitly chooses to share their key.

That said:
- Every provider's ToS says keys are non-transferable.
- If a provider contacts us, we immediately disable that provider from the pool.
- We should consult with each provider's partnership/developer relations team
  before going public with this feature.
- We should have a "kill switch" that disables the entire token pool with one
  config change.

### Mitigation

- Prominent disclaimer on the donation page: "Sharing your API key may violate
  your provider's Terms of Service. You accept full responsibility."
- Do not advertise this feature externally until we have at least informal
  approval from providers.
- Build the system so it works equally well with legitimately obtained
  "community keys" (e.g., Anthropic grants a community key for open-source
  projects).

---

## 8. 14-Day Action Plan

### Phase 1: Stop the Bleeding (Days 1-3)

**Tasks:**
- [ ] Implement AES-256-GCM encryption in a `token-bank-crypto.ts` module
- [ ] Add `TOKEN_BANK_KEY` Worker secret
- [ ] Migrate existing plaintext keys to encrypted form (one-time script)
- [ ] Add key validation on donation (call provider endpoint before storing)
- [ ] Block credit grant if validation fails

**Done when:**
- `donated_tokens.encrypted_key` contains only ciphertext for all rows
- Donating `"garbage123"` returns a 422 error, not a success
- D1 console shows no readable API keys

### Phase 2: Make It Work (Days 4-7)

**Tasks:**
- [ ] Create `TokenPoolDO` Durable Object with in-memory token state
- [ ] Implement weighted-LRU selection algorithm
- [ ] Wire `resolveSynthesisTarget()` to fall back to donated pool
- [ ] Handle 429 cooldowns and 401 deactivation
- [ ] Write migration 0019 with new columns and audit table
- [ ] Log every pool call to `token_bank_audit`

**Done when:**
- A `/v1/ask` request from a user with no keys successfully routes through
  a donated key
- A donated key that returns 401 is automatically deactivated within 3 calls
- A donated key hitting 429 enters cooldown and is skipped by the selector
- Every pool call has a corresponding audit row

### Phase 3: Protect It (Days 8-11)

**Tasks:**
- [ ] Implement per-caller and per-token rate limits
- [ ] Add credit clawback for keys deactivated <24h after donation
- [ ] Set up Cron Trigger for health checks (every 15 min)
- [ ] Add anomaly detection flags (log-based, manual review for now)
- [ ] Add donation rate limit (5 keys/user/day)
- [ ] Add max-tokens cap (4096) for pool-sourced requests

**Done when:**
- A single caller cannot make more than 100 pool calls per day
- A key that fails health check 3x in a row is deactivated
- A user who donates 6 keys in one day gets blocked on the 6th
- Audit log shows anomaly flags

### Phase 4: Ship the UX (Days 12-14)

**Tasks:**
- [ ] Enhance `/v1/donate-token/stats` with richer pool health data
- [ ] Build donor dashboard page (key list, stats, revoke)
- [ ] Add key auto-detection by prefix in the donation form
- [ ] Add disclaimer/consent gate for donation
- [ ] Add Token Hero badge system
- [ ] Deploy kill switch (env var `TOKEN_POOL_ENABLED=true/false`)

**Done when:**
- Donor can see their keys, usage stats, and revoke from dashboard
- Pool stats endpoint returns active keys, calls today, health status
- Kill switch can disable entire pool in <1 minute via Cloudflare dashboard
- Donation page shows legal disclaimer

---

## Open Questions

1. **Should we pay donors?** Instead of credits, actual money from platform
   revenue? This changes the legal picture significantly (reselling access).
2. **Should we cap pool usage by tier?** Free users get pool access, Pro users
   should use their own keys?
3. **Should we support key "lending" instead of donating?** Lend your key for
   X hours, get Y credits, then it's returned (deactivated from pool).
4. **Multi-region token pools?** Different DO instances per region for latency?
5. **What happens when we scale past 100 donated keys?** D1 probably fine,
   but the DO state map grows. Consider sharding by provider.

---

*This PRD was written by the full arena. Erdos did the crypto. Bazdmeg did the
abuse scenarios. Arnold and Zoltan designed the pool algorithm. Spike and Radix
designed the UX. Everyone argued about the legal section. Nobody is fully
comfortable with it, which is correct.*
