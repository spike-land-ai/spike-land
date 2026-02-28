# Spike Land Documentation

Welcome to the Spike Land documentation. This is the central index for all
platform documentation.

**Website**: [spike.land](https://spike.land)

---

## Quick Navigation

### For Users

| I want to...              | Document                                                                   |
| ------------------------- | -------------------------------------------------------------------------- |
| Understand the platform   | [features/FEATURES.md](./features/FEATURES.md)                             |
| Learn about subscriptions | [features/SUBSCRIPTION_TIERS.md](./features/SUBSCRIPTION_TIERS.md)         |
| Get credits               | [architecture/TOKEN_SYSTEM.md](./architecture/TOKEN_SYSTEM.md)             |
| Use voucher codes         | [features/VOUCHER_SYSTEM_UPDATED.md](./features/VOUCHER_SYSTEM_UPDATED.md) |
| Read the user guide       | [features/USER_GUIDE.md](./features/USER_GUIDE.md)                         |

### For Developers

| I want to...           | Document                                                             |
| ---------------------- | -------------------------------------------------------------------- |
| Integrate with the API | [architecture/API_REFERENCE.md](./architecture/API_REFERENCE.md)     |
| View API changelog     | [API_CHANGELOG.md](./API_CHANGELOG.md)                               |
| Set up the database    | [architecture/DATABASE_SETUP.md](./architecture/DATABASE_SETUP.md)   |
| Quick start database   | [guides/DATABASE_QUICK_START.md](./guides/DATABASE_QUICK_START.md)   |
| Understand the schema  | [architecture/DATABASE_SCHEMA.md](./architecture/DATABASE_SCHEMA.md) |
| Track database usage   | [DATABASE_USAGE_TRACKING.md](./DATABASE_USAGE_TRACKING.md)           |
| Perform migrations     | [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)                           |
| Understand testing     | [guides/TESTING_STRATEGY.md](./guides/TESTING_STRATEGY.md)           |
| Run E2E tests          | [E2E_TEST_IMPLEMENTATION.md](./E2E_TEST_IMPLEMENTATION.md)           |
| Automate E2E setup     | [guides/AUTOMATED_SETUP.md](./guides/AUTOMATED_SETUP.md)             |
| Manage dependencies    | [guides/DEPENDENCY_MANAGEMENT.md](./guides/DEPENDENCY_MANAGEMENT.md) |
| Use spike-cli          | `npx @spike-land-ai/spike-cli` (external package)                    |

### For Project Setup

| I want to...                  | Document                                                               |
| ----------------------------- | ---------------------------------------------------------------------- |
| Set up development            | [../README.md](../README.md)                                           |
| Configure secrets/env vars    | [guides/SECRETS_SETUP.md](./guides/SECRETS_SETUP.md)                   |
| Rotate credentials            | [guides/CREDENTIAL_ROTATION.md](./guides/CREDENTIAL_ROTATION.md)       |
| Understand CI/CD              | [../README.md](../README.md#cicd-pipeline)                             |
| Debug CI/CD failures          | [guides/CI_CD_DEBUGGING.md](./guides/CI_CD_DEBUGGING.md)               |
| Set up Vercel                 | [guides/VERCEL_ANALYTICS_SETUP.md](./guides/VERCEL_ANALYTICS_SETUP.md) |
| Understand business structure | [business/BUSINESS_STRUCTURE.md](./business/BUSINESS_STRUCTURE.md)     |
| Review CEO decisions          | [CEO_DECISIONS.md](./CEO_DECISIONS.md)                                 |

---

## Documentation Structure

```
docs/
├── README.md                         # This index file
├── ROADMAP.md                        # Future development plans
├── TECH_DEBT.md                      # Tech debt tracking
├── architecture/                     # System architecture docs
│   ├── API_REFERENCE.md              # Complete API documentation
│   ├── DATABASE_SCHEMA.md            # Database models & relations
│   ├── DATABASE_SETUP.md             # Database installation guide
│   ├── MY_APPS_ARCHITECTURE.md       # My-Apps feature architecture
│   ├── TOKEN_SYSTEM.md               # Platform credit system
│   ├── JSON_SCHEMAS.md               # JSON schema definitions
│   └── DEPENDENCY_RESOLUTIONS.md     # Dependency resolution notes
├── features/                         # Feature documentation
│   ├── FEATURES.md                   # Platform features & roadmap
│   ├── SUBSCRIPTION_TIERS.md         # Subscription tier details
│   ├── VOUCHER_SYSTEM_UPDATED.md     # Voucher codes and redemption
│   └── USER_GUIDE.md                 # End-user platform guide
├── guides/                           # How-to guides
│   ├── SECRETS_SETUP.md              # Secrets & environment variables
│   ├── CREDENTIAL_ROTATION.md        # Credential rotation procedures
│   ├── DATABASE_QUICK_START.md       # Quick database setup
│   ├── DATABASE_MIGRATION_ROLLBACK.md # Migration rollback procedures
│   ├── TESTING_STRATEGY.md           # Comprehensive testing guide
│   ├── AUTOMATED_SETUP.md            # E2E authentication bypass setup
│   ├── DEPENDENCY_MANAGEMENT.md      # Dependency management guide
│   ├── CI_CD_DEBUGGING.md            # CI/CD troubleshooting guide
│   ├── VERCEL_ANALYTICS_SETUP.md     # Vercel analytics configuration
│   └── ...                           # Additional guides
├── integrations/                     # Third-party integrations
│   └── CAMPAIGN_TRACKING_INTEGRATION.md # Campaign analytics
├── business/                         # Business documentation
│   ├── BUSINESS_STRUCTURE.md         # Company information
│   ├── LAUNCH_CHECKLIST.md           # Pre-launch checklist
│   ├── LAUNCH_PLAN.md                # Launch strategy
│   └── ...                           # Additional business docs
├── security/                         # Security documentation
│   ├── SECURITY_AUDIT_REPORT.md      # Security audit
│   └── SECURITY_HARDENING.md         # Security hardening (CSP)
├── sprints/                          # Sprint documentation (active sprints)
├── api/                              # OpenAPI specs & examples
├── best-practices/                   # Development best practices
├── database/                         # Database-specific docs
├── migrations/                       # API migration guides
├── testing/                          # Testing documentation
└── archive/                          # Historical documentation
```

---

## Core Documentation

### Platform

| Document                                                           | Description                                       |
| ------------------------------------------------------------------ | ------------------------------------------------- |
| [features/FEATURES.md](./features/FEATURES.md)                     | Platform vision, MCP-first strategy, feature list |
| [business/ZOLTAN_ERDOS.md](./business/ZOLTAN_ERDOS.md)             | Founder profile, background, and vision           |
| [business/BUSINESS_STRUCTURE.md](./business/BUSINESS_STRUCTURE.md) | Company information and legal structure           |
| [CEO_DECISIONS.md](./CEO_DECISIONS.md)                             | Strategic decisions and technology choices        |
| [ROADMAP.md](./ROADMAP.md)                                         | Future development plans                          |

### API & Integration

| Document                                                         | Description                                   |
| ---------------------------------------------------------------- | --------------------------------------------- |
| [architecture/API_REFERENCE.md](./architecture/API_REFERENCE.md) | Complete API documentation with examples      |
| [API_CHANGELOG.md](./API_CHANGELOG.md)                           | API version history and breaking changes      |
| [API_VERSIONING.md](./API_VERSIONING.md)                         | Versioning strategy and deprecation policies  |
| [api/](./api/)                                                   | OpenAPI specifications and integration guides |
| [api/00_START_HERE.md](./api/00_START_HERE.md)                   | API getting started guide                     |

### Platform Credits

| Document                                                                   | Description                                |
| -------------------------------------------------------------------------- | ------------------------------------------ |
| [architecture/TOKEN_SYSTEM.md](./architecture/TOKEN_SYSTEM.md)             | Credit acquisition, pricing, subscriptions |
| [features/VOUCHER_SYSTEM_UPDATED.md](./features/VOUCHER_SYSTEM_UPDATED.md) | Voucher codes and redemption               |

### Database

| Document                                                                         | Description                             |
| -------------------------------------------------------------------------------- | --------------------------------------- |
| [architecture/DATABASE_SCHEMA.md](./architecture/DATABASE_SCHEMA.md)             | Models, relationships, design decisions |
| [architecture/DATABASE_SETUP.md](./architecture/DATABASE_SETUP.md)               | Installation, migrations, backup        |
| [guides/DATABASE_QUICK_START.md](./guides/DATABASE_QUICK_START.md)               | Quick setup guide                       |
| [DATABASE_USAGE_TRACKING.md](./DATABASE_USAGE_TRACKING.md)                       | Table usage tracking across codebase    |
| [guides/DATABASE_MIGRATION_ROLLBACK.md](./guides/DATABASE_MIGRATION_ROLLBACK.md) | Migration rollback procedures           |
| [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)                                       | Database migration best practices       |

### Payments

| Document                                                                   | Description                               |
| -------------------------------------------------------------------------- | ----------------------------------------- |
| [archive/STRIPE_INTEGRATION_PLAN.md](./archive/STRIPE_INTEGRATION_PLAN.md) | Stripe setup and configuration (archived) |
| [archive/STRIPE_PAYMENT_FLOW.md](./archive/STRIPE_PAYMENT_FLOW.md)         | Payment flow documentation (archived)     |
| [archive/STRIPE_TESTING_GUIDE.md](./archive/STRIPE_TESTING_GUIDE.md)       | Testing payments (archived)               |

### Testing & CI/CD

| Document                                                           | Description                          |
| ------------------------------------------------------------------ | ------------------------------------ |
| [guides/TESTING_STRATEGY.md](./guides/TESTING_STRATEGY.md)         | Comprehensive testing infrastructure |
| [E2E_TEST_IMPLEMENTATION.md](./E2E_TEST_IMPLEMENTATION.md)         | E2E testing setup                    |
| [guides/AUTOMATED_SETUP.md](./guides/AUTOMATED_SETUP.md)           | E2E authentication bypass setup      |
| [guides/MANUAL_TESTING_GUIDE.md](./guides/MANUAL_TESTING_GUIDE.md) | Manual testing procedures            |
| [guides/CI_CD_DEBUGGING.md](./guides/CI_CD_DEBUGGING.md)           | CI/CD troubleshooting guide          |
| [testing/](./testing/)                                             | Testing documentation                |

### Security & Operations

| Document                                                                   | Description                            |
| -------------------------------------------------------------------------- | -------------------------------------- |
| [guides/SECRETS_SETUP.md](./guides/SECRETS_SETUP.md)                       | Secrets & environment variables (SSOT) |
| [guides/CREDENTIAL_ROTATION.md](./guides/CREDENTIAL_ROTATION.md)           | Credential rotation procedures         |
| [security/SECURITY_AUDIT_REPORT.md](./security/SECURITY_AUDIT_REPORT.md)   | Security practices and audit           |
| [security/SECURITY_HARDENING.md](./security/SECURITY_HARDENING.md)         | Security hardening measures (CSP)      |
| [guides/ERROR_LOG_AUDIT_GUIDE.md](./guides/ERROR_LOG_AUDIT_GUIDE.md)       | Error log auditing procedures          |
| [business/LAUNCH_CHECKLIST.md](./business/LAUNCH_CHECKLIST.md)             | Pre-launch checklist                   |
| [business/LAUNCH_PLAN.md](./business/LAUNCH_PLAN.md)                       | Launch strategy and rollout plan       |
| [archive/PRODUCTION_FIXES_NEEDED.md](./archive/PRODUCTION_FIXES_NEEDED.md) | Known issues (archived - all resolved) |

### Development Tools & Utilities

| Document                                                               | Description                         |
| ---------------------------------------------------------------------- | ----------------------------------- |
| [guides/DEPENDENCY_MANAGEMENT.md](./guides/DEPENDENCY_MANAGEMENT.md)   | Adding, removing, auditing packages |
| [guides/VERCEL_ANALYTICS_SETUP.md](./guides/VERCEL_ANALYTICS_SETUP.md) | Vercel analytics configuration      |
| [features/USER_GUIDE.md](./features/USER_GUIDE.md)                     | End-user platform guide             |

---

## Best Practices

See [best-practices/](./best-practices/) for development guidelines and quick
reference guides.

### Core Development

| Document                                                        | Description                         |
| --------------------------------------------------------------- | ----------------------------------- |
| [nextjs-15.md](./best-practices/nextjs-15.md)                   | Next.js patterns and best practices |
| [typescript.md](./best-practices/typescript.md)                 | TypeScript guidelines               |
| [react-patterns.md](./best-practices/react-patterns.md)         | React best practices                |
| [prisma-orm.md](./best-practices/prisma-orm.md)                 | Prisma ORM database patterns        |
| [testing-strategies.md](./best-practices/testing-strategies.md) | Testing approaches                  |

### MCP Development

| Document                                                                | Description                  |
| ----------------------------------------------------------------------- | ---------------------------- |
| [mcp-server-development.md](./best-practices/mcp-server-development.md) | MCP server development guide |
| [MCP_DEVELOPMENT_INDEX.md](./best-practices/MCP_DEVELOPMENT_INDEX.md)   | MCP development index        |
| [MCP_QUICK_REFERENCE.md](./best-practices/MCP_QUICK_REFERENCE.md)       | MCP quick reference guide    |

---

## API Migration Guides

See [migrations/](./migrations/) for API version migration guides.

---

## Archive

Historical documentation is stored in [archive/](./archive/):

| Category                  | Contents                                                    |
| ------------------------- | ----------------------------------------------------------- |
| Implementation summaries  | Completed feature implementation documentation              |
| Previous design decisions | Historical architectural decisions                          |
| Orbit & Pixel docs        | Archived social media and image enhancement docs            |
| Completed features        | Archived feature documentation                              |
| Historical deployment     | Past deployment and migration notes                         |
| Old plans                 | [archive/plans/](./archive/plans/) - Historical issue plans |

See [archive/README.md](./archive/README.md) for detailed archive index.

---

## Contributing to Documentation

1. **Single source of truth**: Don't duplicate content across files
2. **Link, don't copy**: Reference other docs instead of copying
3. **Keep files focused**: One topic per document
4. **Update the index**: Add new docs to this README
5. **Archive old docs**: Move outdated content to `archive/`
6. **Follow structure**: Place docs in appropriate subdirectories

---

**Last Updated**: 2026-02-26
