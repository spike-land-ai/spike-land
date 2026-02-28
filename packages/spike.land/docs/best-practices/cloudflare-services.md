# Cloudflare Cloud Services: Best Practices & Integration Guide

A comprehensive guide to Cloudflare's cloud services ecosystem, including R2
object storage, Workers edge computing, D1 SQL database, and security features.
This document covers best practices, integration patterns, and practical
implementation strategies for Next.js applications.

---

## Table of Contents

- [Cloudflare R2 (Object Storage)](#cloudflare-r2-object-storage)
- [Cloudflare Workers](#cloudflare-workers)
- [Cloudflare D1 (SQL Database)](#cloudflare-d1-sql-database)
- [DNS & CDN](#dns--cdn)
- [Security & DDoS Protection](#security--ddos-protection)
- [Next.js Integration](#nextjs-integration)
- [Pricing Comparison](#pricing-comparison)
- [Implementation Checklist](#implementation-checklist)

---

## Cloudflare R2 (Object Storage)

### Overview

Cloudflare R2 is a serverless object storage solution with S3-compatible API.
The key differentiator is **zero egress fees**, making it ideal for applications
with high data retrieval requirements.

**Key Facts:**

- S3-compatible API for easy migration
- 330+ data center distribution globally
- Zero egress costs (no data transfer fees)
- Built-in CDN integration
- Automatic failover and replication

### S3 Compatibility

R2 implements the S3 API to enable seamless migration from AWS S3. However, not
all S3 features are available.

#### Configuration Details

**API Endpoint:**

```
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Find your Account ID in the Cloudflare dashboard.

**Region Setting:**

```
Region: "auto"  // R2's only region
```

For tools requiring specific regions:

- Empty string → auto region
- `us-east-1` → auto region
- `us-east-1` CreateBucket LocationConstraint → auto region

**SDK Configuration (AWS SDK v3):**

```javascript
import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for R2 compatibility
});
```

#### Supported Operations

**✅ Fully Implemented:**

- Bucket operations: ListBuckets, HeadBucket, CreateBucket, DeleteBucket
- Object operations: GetObject, PutObject, DeleteObject
- Multipart uploads: CreateMultipartUpload, UploadPart, CompleteMultipartUpload
- Object copying: CopyObject
- Listing: ListObjectsV2 (preferred over ListObjects)
- Head operations: HeadObject

**🚧 Experimental:**

- Certain checksum operations
- Conditional operations

**❌ Not Implemented:**

- ACL (Access Control Lists)
- Object tagging
- Lifecycle rules
- Object versioning
- AWS KMS encryption
- `x-amz-expected-bucket-owner` headers

#### Checksum Support

R2 supports specific checksum types:

- **Full objects:** CRC-64/NVME
- **Composite operations:** CRC-32, CRC-32C, SHA-1, SHA-256

### Cost Optimization

#### Pricing Model

- **Storage:** Based on total stored data (monthly)
- **Operations:** Read and write operation costs
- **Zero Egress:** No data transfer fees (major advantage)

#### Cost Comparison Table

| Feature          | R2       | AWS S3        | Backblaze B2  |
| ---------------- | -------- | ------------- | ------------- |
| Storage Cost     | Moderate | Moderate      | Low           |
| Read Operations  | Charged  | Charged       | Charged       |
| Write Operations | Charged  | Charged       | Charged       |
| Egress/Bandwidth | **FREE** | **Expensive** | **Expensive** |
| Data Transfer In | Free     | Free          | Free          |

#### Optimization Strategies

1. **Request Consolidation:**
   - Batch multiple small operations into fewer, larger operations
   - Use ListObjectsV2 with pagination to reduce overhead

2. **Caching:**
   - Integrate R2 with Cloudflare's CDN for automatic caching
   - Set appropriate Cache-Control headers on objects
   - Leverage Tiered Cache for frequently accessed content

3. **Lifecycle Management:**
   - Delete old/unnecessary objects regularly
   - Archive infrequently accessed data
   - Monitor storage growth trends

4. **Regional Distribution:**
   - R2's "auto" region handles global distribution automatically
   - No need for multi-region management

### Migration from AWS S3

#### Option 1: R2 Super Slurper (Recommended)

Cloudflare provides automated migration tool:

1. Enable incremental migration on R2 bucket
2. R2 automatically fetches objects from S3 on-demand
3. Objects are cached in R2 on first access
4. Gradual migration without service disruption

**Benefits:**

- No downtime required
- Lazy loading of objects
- Continue using S3 as fallback during transition

#### Option 2: Manual Migration

```bash
# Export S3 data to local
aws s3 sync s3://source-bucket ./local-bucket

# Upload to R2 using AWS CLI with custom endpoint
aws s3 sync ./local-bucket s3://r2-bucket \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com \
  --region auto
```

#### Option 3: Programmatic Migration

```javascript
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "us-east-1", // AWS S3
  credentials: {/* AWS creds */},
});

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {/* R2 creds */},
});

async function migrateObject(bucket, key) {
  // Get from S3
  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );

  // Put to R2
  await r2Client.send(
    new PutObjectCommand({
      Bucket: "r2-bucket",
      Key: key,
      Body: response.Body,
      ContentType: response.ContentType,
    }),
  );
}
```

### CDN Integration

R2 integrates seamlessly with Cloudflare's global CDN:

1. **Automatic Distribution:** Content cached across 330+ data centers
2. **Cache Control:** Use standard HTTP Cache-Control headers
3. **Tiered Cache:** Enable for frequently accessed content
4. **Cache Purge:** Use Cloudflare dashboard or API

### Use Cases

**Ideal for:**

- User-facing web assets (images, videos, documents)
- Machine learning datasets
- Backup and disaster recovery
- Content distribution networks
- Development/test environments with frequent restores

**Not ideal for:**

- Frequent small object modifications
- Complex ACL requirements
- Versioning-heavy workflows

---

## Cloudflare Workers

### Overview

Cloudflare Workers enables serverless computing at the edge—code runs in 200+
data centers globally, close to users. This provides sub-millisecond response
times and automatic scaling.

**Key Benefits:**

- **Global distribution:** 200+ data centers worldwide
- **Low latency:** Code runs near users (typical: <10ms)
- **Auto-scaling:** Handles traffic spikes without provisioning
- **No cold starts:** Instant execution
- **Integrated ecosystem:** Works with KV, R2, D1, Durable Objects

### Storage Options

Cloudflare provides eight storage solutions for different use cases:

#### 1. Workers KV (Key-Value Store)

**Best for:** High-read, low-write scenarios

**Characteristics:**

- Eventually consistent
- Global distribution with local caching
- High read performance: 10ms-100ms for cached keys, <1ms from memory
- 1 write per second per unique key limit
- Auto-replication across 300+ locations

**Use Cases:**

- Session data
- API credentials/tokens
- Configuration data
- Rate limiting counters
- Cache layer

**Example:**

```javascript
export default {
  async fetch(request, env) {
    const cacheKey = new Request(request.url, { method: "GET" });
    const cache = caches.default;

    // Check KV for cached value
    const cached = await env.KV_STORE.get("user-session-123");

    if (cached) {
      return new Response(cached, {
        headers: { "content-type": "application/json" },
      });
    }

    // Fetch from origin if not in KV
    const response = await fetch(request);

    // Store in KV (max 60 second TTL)
    await env.KV_STORE.put("user-session-123", response.text(), {
      expirationTtl: 60,
    });

    return response;
  },
};
```

**2024 Rearchitecture:**

- Previously: Dual-backend (internal + GCP)
- Current: Size-based routing
  - Small objects (<threshold) → Cloudflare distributed database
  - Large objects → R2 object storage
- Result: 40x performance improvement, improved reliability

#### 2. Durable Objects

**Best for:** Stateful serverless, global coordination, strong consistency

**Characteristics:**

- Global uniqueness per Durable Object instance
- Transactional storage (SQL or KV API)
- Strong consistency and ordering
- WebSocket support for real-time
- Per-object automatic scaling
- Up to 10 GB storage per instance

**Use Cases:**

- Real-time collaboration (docs, spreadsheets)
- Chat systems
- Multiplayer games
- State coordination
- Rate limiting with global counters
- Queues and workflows

**Architecture:**

```
┌─ Durable Object 1 (User A)
├─ Durable Object 2 (User B)
└─ Durable Object N (User N)

Each instance:
- Unique global identity
- Automatic geographic placement
- Transactional SQL or KV storage
- WebSocket connections
- Alarms for scheduled tasks
```

**Example:**

```javascript
export class Counter {
  constructor(state, env) {
    this.state = state;
  }

  async increment() {
    let count = (await this.state.get("count")) || 0;
    count++;
    await this.state.put("count", count);
    return count;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/increment") {
      const newCount = await this.increment();
      return new Response(newCount);
    }

    return new Response("Not found", { status: 404 });
  }
}

export default {
  fetch(request, env) {
    const name = new URL(request.url).searchParams.get("name");
    const id = env.COUNTER.idFromName(name);
    const counter = env.COUNTER.get(id);
    return counter.fetch(request);
  },
};
```

#### 3. R2 (Object Storage)

See [Cloudflare R2](#cloudflare-r2-object-storage) section above.

#### 4. D1 (SQL Database)

See [Cloudflare D1](#cloudflare-d1-sql-database) section below.

#### 5. Queues

**Best for:** Background jobs, asynchronous processing

**Characteristics:**

- At-least-once delivery
- No egress charges
- Decouples producers and consumers
- Supports batch processing

#### 6. Hyperdrive

**Best for:** Existing Postgres/MySQL databases

**Characteristics:**

- Connection pooling
- Query caching
- Reduces origin database load
- Lower latency for existing databases

#### 7. Vectorize

**Best for:** AI/ML embeddings, semantic search

**Characteristics:**

- Vector database
- RAG (Retrieval Augmented Generation) support
- Semantic search capabilities

#### 8. Analytics Engine & Pipelines

**Best for:** Time-series data, metrics, streaming ingestion

### Edge Computing Patterns

#### Pattern 1: API Gateway at Edge

```javascript
// Intercept and route requests at edge
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Rate limiting at edge
    const clientIP = request.headers.get("cf-connecting-ip");
    const rateKey = `rate:${clientIP}`;
    const count = await env.KV.get(rateKey) || 0;

    if (count > 100) {
      return new Response("Rate limited", { status: 429 });
    }

    await env.KV.put(rateKey, count + 1, { expirationTtl: 60 });

    // Route to appropriate origin
    if (url.pathname.startsWith("/api/")) {
      return fetch(`https://api.example.com${url.pathname}`, request);
    } else if (url.pathname.startsWith("/static/")) {
      return env.R2.get(url.pathname);
    } else {
      return fetch(`https://origin.example.com${url.pathname}`, request);
    }
  },
};
```

#### Pattern 2: Response Transformation

```javascript
// Transform origin responses at edge
export default {
  async fetch(request, env) {
    const response = await fetch(request);

    if (response.headers.get("content-type")?.includes("application/json")) {
      const json = await response.json();

      // Add timestamp
      json.timestamp = new Date().toISOString();

      // Strip sensitive data
      delete json.apiKey;
      delete json.secret;

      return new Response(JSON.stringify(json), {
        status: response.status,
        headers: response.headers,
      });
    }

    return response;
  },
};
```

#### Pattern 3: Real-time Collaboration with Durable Objects

```javascript
// Collaborative document editing
export class Document {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Set();
  }

  async fetch(request) {
    const upgrade = request.headers.get("upgrade");

    if (upgrade === "websocket") {
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      this.sessions.add(server);

      server.addEventListener("message", async msg => {
        // Store change
        await this.state.put("content", msg.data);

        // Broadcast to all sessions
        for (const session of this.sessions) {
          if (session !== server) {
            session.send(msg.data);
          }
        }
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("WebSocket required", { status: 400 });
  }
}
```

### Pricing

**Workers Paid Plan:** $5/month minimum

Includes:

- Workers runtime
- KV storage and operations
- Durable Objects (SQLite backend included)
- D1 database
- Pages Functions

**Usage-based billing:**

- Workers CPU time
- KV operations
- Durable Objects operations
- No egress charges

---

## Cloudflare D1 (SQL Database)

### Overview

D1 is Cloudflare's managed serverless SQL database built on SQLite. It combines
SQLite's simplicity with Cloudflare's global infrastructure.

**Key Facts:**

- SQLite syntax and semantics
- Serverless (no provisioning)
- Zero network latency (embedded in Workers)
- Global replication for durability
- Per-user, per-tenant database architecture (10 GB databases)
- Built-in Time Travel for point-in-time recovery (30 days)

### Architecture

```
D1 Database
├── Primary Region (write operations)
├── Read Replicas (global distribution)
└── Backup/Replication Layer
    └── Point-in-time recovery (30 days)
```

**Performance Characteristics:**

- **Write latency:** Depends on primary region placement (typically 10-100ms)
- **Read latency:** <1ms from local edge cache
- **Throughput:** Up to 20x faster than previous generation
- **Consistency:** Strong within primary region

### Use Cases

**Ideal for:**

- User profiles and accounts
- Order and transaction data
- Relational data structures
- Per-tenant databases
- Content management
- Real-time analytics

**Not ideal for:**

- High-write-volume, globally distributed scenarios
- Complex multi-database transactions
- Massive datasets (>10 GB per database)

### Database Design Patterns

#### Pattern 1: Per-User Database

```typescript
// Each user gets isolated database instance
export async function getOrCreateUserDB(userId: string) {
  const dbName = `db-user-${userId}`;

  // Create if not exists
  const db = env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  return db;
}
```

**Benefits:**

- Data isolation per user
- Simplified access control
- Independent scaling
- Better performance per user

#### Pattern 2: Per-Tenant Database

```typescript
export async function getTenantDB(tenantId: string) {
  const dbName = `db-tenant-${tenantId}`;

  // Connect to tenant's database
  const db = await env.DB_FACTORY.prepare(
    `SELECT * FROM tenant_databases WHERE id = ?`,
    [tenantId],
  ).first();

  return env.D1[dbName];
}
```

#### Pattern 3: Sharded Architecture

```typescript
// Shard data across multiple D1 instances
function getShardId(userId: string): number {
  const hash = userId.charCodeAt(0) + userId.charCodeAt(1);
  return hash % 4; // 4 shards
}

export async function queryUserData(userId: string) {
  const shardId = getShardId(userId);
  const db = env[`DB_SHARD_${shardId}`];

  return db.prepare(
    `SELECT * FROM users WHERE id = ?`,
    [userId],
  ).first();
}
```

### SQL Features

**Supported Extensions:**

- FTS5 (Full-Text Search)
- JSON functions and operators
- Common Table Expressions (CTEs)
- Window functions
- Transactions with ACID guarantees

**Example with Full-Text Search:**

```sql
-- Create FTS5 virtual table
CREATE VIRTUAL TABLE posts_fts USING fts5(title, content);

-- Index existing content
INSERT INTO posts_fts SELECT id, title, content FROM posts;

-- Fast full-text search
SELECT * FROM posts_fts WHERE posts_fts MATCH 'cloudflare OR workers';
```

### Data Migration

#### Import from SQLite File

```bash
# Convert existing SQLite database to SQL statements
sqlite3 local.db ".dump" > schema.sql

# Execute import against D1
wrangler d1 execute my-database --file schema.sql
```

**Limitations:**

- Single file execution limit: 5 GiB
- Must convert binary SQLite to SQL

#### Export Data

```bash
# Export D1 data to SQLite
wrangler d1 backup create my-database

# Access backup via Cloudflare dashboard
```

### Time Travel & Recovery

D1 maintains automated backups allowing recovery to any point within 30 days.

**Restore from backup:**

```bash
# Create new database from specific timestamp
wrangler d1 restore my-database --backup-id <id> --from <timestamp>
```

### Performance Optimization

#### 1. Location Hints

Control where database leader is placed:

```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "xxxxxxxx"
migrations_dir = "migrations"

[d1_databases.migrations]
strategy = "rollback"

[d1_databases.options]
location_hint = "wnam" # Western North America
```

#### 2. Read Replicas

Enable read replicas for global distribution:

```javascript
// Read-only replicas distributed globally
const readResult = await env.DB_READ_REPLICA.prepare(
  `SELECT * FROM analytics WHERE date = ?`,
  [today],
).all();
```

#### 3. Query Optimization

```sql
-- Good: Use indexes
CREATE INDEX idx_user_email ON users(email);
SELECT * FROM users WHERE email = 'user@example.com';

-- Bad: Full table scan
SELECT * FROM users WHERE name LIKE '%john%';

-- Better: Use FTS5
CREATE VIRTUAL TABLE users_fts USING fts5(name);
SELECT * FROM users_fts WHERE name MATCH 'john';
```

#### 4. Batch Operations

```javascript
// Batch multiple statements
const result = await env.DB.batch([
  env.DB.prepare(`INSERT INTO users (id, name) VALUES (?, ?)`).bind(
    "1",
    "Alice",
  ),
  env.DB.prepare(`INSERT INTO users (id, name) VALUES (?, ?)`).bind("2", "Bob"),
  env.DB.prepare(`UPDATE users SET active = 1 WHERE id = ?`).bind("1"),
]);
```

### Connection Pooling

D1 automatically manages connections—no manual pooling needed. However, be
mindful of concurrent query limits on Worker Free plan.

---

## DNS & CDN

### DNS Configuration

#### Nameserver Setup

1. **Update domain registrar** with Cloudflare nameservers:
   ```
   NS1: ns1.cloudflare.com
   NS2: ns2.cloudflare.com
   ```

2. **Create DNS records** in Cloudflare dashboard:
   ```
   Type: A      Name: @        Value: 192.0.2.1      Proxied (Orange)
   Type: CNAME  Name: www     Value: example.com    Proxied (Orange)
   Type: MX     Name: @        Value: mail.example.com Priority: 10
   Type: TXT    Name: @        Value: "v=spf1..."    Not proxied (Gray)
   ```

#### Proxy vs Gray Cloud

**Orange Cloud (Proxied):**

- Traffic routed through Cloudflare
- Performance optimization enabled
- DDoS protection active
- Caching available
- Best for: Web traffic

**Gray Cloud (DNS Only):**

- DNS resolution only
- Direct connection to origin
- Best for: Mail servers, non-web services

### Caching Strategies

#### Default Caching Behavior

Cloudflare respects origin HTTP headers:

**Cloudflare WILL cache when:**

- `Cache-Control: public, max-age=3600`
- `Expires: <future-date>`
- Static file types (.css, .js, .jpg, .png, .gif, .woff)

**Cloudflare WILL NOT cache when:**

- `Cache-Control: private, no-store, no-cache`
- `Set-Cookie` header present
- Request method is POST, PUT, DELETE

#### Cache Rules (Best Practice)

Replace legacy Page Rules with modern Cache Rules:

**Example 1: Cache images indefinitely**

```
Rule: Path matches `/images/*`
Action: Cache with TTL 31536000 (1 year)
```

**Example 2: Bypass cache for API endpoints**

```
Rule: Path matches `/api/*`
Action: Bypass Cache
```

**Example 3: Cache dynamic content**

```
Rule: Path matches `/blog/*`
Action: Cache with TTL 3600 (1 hour)
```

#### CDN-Cache-Control Header

Separately control CDN caching from browser caching:

```javascript
// Set both Cache-Control (for browsers) and CDN-Cache-Control (for Cloudflare)
const response = new Response(content, {
  headers: {
    "Cache-Control": "public, max-age=3600", // Browser: 1 hour
    "CDN-Cache-Control": "max-age=86400", // Cloudflare: 1 day
  },
});
```

### Tiered Cache

Enable for frequently accessed content:

1. Cloudflare's edge cache (first hit)
2. Cloudflare's regional cache (subsequent hits from nearby regions)
3. Origin (cache miss)

**Result:** Reduced origin load, faster delivery

### Page Rules (Legacy, use Cache Rules instead)

```
Priority 1: https://example.com/static/* → Cache Level: Cache Everything
Priority 2: https://example.com/api/*   → Cache Level: Bypass
Priority 3: https://example.com         → Security Level: High
```

### Cache Purging

```bash
# Purge all cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# Purge specific URLs
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://example.com/index.html"]}'

# Purge by cache tags
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"tags":["products", "blog"]}'
```

### Cache Metrics

Monitor cache performance:

```
Cache Hit Ratio = Cached Requests / Total Requests
Target: >80% for optimal performance

Access /analytics to view:
- Cache Hit Rate
- Bandwidth saved
- Request distribution
- Top cached files
```

---

## Security & DDoS Protection

### WAF (Web Application Firewall)

#### Deployment Approach

**Recommended: Gradual Rollout**

1. **Week 1-2: Logging Phase**
   ```
   Managed Rules: Action = Log only
   Monitor traffic for false positives
   ```

2. **Week 3-4: Monitoring Phase**
   ```
   Review logged events
   Create exceptions for legitimate API calls
   Fine-tune detection rules
   ```

3. **Week 5+: Enforcement Phase**
   ```
   Managed Rules: Action = Block or Challenge
   Continue monitoring
   Update rules as needed
   ```

#### OWASP Managed Ruleset

Enable pre-configured protection for common vulnerabilities:

- SQL Injection
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Local File Inclusion (LFI)
- Remote Code Execution (RCE)

```
WAF Overview
├── Managed Rules (OWASP, Cloudflare)
├── Custom Rules (Expression-based)
├── Rate Limiting
└── Bot Management
```

#### Custom WAF Rules

```
Rule 1: Block requests with "union select" in query string
Expression: raw_http_request_uri contains "union%20select"
Action: Block

Rule 2: Rate limit login attempts
Expression: cf.threat_score > 50
Action: Challenge

Rule 3: Allow internal IPs
Expression: ip.src in {10.0.0.0/8 172.16.0.0/12 192.168.0.0/16}
Action: Allow
```

#### WAF Rule Best Practices

1. **Fix vulnerabilities at source:**
   - WAF is first-line defense, not replacement for secure coding
   - Address security issues in application code

2. **Monitor before blocking:**
   - Always start with "Log" action
   - Analyze 1-2 weeks of traffic
   - Create exceptions for legitimate patterns

3. **Regular updates:**
   - Managed rules receive frequent updates
   - Review and adjust custom rules monthly
   - Test in staging environment first

### DDoS Protection

#### Automatic Protection (Always Enabled)

Cloudflare automatically detects and mitigates DDoS attacks:

- **Layer 7 (Application):** HTTP floods, slow attacks
- **Layer 4 (Transport):** SYN floods, UDP floods
- **Layer 3 (Network):** IP-based attacks

Sensitivity Levels:

- **High:** Aggressive blocking (recommended for most sites)
- **Medium:** Balanced detection
- **Low:** Permissive (only for specialized cases)

#### DDoS Override Rules

Create custom DDoS rules for specific traffic patterns:

```
Rule: Block traffic from suspicious ASNs
Expression: cf.asnum == 13335  // Example ASN
Action: Block with challenge

Rule: Rate limit by country
Expression: cf.country == "XX"  // Suspicious country
Action: Challenge

Rule: Allow legitimate bot traffic
Expression: cf.bot_managed.verified_bot == true
Action: Allow
```

#### Multi-Layer Protection Strategy

```
Layer 3 (Network):  Magic Transit - DDoS mitigation at network edge
Layer 4 (Transport): Spectrum - DDoS protection for non-HTTP protocols
Layer 7 (Application): WAF + DDoS Rules - Application-level protection
```

### Access Policies

#### Origin Server Protection

Only allow traffic from Cloudflare IPs:

**Nginx configuration:**

```nginx
# Allow only Cloudflare IPs
# See: https://www.cloudflare.com/ips/

geo $cf_ip {
  default 0;
  103.21.244.0/22 1;
  103.22.200.0/22 1;
  103.31.4.0/22 1;
  # ... (add all Cloudflare IP ranges)
}

server {
  if ($cf_ip = 0) {
    return 403;
  }
  # ... rest of config
}
```

**UFW (Ubuntu Firewall):**

```bash
# Allow only from Cloudflare ranges
ufw allow from 103.21.244.0/22 to any port 443
ufw allow from 103.22.200.0/22 to any port 443
# ... (add all ranges)

ufw enable
```

#### Bot Management

Detect and manage bot traffic:

**Configuration:**

```
Bot Fight Mode: Enabled
├── Definitely Automated: Block
├── Likely Automated: Managed Challenge
├── Verified Bots: Allow
└── Super Bot Fight Mode (paid): Advanced scoring
```

**Custom Rules:**

```
# Challenge suspected bots with higher score
Expression: cf.bot_management.score < 50
Action: Challenge

# Allow Google crawlers
Expression: cf.verified_bot_category == "Search Engine Crawler"
Action: Allow
```

#### Rate Limiting

```
Rule: Limit login attempts
Expression: http.request.uri.path == "/login"
Rate Limit: 5 requests per minute per IP
Action: Block for 10 minutes
```

### Security Headers

Set security headers at origin or Cloudflare:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## Next.js Integration

### Deployment Options

#### Option 1: @opennextjs/cloudflare (Recommended for 2025)

Runs Next.js with Node.js runtime on Cloudflare Workers.

**Setup:**

```bash
# Create new Next.js project on Cloudflare
npm create cloudflare@latest -- my-next-app \
  --framework=next \
  --platform=workers

# Or add to existing project
npm install @opennextjs/cloudflare
npx opennextjs-cloudflare
```

**Configuration (wrangler.toml):**

```toml
name = "my-nextjs-app"
type = "javascript"
main = ".wrangler/generated/server.mjs"
compatibility_date = "2024-09-23"

[env.production]
route = "example.com/*"
zone_id = "your_zone_id"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "my-bucket"

[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "database_id"

[[kv_namespaces]]
binding = "KV"
id = "namespace_id"

[durable_objects]
bindings = [
  { name = "COUNTER", class_name = "Counter", script_name = "counter-worker" },
]
```

**Compatibility Requirements:**

- nodejs_compat compatibility flag enabled
- Compatibility date: 2024-09-23 or later

**R2 Incremental Cache:**

```javascript
// next.config.js
import { r2IncrementalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default {
  experimental: {
    incrementalCacheHandlerPath: r2IncrementalCache({
      binding: "IMAGES",
    }),
  },
};
```

#### Option 2: @cloudflare/next-on-pages

Runs Next.js with Edge runtime on Cloudflare Pages.

**Setup:**

```bash
npm install @cloudflare/next-on-pages
npm run pages:build
npm run pages:dev
```

**Limitations:**

- Edge runtime only (subset of Node.js APIs)
- Less flexibility than full Node.js runtime
- Better for lightweight, edge-optimized apps

### Using Cloudflare Services with Next.js

#### R2 File Upload

```typescript
// app/api/upload/route.ts
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });

  const buffer = await file.arrayBuffer();
  const key = `uploads/${Date.now()}-${file.name}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: "my-bucket",
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
    }),
  );

  return Response.json({ url: `https://cdn.example.com/${key}` });
}
```

#### D1 Database Integration

```typescript
// app/api/users/route.ts
export async function GET(request: Request) {
  const users = await (request as any).env.DB.prepare(
    "SELECT id, name, email FROM users WHERE active = 1",
  ).all();

  return Response.json(users);
}

export async function POST(request: Request) {
  const { name, email } = await request.json();

  const result = await (request as any).env.DB.prepare(
    "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
  ).bind(crypto.randomUUID(), name, email).run();

  return Response.json({ success: true, id: result.meta.last_row_id });
}
```

#### Workers KV for Sessions

```typescript
// lib/session.ts
export async function getSession(sessionId: string, env: any) {
  const session = await env.KV.get(`session:${sessionId}`, "json");
  return session;
}

export async function setSession(sessionId: string, data: any, env: any) {
  await env.KV.put(`session:${sessionId}`, JSON.stringify(data), {
    expirationTtl: 86400, // 24 hours
  });
}
```

#### Proxy with Workers

```typescript
// proxy.ts
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // Add custom headers
  const response = NextResponse.next();
  response.headers.set("X-Custom-Header", "value");

  // Rate limiting
  const ip = request.ip || "unknown";
  const rateKey = `rate:${ip}`;
  // Check against KV (requires custom implementation)

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### Build & Deployment

**Build:**

```bash
npm run build
# Generates .wrangler/generated/ artifacts
```

**Deploy:**

```bash
# Deploy to Cloudflare Workers
npm run deploy
# or
wrangler deploy

# Monitor deployment
wrangler deployments list
```

**Environment Variables:**

```bash
# .env.local
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
DATABASE_URL=cloudflare-d1
```

---

## Pricing Comparison

### Object Storage

| Service           | Storage    | Egress   | Requests         | Best For                              |
| ----------------- | ---------- | -------- | ---------------- | ------------------------------------- |
| **Cloudflare R2** | $0.015/GB  | **FREE** | $0.36/M reads    | Content delivery, high-retrieval apps |
| **AWS S3**        | $0.023/GB  | $0.09/GB | $0.0007/1K reads | Feature-rich, high control            |
| **Backblaze B2**  | $0.006/GB  | $0.01/GB | $0.06/10K reads  | Cost-optimized backups                |
| **Wasabi**        | $0.0117/GB | **FREE** | $0.50/M reads    | Enterprise backups                    |

### Compute & Database

| Service                | Cost Model               | Ideal For          | Cold Start |
| ---------------------- | ------------------------ | ------------------ | ---------- |
| **Cloudflare Workers** | $5/month + usage         | Edge computing     | Instant    |
| **Durable Objects**    | Usage-based              | Stateful workloads | Instant    |
| **D1 Database**        | Included in Workers plan | Serverless apps    | N/A        |
| **AWS Lambda**         | Usage-based              | Flexible computing | 100-500ms  |
| **AWS RDS**            | Provisioned instances    | Traditional apps   | N/A        |

### CDN & DNS

| Service                   | Cost       | Feature Highlights                     |
| ------------------------- | ---------- | -------------------------------------- |
| **Cloudflare Free**       | $0/month   | 3 Page Rules, DDoS protection          |
| **Cloudflare Pro**        | $20/month  | 25 Page Rules, advanced analytics      |
| **Cloudflare Business**   | $200/month | Unlimited rules, WAF, priority support |
| **Cloudflare Enterprise** | Custom     | Everything + dedicated support         |

---

## Implementation Checklist

### Phase 1: Foundation (Week 1-2)

- [ ] Set up Cloudflare account
- [ ] Configure domain nameservers
- [ ] Enable SSL/TLS encryption
- [ ] Set up DNS records (A, CNAME, MX)
- [ ] Configure basic caching rules
- [ ] Enable DDoS protection (auto on)

### Phase 2: Security (Week 3-4)

- [ ] Set up WAF with Managed Rules (Log mode)
- [ ] Configure firewall rules
- [ ] Enable bot detection
- [ ] Set security headers
- [ ] Configure rate limiting
- [ ] Monitor for false positives (2 weeks)

### Phase 3: Object Storage (Week 5-6)

- [ ] Create R2 bucket
- [ ] Generate R2 API credentials
- [ ] Test S3-compatible API access
- [ ] Integrate R2 with Next.js app
- [ ] Set up CDN caching for R2 content
- [ ] Test file upload/download flow

### Phase 4: Workers & Edge (Week 7-8)

- [ ] Deploy Next.js to Cloudflare Workers
- [ ] Test API endpoints
- [ ] Configure Workers KV for sessions
- [ ] Test edge function performance
- [ ] Monitor logs and metrics

### Phase 5: Database (Week 9-10)

- [ ] Create D1 database
- [ ] Design schema (per-user or per-tenant)
- [ ] Create migrations
- [ ] Test query performance
- [ ] Enable read replicas
- [ ] Set up Time Travel backups

### Phase 6: Monitoring (Week 11+)

- [ ] Set up analytics dashboard
- [ ] Configure alerts for anomalies
- [ ] Monitor cache hit ratio (target: >80%)
- [ ] Review WAF logs weekly
- [ ] Track performance metrics
- [ ] Monthly security audits

### Performance Targets

- [ ] Cache Hit Ratio: >80%
- [ ] Time to First Byte (TTFB): <100ms
- [ ] First Contentful Paint (FCP): <1.5s
- [ ] Zero customer-facing downtime
- [ ] WAF false positive rate: <2%
- [ ] Error rate: <0.1%

---

## Resources & Documentation

### Official Cloudflare Documentation

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare Cache/CDN Docs](https://developers.cloudflare.com/cache/)
- [Cloudflare WAF Docs](https://developers.cloudflare.com/waf/)
- [Cloudflare DDoS Protection](https://developers.cloudflare.com/ddos-protection/)

### Next.js Integration

- [Next.js on Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [OpenNext Cloudflare Adapter](https://opennext.js.org/cloudflare)
- [@opennextjs/cloudflare NPM Package](https://www.npmjs.com/package/@opennextjs/cloudflare)

### Related Guides in This Project

- [Cloudflare DNS Setup](../archive/CLOUDFLARE_DNS_SETUP.md)
- [Vercel Domain Setup](../archive/VERCEL_DOMAIN_SETUP.md)

---

## Frequently Asked Questions

### Q: Should I use R2 or AWS S3?

**Use R2 if:**

- Your application has significant egress (data downloads)
- You want predictable costs
- You need CDN integration
- You're using Cloudflare Workers

**Use AWS S3 if:**

- You need extensive ACL/versioning features
- You require KMS encryption
- You're heavily invested in AWS ecosystem
- You need specific region placement

### Q: What's the difference between Workers KV and Durable Objects?

| Aspect          | KV                    | Durable Objects           |
| --------------- | --------------------- | ------------------------- |
| **Consistency** | Eventually consistent | Strongly consistent       |
| **Latency**     | 10-100ms              | <1ms                      |
| **Write Rate**  | 1/sec per key         | Unlimited (single object) |
| **Use Case**    | Cache, sessions       | Real-time collab, state   |
| **Cost**        | Low                   | Higher (usage-based)      |

### Q: Can I use D1 for high-traffic production apps?

D1 works well for most production apps, but:

- **Write-heavy workloads:** Consider Hyperdrive to your existing Postgres
- **Multi-region writes:** Design with per-region databases
- **Global coordination:** Use Durable Objects as write coordinator
- **Scaling reads:** Enable read replicas

### Q: How do I migrate from AWS to Cloudflare?

1. **R2:** Use Super Slurper for gradual S3 migration
2. **Lambda → Workers:** Rewrite functions for edge runtime
3. **RDS → D1:** Export schema, import to D1, test queries
4. **CloudFront → Cloudflare CDN:** Update DNS, test caching

### Q: What's the performance impact of edge computing?

**Benefits:**

- TTFB reduced by 50-80% (requests served from ~200 data centers)
- Reduced origin load
- Better latency for geographic diversity

**Trade-offs:**

- Limited to Cloudflare's supported languages/APIs
- Cold start eliminated but warm-up still needed
- Debugging more complex (distributed execution)

---

**Document Version:** 1.0 **Last Updated:** December 2024 **Maintained By:**
Development Team
