# Web Application Security Best Practices

A comprehensive guide to securing web applications, covering the OWASP Top 10,
authentication security, input validation, security headers, secrets management,
and dependency security.

---

## Table of Contents

1. [OWASP Top 10](#owasp-top-10)
2. [Authentication Security](#authentication-security)
3. [Input Validation](#input-validation)
4. [Security Headers](#security-headers)
5. [Secrets Management](#secrets-management)
6. [Dependency Security](#dependency-security)
7. [Session Management](#session-management)
8. [Implementation Checklist](#implementation-checklist)

---

## OWASP Top 10

The OWASP Top 10 represents the most critical web application security risks.
The current standard is OWASP Top 10 2021 (until 2025 update).

### A01:2021 - Broken Access Control

**Description**: Users can access data or perform actions they shouldn't. This
includes URL manipulation, lack of validation in API endpoints, and improper
role-based permissions.

**Prevention Strategies**:

- Implement proper authentication and authorization checks on every endpoint
- Validate user permissions before granting access to resources
- Use role-based access control (RBAC) consistently
- Implement principle of least privilege - users get minimum required
  permissions
- Validate request parameters and reject unauthorized access attempts
- Use secure session management with proper session IDs

**Example (Express.js)**:

```javascript
// Middleware to check authorization
async function authorizeResource(req, res, next) {
  const resourceId = req.params.id;
  const userId = req.user.id;

  // Verify the user owns this resource
  const resource = await Resource.findOne({
    _id: resourceId,
    ownerId: userId,
  });

  if (!resource) {
    return res.status(403).json({ error: "Forbidden" });
  }

  req.resource = resource;
  next();
}

// Use middleware on protected routes
app.get("/api/resources/:id", authenticate, authorizeResource, getResource);
```

### A02:2021 - Cryptographic Failures

**Description**: Sensitive data (passwords, financial records, credit cards,
health data) is exposed due to poor encryption or no encryption at all.

**Prevention Strategies**:

- Encrypt sensitive data at rest using strong encryption algorithms (AES-256)
- Use HTTPS/TLS for all data in transit (enforce with HSTS headers)
- Never transmit unencrypted sensitive data over the network
- Use secure hash functions for passwords (never reversible encryption)
- Implement proper key management and rotation
- Avoid storing sensitive data unnecessarily
- Disable caching of sensitive responses

**Example (Encrypting Sensitive Data)**:

```javascript
import crypto from "crypto";

// Encrypt sensitive data at rest
function encryptData(plaintext, encryptionKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(encryptionKey),
    iv,
  );

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Store IV with encrypted data
  return iv.toString("hex") + ":" + encrypted;
}

// Decrypt sensitive data
function decryptData(encryptedData, encryptionKey) {
  const [iv, encrypted] = encryptedData.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(encryptionKey),
    Buffer.from(iv, "hex"),
  );

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

**HTTP Headers for Transport Security**:

```javascript
// Express.js example
app.use((req, res, next) => {
  // Force HTTPS
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );

  // Prevent caching of sensitive responses
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  next();
});
```

### A03:2021 - Injection

**Description**: Unauthorized user input is sent to an interpreter as part of a
command or query, allowing execution of malicious commands or unauthorized data
access.

**Common Types**:

- SQL Injection
- Command Injection
- LDAP Injection
- XML Injection

**Prevention Strategies** (see [Input Validation](#input-validation) section
below for detailed prevention methods)

### A04:2021 - Insecure Design

**Description**: Design flaws and architectural weaknesses that enable attacks.
This includes missing threat modeling, insecure architecture patterns, and
insufficient security controls.

**Prevention Strategies**:

- Conduct threat modeling early in design phase
- Use secure architectural patterns (defense in depth)
- Implement security controls at multiple layers
- Follow secure SDLC practices
- Include security requirements in specifications
- Document security assumptions and controls
- Regular security architecture reviews

### A05:2021 - Security Misconfiguration

**Description**: Default configurations, verbose error messages, and improper
settings expose sensitive information. This is the most common vulnerability
category.

**Prevention Strategies**:

- Remove default credentials and accounts
- Disable unnecessary services and features
- Use secure default configurations
- Implement proper error handling without sensitive details
- Use security configuration management tools
- Remove unnecessary headers that expose server information
- Keep frameworks and dependencies updated

**Example (Removing Information Disclosure)**:

```javascript
// Middleware to remove sensitive headers
app.use((req, res, next) => {
  // Don't expose server information
  res.removeHeader("X-Powered-By");
  res.removeHeader("Server");

  next();
});

// Proper error handling
app.use((err, req, res, next) => {
  // Don't expose stack traces in production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : "Internal Server Error",
    ...(isDevelopment && { stack: err.stack }),
  });
});
```

### A06:2021 - Vulnerable and Outdated Components

**Description**: Third-party libraries and dependencies contain known
vulnerabilities that attackers can exploit.

**Prevention Strategies** (see [Dependency Security](#dependency-security)
section below)

### A07:2021 - Identification and Authentication Failures

**Description**: Issues with login mechanisms allow brute-force attacks,
credential stuffing, and weak password handling.

**Prevention Strategies** (see
[Authentication Security](#authentication-security) section below)

### A08:2021 - Software and Data Integrity Failures

**Description**: Lack of integrity in code and infrastructure due to using
untrusted sources, no integrity checks, or insecure updates.

**Prevention Strategies**:

- Only use legitimate, verified sources for libraries and packages
- Verify signatures and checksums of dependencies
- Implement proper code review processes
- Use secure CI/CD pipelines with integrity checks
- Implement signing for updates and artifacts
- Use version pinning for critical dependencies
- Regularly audit supply chain security

### A09:2021 - Security Logging and Monitoring Failures

**Description**: Without proper logging and alerting, breaches can go undetected
for months.

**Prevention Strategies**:

- Log all authentication attempts (successes and failures)
- Log access to sensitive data
- Track administrative actions
- Implement centralized logging
- Set up alerts for suspicious activity
- Retain logs for appropriate time periods
- Ensure logs are protected from tampering
- Monitor for unusual patterns and anomalies
- Include timestamps and user identifiers in logs

**Example (Security Logging)**:

```javascript
// Security event logging
function logSecurityEvent(eventType, userId, details, severity = "info") {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    userId,
    details,
    severity,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get("user-agent"),
  };

  // Store in secure logging system
  securityLogger.log(logEntry);

  // Alert on critical events
  if (severity === "critical") {
    alertSecurityTeam(logEntry);
  }
}

// Usage examples
logSecurityEvent("FAILED_LOGIN", userId, { attempts: 3 }, "warning");
logSecurityEvent(
  "UNAUTHORIZED_ACCESS",
  userId,
  { resource: "admin" },
  "critical",
);
logSecurityEvent("API_KEY_CREATED", userId, { keyId: newKey.id }, "info");
```

### A10:2021 - Server-Side Request Forgery (SSRF)

**Description**: Web application accepts user-controlled input and uses it to
make requests without validation, allowing attackers to make requests to
internal or external resources.

**Prevention Strategies**:

- Validate and sanitize all user inputs used in requests
- Implement URL validation and parsing
- Use allowlists for permitted domains/IPs
- Disable access to internal IP ranges (10.0.0.0/8, 172.16.0.0/12,
  192.168.0.0/16, 127.0.0.0/8)
- Implement network segmentation
- Use DNS rebinding protections
- Disable redirects or validate redirect targets

**Example (SSRF Prevention)**:

```javascript
import url from "url";

function isAllowedUrl(targetUrl, allowedDomains) {
  try {
    const parsed = url.parse(targetUrl);

    // Check against blocked IP ranges
    const blockedRanges = [
      /^127\./, // localhost
      /^10\./, // private class A
      /^172\.(1[6-9]|2\d|3[01])\./, // private class B
      /^192\.168\./, // private class C
      /^169\.254\./, // link-local
      /^fc[0-9a-f]{2}:/, // IPv6 private
      /^fe80:/, // IPv6 link-local
    ];

    if (blockedRanges.some((range) => range.test(parsed.hostname))) {
      return false;
    }

    // Check against allowlist
    return allowedDomains.includes(parsed.hostname);
  } catch (e) {
    return false;
  }
}

// Usage
app.post("/api/fetch-url", authenticate, async (req, res) => {
  const targetUrl = req.body.url;
  const allowedDomains = ["example.com", "api.example.com"];

  if (!isAllowedUrl(targetUrl, allowedDomains)) {
    return res.status(400).json({ error: "URL not allowed" });
  }

  // Safe to fetch from targetUrl
  const response = await fetch(targetUrl);
  res.json(await response.json());
});
```

---

## Authentication Security

Proper authentication is the foundation of application security.

### Password Hashing Best Practices

**Never store plain-text passwords.** Use modern password hashing algorithms
with proper configurations.

#### Argon2 (Recommended)

**Why Argon2?**

- Won the Password Hashing Competition in 2015
- Best protection against side-channel and GPU-based attacks
- Actively maintained and recommended by security experts
- Use Argon2id variant specifically

**Recommended Parameters**:

- Memory: 64 MB or higher (47,104 KiB minimum per OWASP)
- Iterations (time cost): 3 or more
- Parallelism: 1-4 threads
- Salt: 16 bytes minimum (automatically handled by libraries)

**Example (Node.js with argon2)**:

```javascript
import argon2 from "argon2";

// Hash password on registration
async function hashPassword(plainPassword) {
  try {
    const hash = await argon2.hash(plainPassword, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
    return hash;
  } catch (err) {
    throw new Error("Password hashing failed");
  }
}

// Verify password on login
async function verifyPassword(plainPassword, hash) {
  try {
    return await argon2.verify(hash, plainPassword);
  } catch (err) {
    return false;
  }
}

// Usage
app.post("/register", async (req, res) => {
  const { password } = req.body;
  const hashedPassword = await hashPassword(password);
  // Store hashedPassword in database
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  const passwordValid = await verifyPassword(password, user.password);
  if (!passwordValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Create session/token
});
```

#### bcrypt (Still Secure Alternative)

**When to Use**: Legacy systems, proven track record, wide library support.

**Important Limitation**: Truncates passwords longer than 72 bytes.

**Recommended Settings**:

- Work factor (cost): 12 minimum (takes ~250ms on modern hardware)

**Example (Node.js with bcrypt)**:

```javascript
import bcrypt from "bcrypt";

async function hashPassword(plainPassword) {
  const saltRounds = 12; // Cost factor
  return await bcrypt.hash(plainPassword, saltRounds);
}

async function verifyPassword(plainPassword, hash) {
  return await bcrypt.compare(plainPassword, hash);
}
```

### Multi-Factor Authentication (MFA)

**Why MFA Matters**: Using MFA makes accounts 99% less likely to be compromised.

#### Strong MFA Types (in order of strength)

1. **FIDO/WebAuthn** (Phishing-Resistant)
   - Biometrics (fingerprint, face recognition)
   - Hardware security keys
   - Platform authenticators (Windows Hello, Touch ID)
   - Only widely available phishing-resistant option

2. **TOTP (Time-based One-Time Password)**
   - Authenticator apps (Google Authenticator, Authy, Microsoft Authenticator)
   - Time-synchronized, device-based
   - Not phishing-resistant but strong

3. **Push Notifications** (with number matching)
   - App-based push notifications
   - User must confirm number shown on screen and app
   - Blocks mobile push bombardment attacks

4. **SMS/Phone Calls** (Weakest)
   - Vulnerable to SIM swapping
   - Subject to interception
   - Avoid if possible
   - US government discontinued SMS for federal systems in 2016

#### MFA Implementation Strategy

**Phase 1: Enable MFA for Admins**

- Mandate for all administrative accounts first
- These are primary targets for attackers

**Phase 2: Enforce for Critical Operations**

- Additional MFA for sensitive operations (money transfer, data export)
- Risk-based authentication: require MFA based on context

**Phase 3: Roll Out Comprehensively**

- Enable for all users with phased deployment
- Provide backup methods for user account recovery

**Example (TOTP MFA Setup)**:

```javascript
import QRCode from "qrcode";
import speakeasy from "speakeasy";

// Generate MFA secret during setup
async function setupMFA(user) {
  const secret = speakeasy.generateSecret({
    name: `YourApp (${user.email})`,
    issuer: "YourApp",
    length: 32,
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode,
    backupCodes: generateBackupCodes(), // Generate recovery codes
  };
}

// Verify MFA token
function verifyMFAToken(userSecret, token) {
  return speakeasy.totp.verify({
    secret: userSecret,
    encoding: "base32",
    token: token,
    window: 2, // Allow 2 time windows (30 seconds each) for clock drift
  });
}

// Generate backup codes
function generateBackupCodes(count = 10) {
  return Array.from(
    { length: count },
    () => Math.random().toString(36).substring(2, 10).toUpperCase(),
  );
}

// Verify MFA before login
app.post("/login-mfa", authenticate, (req, res) => {
  const { mfaToken } = req.body;
  const user = req.user;

  if (!verifyMFAToken(user.mfaSecret, mfaToken)) {
    return res.status(401).json({ error: "Invalid MFA token" });
  }

  // Create authenticated session
  createSession(res, user);
});
```

### Session Management Best Practices

- Use cryptographically secure session IDs (at least 128 bits of entropy)
- Set appropriate session timeouts (30 minutes to 2 hours for sensitive
  operations)
- Implement absolute session timeouts (max session duration regardless of
  activity)
- Regenerate session IDs after successful authentication
- Clear sessions on logout
- Implement concurrent session limits if appropriate
- Store session data securely on server-side, not in cookies

---

## Input Validation

All user input is untrusted. Validate and sanitize everything.

### Cross-Site Scripting (XSS) Prevention

XSS occurs when malicious scripts are injected into web pages viewed by other
users.

#### Types of XSS

1. **Stored XSS**: Malicious input is stored in database and executed for all
   users
2. **Reflected XSS**: Malicious input in request is immediately reflected in
   response
3. **DOM-based XSS**: Vulnerability in client-side JavaScript code

#### Prevention Strategy: Multi-Layered Defense

**Layer 1: Output Encoding**

- Encode all untrusted data before displaying
- Context matters: HTML encoding vs. JavaScript encoding vs. URL encoding

**Layer 2: Input Validation**

- Validate format and allowlist safe patterns
- Never rely on validation alone

**Layer 3: Content Security Policy (CSP)**

- Browser-enforced protection against injection
- Use strict CSP with nonces

**Layer 4: Modern Frameworks**

- Use frameworks with auto-escaping (React, Vue, Angular)
- Templates automatically escape by default

#### Examples

**Output Encoding (HTML Context)**:

```javascript
// HTML encode user input
function htmlEncode(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Display user-provided content safely
app.get("/profile/:username", (req, res) => {
  const user = getUserByUsername(req.params.username);
  const safeUsername = htmlEncode(user.name);
  res.send(`<h1>Welcome, ${safeUsername}</h1>`);
});

// React (auto-escapes by default)
function UserProfile({ user }) {
  return <h1>Welcome, {user.name}</h1>; // Safe - React escapes automatically
}
```

**Input Validation (Allowlisting)**:

```javascript
// Allowlist approach - only accept known safe patterns
function validateUsername(username) {
  // Only allow alphanumeric, underscore, hyphen (3-20 chars)
  const pattern = /^[a-zA-Z0-9_-]{3,20}$/;
  return pattern.test(username);
}

function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

// Reject invalid input
app.post("/register", (req, res) => {
  const { username, email } = req.body;

  if (!validateUsername(username)) {
    return res.status(400).json({ error: "Invalid username format" });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Process registration
});
```

**Content Security Policy (CSP)**:

```javascript
// Strict CSP - only allows scripts with matching nonce
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("hex");
  res.locals.nonce = nonce;

  res.setHeader(
    "Content-Security-Policy",
    [
      `default-src 'self'`,
      `script-src 'nonce-${nonce}'`,
      `style-src 'nonce-${nonce}' 'self'`,
      `img-src 'self' data: https:`,
      `font-src 'self'`,
      `connect-src 'self'`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
    ].join("; "),
  );

  next();
});

// In HTML template, include nonce in script tags
// <script nonce="<%= nonce %>">...inline script...</script>
```

### SQL Injection Prevention

SQL injection occurs when user input is concatenated into SQL queries.

#### Solution: Parameterized Queries (Prepared Statements)

**How It Works**:

1. SQL statement structure is sent to database separately
2. User-supplied values are sent as parameters
3. Database treats parameters as data, never executable code
4. SQL injection becomes impossible

**Example (Node.js with MySQL2)**:

```javascript
// VULNERABLE - DO NOT USE
app.get("/user/:id", (req, res) => {
  const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
  // Attacker could use: /user/1 OR 1=1
  // This would return all users
});

// SAFE - Use parameterized queries
app.get("/user/:id", async (req, res) => {
  const connection = await mysql.createConnection(config);

  // Use ? as placeholder
  const [rows] = await connection.execute(
    "SELECT * FROM users WHERE id = ?",
    [req.params.id],
  );

  res.json(rows);
});
```

**Example (Node.js with Prisma ORM)**:

```javascript
// Prisma automatically uses parameterized queries
app.get("/user/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(req.params.id) },
  });

  res.json(user);
});
```

**Example (Node.js with Sequelize ORM)**:

```javascript
// Sequelize automatically parameterizes
app.get("/user/:id", async (req, res) => {
  const user = await User.findByPk(req.params.id);
  res.json(user);
});

// Or use explicit parameterization
app.get("/search", async (req, res) => {
  const users = await User.findAll({
    where: {
      email: req.query.email, // Automatically parameterized
    },
  });
  res.json(users);
});
```

### CSRF (Cross-Site Request Forgery) Prevention

CSRF tricks authenticated users into making unintended requests.

#### Prevention: CSRF Tokens

The application generates a unique, unpredictable token that must be included in
state-changing requests.

**Synchronizer Token Pattern (for forms)**:

```javascript
// Generate token
app.get("/form", (req, res) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");
  req.session.csrfToken = csrfToken;

  res.send(`
    <form method="POST" action="/submit">
      <input type="hidden" name="csrfToken" value="${csrfToken}">
      <input type="text" name="data">
      <button>Submit</button>
    </form>
  `);
});

// Verify token
app.post("/submit", (req, res) => {
  const { csrfToken, data } = req.body;

  if (csrfToken !== req.session.csrfToken) {
    return res.status(403).json({ error: "CSRF token invalid" });
  }

  // Process request
  res.json({ success: true });
});
```

**Double Submit Cookie (for APIs)**:

```javascript
// Send token in both cookie and request body
const csrfToken = crypto.randomBytes(32).toString("hex");

// Set as secure cookie
res.cookie("csrfToken", csrfToken, {
  httpOnly: false, // Allow JavaScript to read
  secure: true,
  sameSite: "Strict",
});

// Client must send same token in body or header
app.post("/api/action", (req, res) => {
  const cookieToken = req.cookies.csrfToken;
  const bodyToken = req.body.csrfToken || req.headers["x-csrf-token"];

  if (!cookieToken || cookieToken !== bodyToken) {
    return res.status(403).json({ error: "CSRF validation failed" });
  }

  // Process request
});
```

**SameSite Cookie Attribute** (modern defense):

```javascript
// Set SameSite=Strict on session cookies
res.cookie("sessionId", sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: "Strict", // Cookie not sent in cross-site requests
});

// SameSite values:
// - Strict: Most protective, breaks some functionality
// - Lax: Good balance (default in modern browsers)
// - None: Cross-site (only with Secure=true)
```

---

## Security Headers

HTTP security headers tell browsers how to handle your content and protect
against common attacks.

### Essential Security Headers

#### 1. Strict-Transport-Security (HSTS)

Forces HTTPS connections and prevents downgrade attacks.

```javascript
// Express.js middleware
app.use((req, res, next) => {
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  next();
});
```

**Parameters**:

- `max-age=31536000`: Cache for 1 year
- `includeSubDomains`: Apply to subdomains
- `preload`: Include in HSTS preload list (https://hstspreload.org/)

#### 2. Content-Security-Policy (CSP)

Controls which resources can be loaded and executed.

```javascript
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("hex");
  res.locals.nonce = nonce;

  res.setHeader(
    "Content-Security-Policy",
    [
      `default-src 'self'`, // Only allow same-origin by default
      `script-src 'nonce-${nonce}'`, // Scripts must have matching nonce
      `style-src 'nonce-${nonce}'`, // Styles must have matching nonce
      `img-src 'self' data: https:`, // Images from self, data URIs, HTTPS
      `font-src 'self'`, // Fonts from same-origin
      `connect-src 'self'`, // AJAX/WebSocket only to same-origin
      `frame-ancestors 'none'`, // Cannot be embedded in iframes
      `base-uri 'self'`, // Only same-origin <base> tags
      `form-action 'self'`, // Forms only to same-origin
      `upgrade-insecure-requests`, // Upgrade HTTP to HTTPS
    ].join("; "),
  );

  next();
});
```

**CSP Levels**:

- **Allowlist CSP**: List allowed sources (older approach)
- **Strict CSP**: Use nonce or hash for inline scripts (recommended)

#### 3. X-Frame-Options

Prevents clickjacking by controlling iframe embedding.

```javascript
app.use((req, res, next) => {
  // Prevent embedding in any iframe
  res.setHeader("X-Frame-Options", "DENY");
  // or 'SAMEORIGIN' to allow same-origin iframes
  next();
});
```

#### 4. X-Content-Type-Options

Prevents MIME type sniffing attacks.

```javascript
app.use((req, res, next) => {
  // Don't sniff - trust the Content-Type header
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});
```

#### 5. Referrer-Policy

Controls how much referrer information is shared.

```javascript
app.use((req, res, next) => {
  // Don't send referrer to less secure connections
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
```

#### 6. Permissions-Policy (formerly Feature-Policy)

Controls which browser features can be used.

```javascript
app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    [
      "geolocation=()", // Disable geolocation
      "microphone=()", // Disable microphone
      "camera=()", // Disable camera
      "payment=()", // Disable Payment Request API
      "usb=()", // Disable USB
      "accelerometer=()", // Disable accelerometer
      "gyroscope=()", // Disable gyroscope
      "magnetometer=()", // Disable magnetometer
    ].join(", "),
  );
  next();
});
```

#### 7. X-XSS-Protection (Legacy)

Legacy header for older browsers (mostly obsolete with CSP).

```javascript
app.use((req, res, next) => {
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});
```

### Complete Security Headers Middleware

```javascript
// security-headers.js
export function setSecurityHeaders(req, res, next) {
  const nonce = crypto.randomBytes(16).toString("hex");
  res.locals.nonce = nonce;

  // Prevent information disclosure
  res.removeHeader("X-Powered-By");
  res.removeHeader("Server");

  // Transport security
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    [
      `default-src 'self'`,
      `script-src 'nonce-${nonce}' 'strict-dynamic'`,
      `style-src 'nonce-${nonce}' 'strict-dynamic'`,
      `img-src 'self' data: https:`,
      `font-src 'self'`,
      `connect-src 'self'`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `upgrade-insecure-requests`,
    ].join("; "),
  );

  // Clickjacking protection
  res.setHeader("X-Frame-Options", "DENY");

  // MIME type sniffing protection
  res.setHeader("X-Content-Type-Options", "nosniff");

  // XSS protection (legacy browsers)
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy
  res.setHeader(
    "Permissions-Policy",
    [
      "geolocation=()",
      "microphone=()",
      "camera=()",
      "payment=()",
      "usb=()",
    ].join(", "),
  );

  // Prevent caching of sensitive content
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  next();
}

// Usage in Express
app.use(setSecurityHeaders);
```

---

## Secrets Management

Never hardcode secrets in code or commit them to version control.

### Environment Variables (Basic Approach)

**Advantages**:

- Simple to implement
- Works with most platforms
- Standard across languages

**Limitations**:

- Secrets accessible to all processes on machine
- No audit trail of access
- No ability to rotate without redeployment
- Visible in container environment listings

**.env File Example**:

```bash
# .env (NEVER commit to git!)
DATABASE_URL=postgresql://user:password@localhost:5432/db
API_KEY=abc123def456
JWT_SECRET=your_secret_key_here
STRIPE_KEY=sk_live_xxx
```

**Usage in Code**:

```javascript
// Load environment variables
require("dotenv").config();

const dbUrl = process.env.DATABASE_URL;
const apiKey = process.env.API_KEY;

if (!dbUrl || !apiKey) {
  throw new Error("Missing required environment variables");
}
```

**.gitignore Protection**:

```bash
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
secrets/
```

### HashiCorp Vault (Enterprise Approach)

**Why Vault?**

- Centralized secrets management
- Fine-grained access control
- Audit trail of all access
- Dynamic secret generation and rotation
- Encryption as a service

**Features**:

- **Dynamic Secrets**: Generate temporary credentials (database passwords, AWS
  keys)
- **Secret Rotation**: Automatically rotate secrets without application downtime
- **Audit Logging**: Complete audit trail of secret access
- **Encryption**: Built-in encryption for data at rest and in transit
- **Authentication**: Multiple auth methods (AppRole, Kubernetes, LDAP, etc.)

**Basic Setup Example**:

```bash
# Install Vault
brew install vault

# Start Vault server
vault server -dev

# Initialize and unseal Vault (production requires HSM)
vault operator init
vault operator unseal

# Enable secret engine
vault secrets enable -path=secret kv-v2

# Store a secret
vault kv put secret/myapp/database password="mypassword"

# Retrieve a secret
vault kv get secret/myapp/database
```

**Application Integration with Vault Agent**:

```javascript
// Vault Agent handles authentication and secret injection
// Application reads secrets from environment variables or files

// No need to hardcode Vault client code in most cases
// Vault Agent sidecar manages the complexity

const dbPassword = process.env.DB_PASSWORD; // Injected by Vault Agent
```

**Vault AppRole Authentication (for microservices)**:

```bash
# Create AppRole
vault auth enable approle
vault write auth/approle/role/myapp \
  token_ttl=1h \
  token_max_ttl=4h

# Get Role ID and Secret ID
vault read auth/approle/role/myapp/role-id
vault write -f auth/approle/role/myapp/secret-id
```

### Best Practices for Secrets Management

1. **Principle of Least Privilege**
   - Applications only access secrets they need
   - Rotate secrets regularly
   - Revoke access immediately when employee leaves

2. **Audit Trail**
   - Log all secret access
   - Alert on suspicious access patterns
   - Review logs regularly

3. **Encryption**
   - Secrets encrypted in transit (TLS/SSL)
   - Secrets encrypted at rest in Vault
   - Never store encrypted credentials in code

4. **Separation of Concerns**
   - Separate team manages secrets
   - Developers don't have direct access
   - Use principle of least privilege

5. **Rotation Schedule**
   - Rotate passwords every 90 days minimum
   - Rotate API keys every 6-12 months
   - Rotate encryption keys annually
   - Immediate rotation on suspected compromise

6. **Multi-Environment Secrets**
   - Different secrets for dev, staging, production
   - Production secrets with higher security
   - Never use production secrets in development

---

## Dependency Security

Third-party libraries are attack vectors. Monitor and update them regularly.

### npm audit

Built-in npm security tool for Node.js projects.

```bash
# Run security audit
npm audit

# Audit production dependencies only (ignore devDependencies)
npm audit --production

# Get JSON output
npm audit --json

# Fix vulnerabilities automatically
npm audit fix

# Fix including breaking changes
npm audit fix --force
```

**Output Example**:

```
found 15 vulnerabilities (5 moderate, 10 high) in 12347 packages

┌─────────────┬──────────────────────────────────────────────┐
│ High        │ Prototype Pollution in lodash               │
├─────────────┼──────────────────────────────────────────────┤
│ Package     │ lodash                                       │
│ Patched in  │ >=4.17.21                                   │
│ Dependency  │ lodash                                       │
│ Path        │ lodash                                       │
│ More info   │ https://npmjs.com/advisories/1523           │
└─────────────┴──────────────────────────────────────────────┘
```

### Snyk

Advanced vulnerability scanning with automatic fixes and CI/CD integration.

```bash
# Install Snyk CLI
npm install -g snyk

# Test for vulnerabilities
snyk test

# Test production dependencies only
snyk test --prod

# Monitor for vulnerabilities continuously
snyk monitor

# Fix vulnerabilities with detailed analysis
snyk fix
```

**Advantages over npm audit**:

- Ignores devDependencies by default (safer approach)
- Broader vulnerability database
- Patches often available before npm registry
- Tight GitHub integration for PRs
- Container and infrastructure code scanning

### GitHub Dependabot

Automated dependency updates directly in GitHub.

**Setup in GitHub**:

1. Go to Settings → Code security and analysis
2. Enable "Dependabot alerts"
3. Enable "Dependabot security updates"
4. Create `dependabot.yml` in `.github/` directory

```yaml
# .github/dependabot.yml
version: 2
updates:
  # Monitor npm dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    allow:
      - dependency-type: "production"
    reviewers:
      - "security-team"

  # Monitor GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

**Benefits**:

- Automatic pull requests for security updates
- Automatic merging for minor updates (configurable)
- Security updates prioritized
- Integrates with CI/CD pipeline

### Dependency Security Best Practices

1. **Regular Audits**
   - Run `npm audit` regularly (at minimum weekly)
   - Include in CI/CD pipeline as blocking check
   - Monitor production deployments for security issues

2. **Selective Updates**
   - Update security patches immediately
   - Test minor and major updates before deploying
   - Don't automatically update all dependencies

3. **Lock Files**
   - Commit `package-lock.json` (npm) or `yarn.lock`
   - Ensures reproducible builds
   - Prevents supply chain attacks via dependency confusion

4. **License Compliance**
   - Verify licenses of dependencies
   - Avoid GPL dependencies in proprietary code
   - Use tools like `license-checker`

5. **Size Awareness**
   - Monitor bundle size impact of dependencies
   - Use `npm ls` to see dependency tree
   - Remove unused dependencies

6. **Supply Chain Security**
   - Only use packages from trusted sources
   - Verify package ownership and maintenance
   - Be cautious of recently created packages
   - Enable 2FA for npm account

**Example CI/CD Integration**:

```yaml
# GitHub Actions
name: Security Audit

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --production

      - name: Run Snyk
        run: |
          npm install -g snyk
          snyk test --prod
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

---

## Session Management

Secure session management is critical for authentication security.

### Secure Cookie Configuration

#### HttpOnly Attribute

Prevents JavaScript from accessing the cookie, mitigating XSS attacks.

```javascript
res.cookie("sessionId", sessionId, {
  httpOnly: true, // JavaScript cannot access via document.cookie
});
```

#### Secure Attribute

Only sends cookie over HTTPS, preventing man-in-the-middle attacks.

```javascript
res.cookie("sessionId", sessionId, {
  secure: true, // Only sent over HTTPS
});
```

#### SameSite Attribute

Prevents cross-site request forgery attacks.

```javascript
// Strict: Most secure, only sent to same site
res.cookie("sessionId", sessionId, {
  sameSite: "Strict",
});

// Lax: Good balance, sent on top-level navigation but not subresources
res.cookie("sessionId", sessionId, {
  sameSite: "Lax", // Default in modern browsers
});

// None: Sent in all requests (requires Secure=true)
res.cookie("sessionId", sessionId, {
  sameSite: "None",
  secure: true,
});
```

#### Cookie Prefixes

Reserved prefixes provide additional security guarantees.

```javascript
// __Host- prefix: Most secure
// - Path must be /
// - Cannot specify Domain
// - Prevents overwriting from subdomains
res.cookie("__Host-sessionId", sessionId, {
  path: "/",
  httpOnly: true,
  secure: true,
  sameSite: "Strict",
});

// __Secure- prefix:
// - Must use Secure attribute
// - Can be used across subdomains
res.cookie("__Secure-sessionId", sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: "Strict",
});
```

#### Most Secure Cookie Configuration

```javascript
res.cookie("__Host-sessionId", sessionId, {
  path: "/",
  httpOnly: true, // Prevent XSS access
  secure: true, // HTTPS only
  sameSite: "Strict", // Prevent CSRF
  maxAge: 1800000, // 30 minutes
});
```

### Session Storage

- **Client-side sessions**: Stateless, scalable, but less control
- **Server-side sessions**: Stateful, more secure, centralized control

**Server-Side Session Example (Express + Redis)**:

```javascript
import RedisStore from "connect-redis";
import session from "express-session";
import { createClient } from "redis";

// Create Redis client
const redisClient = createClient();
redisClient.connect();

// Configure session store
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true, // No JavaScript access
    sameSite: "Strict",
    maxAge: 1800000, // 30 minutes
  },
}));
```

### Session Best Practices

1. **Timeout Strategy**
   - Idle timeout: 15-30 minutes
   - Absolute timeout: 4-8 hours maximum
   - Re-authenticate for sensitive operations

2. **Session Fixation Prevention**
   - Regenerate session ID after successful login
   - Invalidate old session

   ```javascript
   app.post("/login", (req, res) => {
     // Verify credentials

     // Regenerate session to prevent fixation
     req.session.regenerate((err) => {
       if (err) return res.status(500).json({ error: "Server error" });

       req.session.userId = user.id;
       res.json({ success: true });
     });
   });
   ```

3. **Concurrent Session Management**
   - Limit sessions per user
   - Revoke all sessions on password change
   - Track session activity for anomalies

4. **Session Invalidation**
   - Clear session on logout
   - Invalidate after password reset
   - Revoke on suspicious activity

---

## Implementation Checklist

Use this checklist when implementing security in your application:

### Authentication

- [ ] Passwords hashed with Argon2 (min 64MB, 3 iterations)
- [ ] Alternative: bcrypt with cost factor 12+
- [ ] MFA enabled for admin accounts
- [ ] MFA offered for all users (at least TOTP)
- [ ] Session IDs generated with 128+ bits of entropy
- [ ] Session ID regenerated after login
- [ ] Sessions cleared on logout
- [ ] Login attempts rate-limited
- [ ] Account lockout after failed attempts

### Input Validation

- [ ] All user input validated on server-side
- [ ] Output encoded based on context (HTML, JavaScript, URL)
- [ ] SQL queries use parameterized statements
- [ ] CSP header implemented with strict-dynamic
- [ ] File uploads validated (type, size, content)
- [ ] NoSQL injection prevention (if using NoSQL)
- [ ] XML injection prevention (if parsing XML)
- [ ] Command injection prevention

### CSRF Protection

- [ ] CSRF tokens on all state-changing forms
- [ ] CSRF tokens validated on server
- [ ] SameSite=Strict on session cookies
- [ ] POST/PUT/DELETE used for state-changing operations
- [ ] No state-changing GET requests

### Headers

- [ ] HSTS header set (min 1 year, with preload)
- [ ] CSP header implemented
- [ ] X-Frame-Options set to DENY or SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Permissions-Policy configured appropriately
- [ ] Server header removed
- [ ] X-Powered-By header removed

### Cookies

- [ ] Session cookies marked HttpOnly
- [ ] Session cookies marked Secure (HTTPS only)
- [ ] Session cookies set SameSite=Strict or Lax
- [ ] Cookie prefixes used (__Host- or __Secure-)
- [ ] Cookie expiration set appropriately
- [ ] Sensitive cookies not storing unnecessary data

### Secrets Management

- [ ] No secrets in source code
- [ ] No secrets committed to git
- [ ] .env files in .gitignore
- [ ] Environment variables used for configuration
- [ ] Database credentials never in logs
- [ ] API keys rotated regularly
- [ ] Vault or similar tool used for secrets (optional)

### Logging & Monitoring

- [ ] Failed login attempts logged
- [ ] Successful logins logged
- [ ] Sensitive operations logged
- [ ] Logs include timestamp and user ID
- [ ] Error messages don't expose sensitive info
- [ ] Logs retained for appropriate period (90+ days)
- [ ] Alerts for suspicious activity
- [ ] Centralized logging system

### Dependencies

- [ ] npm audit runs in CI/CD
- [ ] Snyk integrated (optional but recommended)
- [ ] Dependabot enabled on GitHub
- [ ] All dependencies reviewed and vetted
- [ ] Lock file (package-lock.json) committed
- [ ] Unused dependencies removed
- [ ] Outdated dependencies updated regularly

### Database

- [ ] Database credentials never in code
- [ ] Database connections use parameterized queries
- [ ] Database user has minimal required permissions
- [ ] Database backups encrypted
- [ ] Database access logged and monitored
- [ ] Regular security patches applied
- [ ] SQL injection prevention verified

### HTTPS/TLS

- [ ] HTTPS enforced for all traffic
- [ ] TLS 1.2 minimum (1.3 preferred)
- [ ] Strong cipher suites only
- [ ] HSTS enabled with long duration
- [ ] Certificates automatically renewed
- [ ] Mixed content warnings resolved

### Testing

- [ ] Security-focused unit tests written
- [ ] OWASP Top 10 risks tested
- [ ] XSS prevention tested
- [ ] SQL injection prevention tested
- [ ] CSRF protection tested
- [ ] Authentication/authorization tested
- [ ] Penetration testing completed (recommended)

---

## References & Further Reading

### OWASP Resources

- [OWASP Top 10 Project](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [OWASP ASVS (Application Security Verification Standard)](https://owasp.org/www-project-application-security-verification-standard/)

### Authentication & Cryptography

- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Argon2 Password Hashing](https://argon2-online.com/)
- [OWASP Multifactor Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)

### Web Security

- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Web.dev Security Articles](https://web.dev/secure/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)

### Tools & Services

- [HashiCorp Vault](https://www.vaultproject.io/)
- [Snyk Vulnerability Scanner](https://snyk.io/)
- [GitHub Dependabot](https://dependabot.com/)
- [npm audit](https://docs.npmjs.com/cli/v9/commands/npm-audit)

---

**Document Version**: 1.0 **Last Updated**: December 2024 **Audience**:
Developers, Security Engineers, DevOps **Classification**: Public
