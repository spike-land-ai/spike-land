# Email Outreach Tool — PRD

> **Date**: 17 March 2026
> **Author**: Radix
> **Status**: Draft — build today
> **Scope**: MCP tool that sends emails from spike.land

---

## Problem

Zoltán has 5 personalised cold emails ready for Brighton agencies and no way to
send them. There is zero email infrastructure in the stack.

## Solution

One MCP tool: `send_email`. Backed by Resend (simplest API — one HTTP POST,
free tier = 100 emails/day, no SMTP config needed).

## Why Resend

| Option | Setup time | Free tier | Complexity |
|--------|-----------|-----------|------------|
| Resend | 10 min | 100/day | 1 API call |
| SendGrid | 30 min | 100/day | SDK + verification |
| Mailgun | 30 min | 100/day (sandbox) | DNS + verification |
| SES | 1 hour | 200/day | AWS config + IAM |
| Cloudflare Email | N/A | N/A | Receive only, not send |

Resend wins. One API key, one HTTP POST, done.

## Architecture

```
spike-edge (Cloudflare Worker)
  └── POST /api/email/send (authenticated, rate-limited)
        └── Resend API (api.resend.com/emails)
```

### Sender addresses

- `outreach@spike.land` — for business emails (design partner outreach)
- `noreply@spike.land` — for system emails (magic links, notifications)

Requires: add spike.land domain to Resend (DNS TXT record for verification).

## MCP Tool Schema

```typescript
{
  name: "send_email",
  description: "Send an email from spike.land",
  inputSchema: {
    to: z.string().email(),
    subject: z.string().max(200),
    body: z.string(),       // plain text
    html: z.string().optional(), // optional HTML
    from: z.enum(["outreach@spike.land", "noreply@spike.land"])
      .default("outreach@spike.land"),
    replyTo: z.string().email().optional()
      .default("zoltan@spike.land"),
  }
}
```

## Safety

- **Auth required**: only authenticated users with `admin` role can send
- **Rate limit**: 10 emails/hour per user (Durable Object counter)
- **No BCC/CC**: one recipient at a time, no bulk
- **Audit log**: every send recorded in D1 (`email_sends` table)
- **Reply-to**: always set to a real inbox (zoltan@spike.land)
- **No attachments**: text/HTML only

## Database

```sql
CREATE TABLE IF NOT EXISTS email_sends (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  to_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  resend_id TEXT,
  status TEXT DEFAULT 'sent',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Implementation Steps

1. **Sign up Resend** → get API key (2 min)
2. **Add domain** → spike.land DNS verification (5 min)
3. **Add secret** → `wrangler secret put RESEND_API_KEY` (1 min)
4. **Create route** → `POST /api/email/send` in spike-edge (20 min)
5. **Create MCP tool** → `send_email` wrapping the route (10 min)
6. **Create migration** → `email_sends` table (5 min)
7. **Send the 5 emails** → call the tool (5 min)

Total: ~1 hour from zero to sent.

## Non-goals

- Newsletter/bulk sending
- Email templates system
- Tracking/open rates
- Unsubscribe management
- HTML email builder

These are not needed today. Today we need to send 5 emails.

## Success metric

5 emails delivered to Brighton agency inboxes today.
