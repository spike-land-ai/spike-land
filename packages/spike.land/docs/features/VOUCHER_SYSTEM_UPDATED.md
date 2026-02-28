# Voucher System Documentation

> **Last Updated**: December 2025 **Status**: MVP Release

---

## Table of Contents

1. [Voucher Overview](#voucher-overview)
2. [Available Vouchers](#available-vouchers)
3. [Voucher Types](#voucher-types)
4. [How to Redeem](#how-to-redeem)
5. [API Reference](#api-reference)
6. [Database Schema](#database-schema)
7. [Redemption Rules](#redemption-rules)
8. [Management](#management)

---

## Voucher Overview

**Vouchers** are promotional codes that grant users tokens and other benefits.
They are used to:

- Welcome new users
- Reward beta testers
- Run marketing campaigns
- Provide referral bonuses
- Offer seasonal promotions

### Key Characteristics

- **One-Time Use Per User**: Each user can only redeem a specific voucher once
- **Transferable**: Codes can be shared across users (each user redeems
  separately)
- **No Expiration Required**: Vouchers can be created without expiration
- **Immediate Credit**: Tokens granted instantly upon redemption
- **Audit Trail**: All redemptions tracked for analytics

---

## Available Vouchers

### Launch Campaign Vouchers

Three promotional vouchers are active during MVP launch:

#### 1. LAUNCH100

| Property           | Value             |
| ------------------ | ----------------- |
| **Code**           | `LAUNCH100`       |
| **Tokens Granted** | 100               |
| **Max Uses**       | 1,000             |
| **Current Uses**   | 0                 |
| **Status**         | ACTIVE            |
| **Expiration**     | None (indefinite) |
| **Type**           | FIXED_TOKENS      |

**Use Case**: Main launch promotion for early adopters

**Example**:

- User redeems LAUNCH100
- Receives 100 tokens
- Can enhance 50 images at TIER_2K (5 tokens each)
- Or 10 images at TIER_4K (10 tokens each)

#### 2. WELCOME50

| Property           | Value             |
| ------------------ | ----------------- |
| **Code**           | `WELCOME50`       |
| **Tokens Granted** | 50                |
| **Max Uses**       | Unlimited         |
| **Current Uses**   | 0                 |
| **Status**         | ACTIVE            |
| **Expiration**     | None (indefinite) |
| **Type**           | FIXED_TOKENS      |

**Use Case**: Welcome bonus for all new users

**Example**:

- Offered automatically to new sign-ups
- Can be manually redeemed anytime
- No limit on total redemptions (platform-wide)

#### 3. BETA25

| Property           | Value             |
| ------------------ | ----------------- |
| **Code**           | `BETA25`          |
| **Tokens Granted** | 25                |
| **Max Uses**       | 500               |
| **Current Uses**   | 0                 |
| **Status**         | ACTIVE            |
| **Expiration**     | None (indefinite) |
| **Type**           | FIXED_TOKENS      |

**Use Case**: Beta tester appreciation

**Example**:

- Reserved for active beta program participants
- Recognizes testing contributions
- Limited to 500 users

---

## Voucher Types

### Type 1: FIXED_TOKENS

Grants a fixed number of tokens to the user.

**Properties**:

- Fixed amount: tokens do not vary
- Immediate: credited instantly upon redemption
- Simple: no calculations or conditions

**Examples**:

- LAUNCH100: Always grants 100 tokens
- WELCOME50: Always grants 50 tokens
- BETA25: Always grants 25 tokens

**Usage**:

```typescript
// User redeems code
result = await VoucherManager.redeem("LAUNCH100", userId);
// result.tokensGranted = 100
// result.newBalance = previousBalance + 100
```

### Type 2: PERCENTAGE_BONUS

Adds a percentage bonus to token purchases (future enhancement).

**Properties**:

- Percentage-based: amount depends on purchase
- Applied at checkout: activates during Stripe purchase
- Stackable: can combine with other promotions

**Example**:

- BONUS20: 20% off token purchases
- User purchases 100 tokens (£9.99)
- Receives 120 tokens instead
- Saves 20% on cost

**Status**: Planned for future implementation

### Type 3: SUBSCRIPTION_TRIAL

Provides free subscription trial period (future enhancement).

**Properties**:

- Time-based: trial duration specified
- Upgrade path: converts to paid subscription after trial
- Feature-limited: trial may have feature restrictions

**Example**:

- FREETRIAL30: 30-day free Professional plan trial
- User gets 100 tokens/month for 30 days
- After trial: must subscribe or revert to free tier

**Status**: Planned for future implementation

---

## How to Redeem

### User Flow

**Step 1: Obtain Voucher Code**

- Marketing email with code
- Share from another user
- In-app promotion banner
- Social media promotion

**Step 2: Navigate to Redemption**

- Visit Settings → Tokens
- Or click "Redeem Voucher" button in token balance widget
- Or redeem during token purchase flow

**Step 3: Enter Code**

- Input field accepts uppercase codes
- Codes are case-insensitive (LAUNCH100, launch100, Launch100 all work)
- Optional: space trimming for user convenience

**Step 4: Redeem**

- Click "Redeem" button
- System validates code:
  - Code exists
  - Code is ACTIVE (not INACTIVE, EXPIRED, or DEPLETED)
  - User hasn't already redeemed this code
  - Max uses not reached
- Tokens granted instantly
- Success message displays new balance

**Step 5: Confirmation**

- Toast notification: "Successfully redeemed LAUNCH100! +100 tokens"
- Balance updates in real-time
- Transaction appears in history

### Redemption Process

```
User enters code "LAUNCH100"
        ↓
/api/vouchers/validate (optional check)
        ↓
/api/vouchers/redeem
        ↓
VoucherManager.validate()
  - Check code exists
  - Check user hasn't redeemed
  - Check maxUses not exceeded
  - Check status is ACTIVE
  - Check not expired
        ↓
VoucherManager.redeem()
  - Create VoucherRedemption record
  - Increment voucher.currentUses
  - Update user token balance
  - Create transaction record
        ↓
Return success + new balance
```

---

## API Reference

### Validate Voucher

**Endpoint**: `POST /api/vouchers/validate`

**Authentication**: Optional (checks user eligibility if authenticated)

**Request**:

```http
POST /api/vouchers/validate HTTP/1.1
Content-Type: application/json

{
  "code": "LAUNCH100"
}
```

**Response (Success - 200)**:

```json
{
  "valid": true,
  "voucher": {
    "code": "LAUNCH100",
    "type": "FIXED_TOKENS",
    "value": 100,
    "status": "ACTIVE",
    "maxUses": 1000,
    "currentUses": 247,
    "available": true,
    "expiresAt": null
  }
}
```

**Response (Already Redeemed by User - 400)**:

```json
{
  "valid": false,
  "error": "You have already redeemed this voucher"
}
```

**Error Responses**:

| Status | Error                     | Description                          |
| ------ | ------------------------- | ------------------------------------ |
| 400    | Voucher code is required  | Request missing code field           |
| 400    | Voucher not found         | Code doesn't exist                   |
| 400    | Voucher is inactive       | Status is INACTIVE                   |
| 400    | Voucher is expired        | Status is EXPIRED or expiresAt < now |
| 400    | Voucher is depleted       | currentUses >= maxUses               |
| 400    | You have already redeemed | User already redeemed this code      |
| 500    | Failed to validate        | Database error                       |

### Redeem Voucher

**Endpoint**: `POST /api/vouchers/redeem`

**Authentication**: Required (Bearer token)

**Request**:

```http
POST /api/vouchers/redeem HTTP/1.1
Authorization: Bearer {session_token}
Content-Type: application/json

{
  "code": "LAUNCH100"
}
```

**Response (Success - 200)**:

```json
{
  "success": true,
  "tokensGranted": 100,
  "newBalance": 245
}
```

**Error Responses**:

| Status | Error                       | Description                         |
| ------ | --------------------------- | ----------------------------------- |
| 400    | Voucher code is required    | Request missing code field          |
| 400    | (various validation errors) | See validation endpoint for details |
| 401    | Authentication required     | User not logged in                  |
| 500    | Failed to redeem            | Database transaction error          |

---

## Database Schema

### Voucher Model

```prisma
model Voucher {
  id            String                @id @default(cuid())
  code          String                @unique
  type          VoucherType           @default(FIXED_TOKENS)
  value         Int                   // Token amount or percentage
  maxUses       Int?                  // null = unlimited
  currentUses   Int                   @default(0)
  expiresAt     DateTime?             // null = no expiration
  status        VoucherStatus         @default(ACTIVE)
  metadata      Json?
  createdAt     DateTime              @default(now())
  updatedAt     DateTime              @updatedAt

  redemptions   VoucherRedemption[]

  @@index([code])
  @@index([status, expiresAt])
  @@map("vouchers")
}

enum VoucherType {
  FIXED_TOKENS
  PERCENTAGE_BONUS
  SUBSCRIPTION_TRIAL
}

enum VoucherStatus {
  ACTIVE
  INACTIVE
  EXPIRED
  DEPLETED
}
```

### VoucherRedemption Model

```prisma
model VoucherRedemption {
  id            String   @id @default(cuid())
  voucherId     String
  userId        String
  tokensGranted Int
  redeemedAt    DateTime @default(now())

  voucher       Voucher  @relation(fields: [voucherId], references: [id], onDelete: Cascade)
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([voucherId, userId])
  @@index([userId, redeemedAt])
  @@index([voucherId])
  @@map("voucher_redemptions")
}
```

### User Model Update

```prisma
model User {
  // ... existing fields

  voucherRedemptions VoucherRedemption[]
}
```

---

## Redemption Rules

### Per-User Rules

1. **One Per Code**: User can only redeem each voucher code once
   - LAUNCH100: Can redeem once
   - WELCOME50: Can redeem once
   - LAUNCH100 and WELCOME50: Can redeem both (if eligible)

2. **One-Time Irreversible**: Cannot undo redemption
   - No refunds
   - No re-redemption
   - Permanent token grant

### Platform-Wide Rules

1. **Max Uses Limit**: Enforced at platform level
   - LAUNCH100: Max 1,000 total redemptions
   - Once reached, code becomes DEPLETED status
   - Future users cannot redeem

2. **Status Validation**: Only ACTIVE vouchers can be redeemed
   - ACTIVE: Can redeem
   - INACTIVE: Admin-disabled, cannot redeem
   - EXPIRED: Past expiration date, cannot redeem
   - DEPLETED: Max uses reached, cannot redeem

3. **No Expiration by Default**: Launch vouchers have no expiration
   - Can be redeemed indefinitely
   - Or until max uses reached
   - Admin can set expiration at creation

### Eligibility Checks

```
Is code valid?
├─ Does voucher exist? ✓
├─ Is status ACTIVE? ✓
├─ Is currentUses < maxUses? ✓
├─ Is not expired? ✓
└─ User specific:
   └─ Has user already redeemed? ✗ (must be NO)
```

---

## Management

### Creating a New Voucher

**Admin Interface** (future):

- Dashboard for creating vouchers
- Field validation
- Status management

**Via Code**:

```typescript
import { prisma } from "@/lib/prisma";

const newVoucher = await prisma.voucher.create({
  data: {
    code: "HOLIDAY25",
    type: "FIXED_TOKENS",
    value: 25,
    maxUses: 1000,
    expiresAt: new Date("2025-12-31"),
    status: "ACTIVE",
    metadata: {
      campaign: "holiday-2025",
      target: "new-users",
    },
  },
});

console.log(`Created voucher: ${newVoucher.code}`);
```

### Viewing Voucher Statistics

**CLI Tool**:

```bash
npx tsx prisma/verify-vouchers.ts
```

**Output**:

```
Voucher: LAUNCH100
  Status: ACTIVE
  Type: FIXED_TOKENS
  Value: 100 tokens
  Uses: 247 / 1,000
  Redemption Rate: 24.7%
  Created: 2025-12-01T00:00:00Z
  Expires: Never

Voucher: WELCOME50
  Status: ACTIVE
  Type: FIXED_TOKENS
  Value: 50 tokens
  Uses: 512 / Unlimited
  Redemption Rate: N/A
  Created: 2025-12-01T00:00:00Z
  Expires: Never

Voucher: BETA25
  Status: ACTIVE
  Type: FIXED_TOKENS
  Value: 25 tokens
  Uses: 89 / 500
  Redemption Rate: 17.8%
  Created: 2025-12-01T00:00:00Z
  Expires: Never
```

**Via Code**:

```typescript
import { prisma } from "@/lib/prisma";

const voucher = await prisma.voucher.findUnique({
  where: { code: "LAUNCH100" },
  include: {
    _count: { select: { redemptions: true } },
  },
});

const usagePercent = ((voucher.currentUses / voucher.maxUses) * 100).toFixed(1);

console.log(
  `${voucher.code}: ${voucher.currentUses} / ${voucher.maxUses} uses (${usagePercent}%)`,
);
```

### Deactivating a Voucher

**Reasons to Deactivate**:

- Ended campaign
- High abuse rate
- Reached max uses
- Expired date passed

**Method**:

```typescript
import { prisma } from "@/lib/prisma";

await prisma.voucher.update({
  where: { code: "OLDPROMO" },
  data: {
    status: "INACTIVE",
    // Optionally set expiration
    expiresAt: new Date(),
  },
});
```

### Extending Voucher Limits

```typescript
import { prisma } from "@/lib/prisma";

// Increase max uses
await prisma.voucher.update({
  where: { code: "POPULAR" },
  data: { maxUses: 5000 }, // Was 1000
});

// Extend expiration
await prisma.voucher.update({
  where: { code: "NEWYEAR2026" },
  data: { expiresAt: new Date("2026-01-31") },
});

// Re-activate if temporarily disabled
await prisma.voucher.update({
  where: { code: "RELAUNCH" },
  data: { status: "ACTIVE" },
});
```

---

## Redemption Flow Diagram

```
User redeems voucher code "LAUNCH100"
        ↓
Frontend: /api/vouchers/validate (optional preview)
        ↓ (valid)
Frontend: /api/vouchers/redeem
        ↓
Backend VoucherManager.redeem():
  ├─ Validate code in database
  ├─ Check user eligibility
  ├─ Check platform constraints
  └─ Within transaction:
     ├─ Create VoucherRedemption
     ├─ Increment Voucher.currentUses
     ├─ Update User token balance
     ├─ Create TokenTransaction
     └─ Commit or rollback
        ↓
Response: { tokensGranted: 100, newBalance: 245 }
        ↓
Frontend: Show success toast + update UI
```

---

## Implementation Files

**Database & Models**:

- `prisma/schema.prisma` - Voucher, VoucherRedemption models
- `prisma/seed-vouchers.ts` - Seed script for launch vouchers
- `prisma/verify-vouchers.ts` - Verification utility

**API Routes**:

- `src/app/api/vouchers/validate/route.ts` - Validation endpoint
- `src/app/api/vouchers/redeem/route.ts` - Redemption endpoint

**Business Logic**:

- `src/lib/vouchers/voucher-manager.ts` - Core voucher operations
- `src/lib/vouchers/types.ts` - Type definitions

**Frontend Components**:

- `src/components/vouchers/redemption-form.tsx` - Voucher input form
- `src/components/vouchers/redemption-history.tsx` - User's redemptions
- `src/app/settings/vouchers/page.tsx` - Voucher settings page

---

## Best Practices

### For Administrators

1. **Plan Campaigns**: Define objectives (acquire users, test features)
2. **Set Reasonable Limits**: Consider platform capacity and budget
3. **Monitor Usage**: Check statistics regularly
4. **Announce Properly**: Email, social media, in-app notifications
5. **Deactivate When Done**: Prevent confusion from old codes

### For Developers

1. **Always Validate**: Check both endpoint and server-side
2. **Transaction Safety**: Use database transactions for redemption
3. **Error Messages**: Provide clear feedback for each failure case
4. **Audit Logging**: Log all redemption attempts
5. **Performance**: Index code lookup for fast validation

### For Marketing

1. **Use Unique Codes**: Each campaign gets distinct code
2. **Track Performance**: Monitor redemption rates
3. **Stack Benefits**: Combine with other promotions carefully
4. **Timing**: Announce before availability to build anticipation
5. **Communication**: Clearly state code value and limitations

---

## Analytics & Reporting

### Key Metrics

| Metric          | Calculation                         | Insight                |
| --------------- | ----------------------------------- | ---------------------- |
| Redemption Rate | currentUses / maxUses               | Campaign reach         |
| Conversion Rate | (redeemed users / sent codes)       | Campaign effectiveness |
| Average Value   | sum(tokensGranted) / redeemed count | User lifetime impact   |
| Peak Redemption | max daily redemptions               | User engagement        |

### Sample Report

```
Campaign: LAUNCH100
Period: 2025-12-01 to 2025-12-07
Redemptions: 247 / 1000 (24.7%)
Total Tokens Distributed: 24,700
Average Per User: 100
Most Redeemed Day: 2025-12-02 (89 users)
Top User Retention: 65% returned for second use
```

---
