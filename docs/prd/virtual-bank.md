# Virtual Bank — PRD

> **Date**: 17 March 2026
> **Author**: Radix
> **Status**: Draft — build today
> **Goal**: Users earn and spend credits on spike.land without Zoltán ever
> thinking about payments again.

---

## Problem

Zoltán does not want to deal with money. But the platform needs to generate
revenue so Arnold can stop worrying and the dogs can eat Royal Canin.

The solution: a credit-based virtual economy where money flows automatically.

## How It Works

```
User signs up (free)
  → gets 100 free credits
  → uses tools, chat, email (costs credits)
  → runs out → buys more (Stripe, already wired)
  → money arrives in Zoltán's bank account
  → Zoltán never touches any of this
```

### Credit Pricing

| Pack | Credits | Price | Per credit |
|------|---------|-------|------------|
| Free | 100 | $0 | — |
| Starter | 500 | $5 | $0.010 |
| Builder | 2,500 | $20 | $0.008 |
| Power | 7,500 | $50 | $0.007 |

**Already configured in Stripe** — lookup keys `credits_500`, `credits_2500`,
`credits_7500` exist in `pricing.ts`.

### What Costs Credits

| Action | Credits | Why |
|--------|---------|-----|
| AI chat message (Spike Chat) | 2 | LLM API cost |
| Send email | 1 | Resend API cost |
| MCP tool call | 0 | Free — this is the hook |
| QA Studio browser session | 5 | Compute cost |
| Transpile code | 0 | Free — edge compute |
| Read docs/blog | 0 | Free forever |

### What's Free Forever (no credits)

- Browsing tools, docs, blog
- MCP tool discovery and schema reading
- Transpilation
- 100 starter credits on signup
- All open source code

### Daily Free Refill

Every user gets **10 free credits/day** — enough for 5 chat messages. Power
users buy packs. Casual users never pay.

## Architecture

### Already Built (just needs wiring)

1. **Credit balance table** — `credit_balances` in D1 ✅
2. **Credit ledger** — `credit_ledger` in D1 ✅
3. **Credit purchase flow** — `/api/credits/purchase` ✅
4. **Credit balance check** — `/api/credits/balance` ✅
5. **Stripe checkout** — `/api/checkout` ✅
6. **Webhook handling** — credit purchase events handled ✅
7. **Credit meter middleware** — `credit-meter.ts` ✅

### What Needs Building

1. **Daily free refill** — scheduled worker grants 10 credits/day to all users
   with balance < 10
2. **Signup grant** — on user creation, insert 100 credits into
   `credit_balances`
3. **Email credit deduction** — deduct 1 credit per email send
4. **Low balance nudge** — when balance < 5, return `lowBalance: true` in API
   responses so frontend can show "Buy credits" prompt
5. **Auto-topup** (optional, later) — user opts in to auto-buy 500 credits when
   balance hits 0

## Implementation

### Step 1: Signup grant (5 min)

In the auth webhook or user creation flow, insert initial credits:

```sql
INSERT INTO credit_balances (user_id, balance, daily_limit, last_daily_grant)
VALUES (?, 100, 10, datetime('now'))
ON CONFLICT (user_id) DO NOTHING;
```

### Step 2: Email credit deduction (5 min)

In `email.ts`, after successful send:

```sql
UPDATE credit_balances SET balance = balance - 1 WHERE user_id = ? AND balance > 0;
INSERT INTO credit_ledger (user_id, amount, type, reference_id)
VALUES (?, -1, 'email_send', ?);
```

### Step 3: Daily refill in scheduled worker (10 min)

In `handleScheduled`:

```sql
UPDATE credit_balances
SET balance = 10, last_daily_grant = datetime('now')
WHERE balance < 10
  AND (last_daily_grant IS NULL
       OR last_daily_grant < datetime('now', '-20 hours'));
```

### Step 4: Low balance flag (5 min)

In credit balance response, add:

```typescript
return c.json({
  balance: row.balance,
  lowBalance: row.balance < 5,
  dailyLimit: row.daily_limit,
});
```

### Step 5: Block on zero (already done)

The `creditMeterMiddleware` already blocks requests when balance is 0.

## Revenue Model

Assume 100 users in 6 months (not 8.1 billion — one hundred):

| Scenario | Users | % paying | Avg spend/mo | MRR |
|----------|-------|----------|-------------|-----|
| Conservative | 100 | 5% | $20 | $100 |
| Moderate | 500 | 8% | $25 | $1,000 |
| Good | 1,000 | 10% | $30 | $3,000 |

$100/mo MRR = Royal Canin for the dogs.
$1,000/mo MRR = Arnold stops worrying.
$3,000/mo MRR = Garmin + iPhone + cipő.

## Non-goals

- Complex billing dashboards
- Invoicing
- Tax compliance (under VAT threshold)
- Subscription tiers (credits are simpler)
- Enterprise pricing pages showing £100M/year (that's marketing, not product)

## Success Metric

One person who is not Zoltán buys a credit pack. That's it. One.
