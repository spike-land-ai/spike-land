# CI/CD Pipeline Best Practices

This comprehensive guide covers industry best practices for designing,
implementing, and maintaining CI/CD pipelines in modern application development.
Based on current 2025 standards and proven methodologies, these practices help
teams achieve reliable, fast, and secure deployments.

## Table of Contents

1. [GitHub Actions Workflow Design](#github-actions-workflow-design)
2. [Build Optimization & Caching](#build-optimization--caching)
3. [Deployment Strategies](#deployment-strategies)
4. [Environment Management](#environment-management)
5. [Rollback Procedures](#rollback-procedures)
6. [Monitoring & Observability](#monitoring--observability)
7. [Security Best Practices](#security-best-practices)
8. [Performance Metrics](#performance-metrics)

---

## GitHub Actions Workflow Design

### Core Principles

GitHub Actions is a powerful CI/CD platform that requires strategic workflow
design to maximize efficiency and reliability.

#### 1. **Workflow Triggering Strategy**

Define specific events that trigger your workflows to optimize CI resource
consumption:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main
      - "feature/**"
    paths:
      - "src/**"
      - "tests/**"
      - ".github/workflows/**"
  pull_request:
    branches:
      - main
  workflow_dispatch:
    inputs:
      environment:
        description: "Environment to deploy to"
        required: true
        default: "staging"
        type: choice
        options:
          - staging
          - production

env:
  NODE_VERSION: "18"
```

**Benefits:**

- Reduces unnecessary workflow runs
- Saves CI minutes and infrastructure costs
- Provides manual override capability via `workflow_dispatch`

#### 2. **Job Dependencies & Parallelization**

Break workflows into separate, parallelizable jobs using the `needs` keyword:

```yaml
jobs:
  tsc:
    name: TypeScript Compilation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Run tsc
        run: yarn tsc

  lint:
    name: Lint Code
    runs-on: ubuntu-latest
    needs: tsc
    steps:
      - uses: actions/checkout@v6
      - name: Run ESLint
        run: yarn lint

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Run Tests
        run: yarn test:run

  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v6
      - name: Build
        run: yarn build

  deploy:
    name: Deploy Application
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Production
        run: echo "Deploying..."
```

**Best Practice:** Use conditional job execution with `if` statements to prevent
unnecessary deployments.

#### 3. **Timeout & Resource Management**

Set appropriate timeouts to prevent resource waste:

```yaml
jobs:
  ci:
    name: CI Pipeline
    runs-on: ubuntu-latest
    timeout-minutes: 30 # Recommended: 15-30 minutes

    steps:
      - name: Build Step
        timeout-minutes: 10
        run: yarn build
```

**Recommendations:**

- Default timeout: 30 minutes (reduces from 6-hour default)
- Job-specific timeouts: 10-15 minutes for most tasks
- Investigate timeouts exceeding 20 minutes

#### 4. **Action Pinning Strategy**

Pin actions to specific commit SHAs instead of branches/tags for security and
stability:

```yaml
# GOOD: Pinned to specific commit
- uses: actions/checkout@a81bbbf8298c0fa03ea29cdc473d45769f953675 # v3.5.2

# ACCEPTABLE: Pinned to release version
- uses: actions/setup-node@v6

# AVOID: Using branches (unstable)
- uses: actions/checkout@main
```

**Security Benefit:** Prevents malicious updates to pinned actions that could
compromise your CI/CD pipeline.

#### 5. **Reusable Workflows**

Create reusable workflows to eliminate duplication and maintain consistency:

```yaml
# .github/workflows/test.yml
name: Tests

on:
  workflow_call:
    inputs:
      coverage-threshold:
        description: "Minimum coverage percentage"
        required: false
        default: "100"
        type: string

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Run Tests
        run: yarn test:coverage
      - name: Verify Coverage
        run: |
          coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$coverage < ${{ inputs.coverage-threshold }}" | bc -l) )); then
            echo "Coverage below threshold: $coverage%"
            exit 1
          fi
```

Call from other workflows:

```yaml
jobs:
  test:
    uses: ./.github/workflows/test.yml
    with:
      coverage-threshold: "100"
```

#### 6. **Permission Management**

Apply principle of least privilege to workflow permissions:

```yaml
permissions:
  contents: read
  pull-requests: write
  packages: write
  deployments: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      deployments: write
      contents: read
```

---

## Build Optimization & Caching

### Dependency Caching Strategy

Caching is the single most effective way to improve CI/CD pipeline performance,
reducing build times by 5-10 minutes on average.

#### 1. **NPM/Yarn Dependencies**

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v6
  with:
    node-version: "18"
    cache: "yarn" # Automatically caches yarn.lock

- name: Install Dependencies
  run: yarn
```

**Performance Impact:**

- Without cache: 2-3 minutes for `yarn`
- With cache (warm): 10-15 seconds

#### 2. **Build Artifact Caching**

Cache compiled outputs to avoid rebuilding unchanged code:

```yaml
- name: Cache Build Output
  uses: actions/cache@v3
  with:
    path: |
      .next/
      dist/
      build/
    key: build-${{ hashFiles('src/**/*', 'package.json') }}
    restore-keys: |
      build-

- name: Build Application
  run: yarn build
```

**Use Cases:**

- Next.js `.next/` builds
- TypeScript compiled output
- Webpack/Vite bundles

#### 3. **Docker Layer Caching**

When building Docker images, leverage layer caching:

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v2

- name: Build Docker Image
  uses: docker/build-push-action@v4
  with:
    context: .
    cache-from: type=gha
    cache-to: type=gha,mode=max
    tags: myregistry/myimage:${{ github.sha }}
```

**Benefits:**

- 5-8X performance improvement for unchanged layers
- Reduced infrastructure costs
- Faster developer feedback loops

#### 4. **Tool-Specific Caching**

Cache language-specific dependency directories:

```yaml
# Python Virtual Environment
- name: Cache Python Dependencies
  uses: actions/cache@v3
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}

# Go Module Cache
- name: Cache Go Modules
  uses: actions/cache@v3
  with:
    path: ~/go/pkg/mod
    key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}

# Ruby Gems
- name: Cache Bundler
  uses: actions/cache@v3
  with:
    path: vendor/bundle
    key: ${{ runner.os }}-gems-${{ hashFiles('**/Gemfile.lock') }}
```

### Cache Purging Strategy

Maintain cache health with regular purging and versioning:

```yaml
# Cache keys should include hash of lock files
cache-key: dependencies-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}

# Clear cache periodically (e.g., weekly)
# Use GitHub UI: Settings → Actions → Caches → Delete stale caches
```

**Best Practices:**

- **Version caches** by including lock file hashes
- **Purge periodically** (weekly/monthly) to prevent bloat
- **Monitor cache size** to avoid exceeding GitHub's 10GB limit per repo
- **Avoid caching dynamic files** (node_modules with binary deps, temporary
  files)

---

## Deployment Strategies

Choose the deployment strategy that matches your risk tolerance, infrastructure,
and application architecture.

### 1. Blue-Green Deployment

Two identical production environments, switching traffic between them.

```yaml
deploy-blue-green:
  runs-on: ubuntu-latest
  environment:
    name: production
  steps:
    - name: Deploy to Green Environment
      run: |
        # Deploy new version to green environment
        kubectl apply -f deployment-green.yaml --context=production

    - name: Run Smoke Tests
      run: |
        # Test green environment thoroughly
        curl -f https://green.example.com/health || exit 1

    - name: Switch Traffic
      if: success()
      run: |
        # Update load balancer to route traffic to green
        kubectl patch service app-lb -p '{"spec":{"selector":{"env":"green"}}}'

        # Blue environment becomes standby for quick rollback

    - name: Rollback on Failure
      if: failure()
      run: |
        # Delete green environment and keep blue running
        kubectl delete -f deployment-green.yaml
```

**Advantages:**

- Zero downtime deployment
- Instant rollback (switch traffic back to blue)
- Full application testing before switching

**Disadvantages:**

- Doubles infrastructure costs
- Requires load balancer/traffic routing layer
- More complex to implement

**Best For:**

- Major releases with significant changes
- Applications where cost isn't a constraint
- Teams wanting maximum safety

### 2. Canary Deployment

Gradually roll out to percentage of users, monitoring for issues.

```yaml
deploy-canary:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to Canary (5% traffic)
      run: |
        kubectl set image deployment/app-canary app=app:${{ github.sha }} \
          --record=true
        kubectl patch service app-lb -p '{"spec":{"trafficPolicy":{"canary":{"weight":5}}}}'

    - name: Monitor Canary Metrics (5 minutes)
      run: |
        #!/bin/bash
        for i in {1..30}; do
          ERROR_RATE=$(curl -s http://prometheus:9090/api/v1/query?query=rate\(http_requests_total\{status=~\"5..\",version=\"canary\"\}\[1m\]\) | jq '.data.result[0].value[1]' 2>/dev/null || echo "0")

          # If error rate > 1%, rollback
          if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
            echo "Canary error rate too high: $ERROR_RATE"
            exit 1
          fi

          echo "Canary metrics healthy (error rate: $ERROR_RATE). Waiting..."
          sleep 10
        done

    - name: Expand to 50% Traffic
      if: success()
      run: |
        kubectl patch service app-lb -p '{"spec":{"trafficPolicy":{"canary":{"weight":50}}}}'
        echo "Expanded to 50% traffic. Monitoring..."

    - name: Monitor 50% Canary (5 minutes)
      if: success()
      run: |
        # Repeat monitoring
        sleep 300

    - name: Full Rollout to 100%
      if: success()
      run: |
        kubectl patch service app-lb -p '{"spec":{"trafficPolicy":{"canary":{"weight":100}}}}'
        echo "Canary deployment successful - 100% traffic"

    - name: Rollback on Failure
      if: failure()
      run: |
        kubectl patch service app-lb -p '{"spec":{"trafficPolicy":{"canary":{"weight":0}}}}'
        kubectl set image deployment/app-canary app=app:previous \
          --record=true
```

**Advantages:**

- Lowest risk deployment strategy
- Real user testing with limited exposure
- Doesn't require doubled infrastructure
- Easy rollback with minimal user impact

**Disadvantages:**

- Requires sophisticated monitoring
- Slower deployment (multiple stages)
- Complex metric correlation for failure detection

**Best For:**

- Production applications with high traffic
- Fast-moving features and frequent releases
- Teams with mature monitoring infrastructure

### 3. Rolling Deployment

Gradually replace old instances with new ones.

```yaml
deploy-rolling:
  runs-on: ubuntu-latest
  environment:
    name: production
  steps:
    - uses: actions/checkout@v6

    - name: Update Deployment Image
      run: |
        kubectl set image deployment/app app=app:${{ github.sha }} \
          --record=true \
          --namespace=production

    - name: Wait for Rollout
      run: |
        kubectl rollout status deployment/app \
          --namespace=production \
          --timeout=10m

    - name: Verify Deployment
      run: |
        # Wait for all replicas to be ready
        kubectl wait --for=condition=ready pod \
          -l app=app \
          --namespace=production \
          --timeout=5m

    - name: Run Smoke Tests
      run: |
        kubectl run smoke-tests \
          --image=myregistry/smoke-tests:latest \
          --namespace=production
```

**Advantages:**

- No additional infrastructure required
- Automatic rollback on failure
- Gradually deploys new version
- Works seamlessly with Kubernetes

**Disadvantages:**

- Multiple versions running simultaneously
- Potential compatibility issues
- Slower deployment than blue-green

**Best For:**

- Microservices architectures
- Kubernetes deployments
- Applications with gradual upgrade requirements

### 4. Feature Flags (Decoupled Release)

Deploy code but keep features inactive until ready.

```yaml
# src/features/checkout.ts
export const isCheckoutV2Enabled = (): boolean => {
  // Check feature flag from configuration service
  return window.__FLAGS?.checkoutV2 ?? false;
};

// src/pages/checkout.tsx
import { isCheckoutV2Enabled } from '@/features/checkout';

export default function CheckoutPage() {
  if (isCheckoutV2Enabled()) {
    return <CheckoutV2 />;
  }
  return <CheckoutV1 />;
}

// CI/CD: Deploy with feature disabled
deploy-with-flags:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6

    - name: Build with Feature Flags Disabled
      run: |
        echo '{"checkoutV2": false}' > public/flags.json
        yarn build

    - name: Deploy Application
      run: |
        vercel deploy --prod

    - name: Enable Feature Flag Gradually
      run: |
        # Manually enable through flag management UI
        # Or use API to enable for 10% of users
        curl -X PATCH https://flags.example.com/api/flags/checkoutV2 \
          -H "Authorization: Bearer ${{ secrets.FLAG_API_KEY }}" \
          -d '{"percentage": 10}'
```

**Advantages:**

- Fastest deployment (no rollout time)
- Instant rollback (toggle flag off)
- Code and release timing decoupled
- Perfect for A/B testing

**Disadvantages:**

- Requires feature flag infrastructure
- Must maintain both code paths temporarily
- Can create technical debt

**Best For:**

- Fast-paced teams needing rapid iteration
- A/B testing and experimentation
- Large features requiring gradual rollout

---

## Environment Management

### Multi-Environment Architecture

Implement a consistent tier of environments for testing and validation.

#### 1. **Environment Progression**

```
Development → Staging → Production
(Local)      (Pre-prod)  (Live)
```

**Development Environment:**

- Local development machines
- Isolated feature branches
- Fast feedback loops
- Data: Mock/test data

**Staging Environment:**

- Production-like replica
- Full test coverage execution
- Integration with real services
- Data: Sanitized production copy
- Purpose: Final validation before production

**Production Environment:**

- Live user environment
- Blue-green or canary deployment
- Full monitoring and alerting
- Real data and users

#### 2. **Preview Environments**

Automated environments created for each pull request:

```yaml
name: Create Preview Environment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  preview:
    runs-on: ubuntu-latest
    environment:
      name: preview-${{ github.event.pull_request.number }}
      url: https://pr-${{ github.event.pull_request.number }}.preview.example.com

    steps:
      - uses: actions/checkout@v6

      - name: Deploy Preview
        run: |
          vercel deploy \
            --token=${{ secrets.VERCEL_TOKEN }} \
            --scope=${{ secrets.VERCEL_TEAM }}

      - name: Comment PR with Preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Preview deployment created: https://pr-${{ github.event.pull_request.number }}.preview.example.com'
            })

  cleanup:
    runs-on: ubuntu-latest
    if: github.event.action == 'closed'
    steps:
      - name: Delete Preview Environment
        run: |
          vercel remove pr-${{ github.event.pull_request.number }}.preview.example.com \
            --token=${{ secrets.VERCEL_TOKEN }} \
            --yes
```

**Benefits:**

- Reviewers can test features before merge
- Integration testing happens automatically
- Easy tear-down when PR closes
- Reduces back-and-forth between developers

#### 3. **Environment Secrets Management**

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: ${{ matrix.environment }}
      url: https://${{ matrix.domain }}

    strategy:
      matrix:
        include:
          - environment: staging
            domain: staging.example.com
            secrets: STAGING_SECRETS
          - environment: production
            domain: example.com
            secrets: PROD_SECRETS

    steps:
      - name: Deploy to ${{ matrix.environment }}
        env:
          API_KEY: ${{ secrets[matrix.secrets] }}
        run: |
          yarn build
          yarn deploy --environment=${{ matrix.environment }}
```

**Best Practices:**

- Use environment-specific secrets
- Never log secrets (GitHub automatically masks)
- Rotate secrets regularly
- Use separate deployment accounts per environment

---

## Rollback Procedures

### 1. **Automated Rollback Triggers**

Configure automatic rollback based on error metrics:

```yaml
deploy-with-auto-rollback:
  runs-on: ubuntu-latest

  steps:
    - uses: actions/checkout@v6

    - name: Deploy New Version
      id: deploy
      run: |
        DEPLOYMENT_ID=$(kubectl apply -f deployment.yaml -o jsonpath='{.metadata.uid}')
        echo "deployment_id=$DEPLOYMENT_ID" >> $GITHUB_OUTPUT

    - name: Monitor Error Rate
      id: monitor
      run: |
        #!/bin/bash
        BASELINE_ERROR_RATE=$(curl -s "http://prometheus:9090/api/v1/query?query=rate(errors_total[5m])" | jq '.data.result[0].value[1]')

        sleep 60  # Wait for metrics to stabilize

        CURRENT_ERROR_RATE=$(curl -s "http://prometheus:9090/api/v1/query?query=rate(errors_total[5m])" | jq '.data.result[0].value[1]')

        # Rollback if error rate increased by 10%
        if (( $(echo "$CURRENT_ERROR_RATE > $BASELINE_ERROR_RATE * 1.1" | bc -l) )); then
          echo "Error rate spike detected: $BASELINE_ERROR_RATE → $CURRENT_ERROR_RATE"
          exit 1
        fi

    - name: Rollback on Error Rate Spike
      if: failure()
      run: |
        echo "Rolling back to previous version..."
        kubectl rollout undo deployment/app
        kubectl rollout status deployment/app --timeout=5m

    - name: Notify Team
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: "Deployment rollback triggered due to error rate spike"
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 2. **Database Rollback Strategy**

Handle database schema changes safely:

```yaml
deploy-with-safe-db:
  runs-on: ubuntu-latest

  steps:
    - uses: actions/checkout@v6

    # Step 1: Deploy backward-compatible DB changes BEFORE code
    - name: Run Database Migrations (backward compatible)
      run: |
        # Ensure all migrations are forward AND backward compatible
        # e.g., add new columns with defaults, don't remove old columns
        knex migrate:latest --env=production

    # Step 2: Wait for migrations to propagate
    - name: Wait for Schema Replication
      run: sleep 30

    # Step 3: Deploy application code
    - name: Deploy Application Code
      run: |
        vercel deploy --prod

    # Step 4: Rollback procedure (if needed)
    - name: Rollback Code Only
      if: failure()
      run: |
        # Revert to previous code version
        vercel rollback

        # DB schema stays in place (forward/backward compatible)
        # Old code can read new schema without issues
```

**Key Principles:**

- **Database migrations before code changes** (when adding columns)
- **Database changes must be backward compatible** (old code must work with new
  schema)
- **Separate code deployment from DB changes** to enable independent rollbacks
- **Use dual-schema technique** for complex changes

### 3. **Rollback Runbook Documentation**

Maintain clear procedures for manual rollbacks:

````markdown
## Deployment Rollback Runbook

### Quick Rollback (< 3 minutes)

1. **Identify Issue**
   ```bash
   # Check error rate
   curl http://prometheus:9090/api/v1/query?query=rate(errors_total[5m])
   ```
````

2. **Trigger Rollback**
   ```bash
   # For Kubernetes
   kubectl rollout undo deployment/app
   kubectl rollout status deployment/app --timeout=5m

   # For Vercel
   vercel rollback
   ```

3. **Verify Recovery**
   ```bash
   # Check error rate returns to baseline
   curl http://prometheus:9090/api/v1/query?query=rate(errors_total[5m])

   # Run smoke tests
   yarn test:e2e --smoke
   ```

### Post-Incident Steps

1. **Document** what went wrong
2. **Analyze** logs and metrics
3. **Add monitoring** to catch similar issues
4. **Update runbooks** with new learnings

````
---

## Monitoring & Observability

### Three Pillars of Observability

#### 1. **Metrics**

Quantitative measurements tracked over time.

```yaml
# Prometheus metrics example
deploy-and-monitor:
  runs-on: ubuntu-latest

  steps:
    - name: Deploy
      run: |
        kubectl set image deployment/app app=app:${{ github.sha }}
        kubectl rollout status deployment/app

    - name: Capture Baseline Metrics
      run: |
        # Request metrics for comparison
        curl -s "http://prometheus:9090/api/v1/query_range?query=http_requests_total&start=$(date -d '10 minutes ago' +%s)&end=$(date +%s)&step=1m" \
          > baseline-metrics.json

# Key metrics to track:
# - Request rate (requests per second)
# - Latency (p50, p95, p99)
# - Error rate (5xx responses)
# - CPU & Memory usage
# - Database connection pool usage
# - Cache hit ratio
````

#### 2. **Logs**

Structured records of events and operations.

```yaml
deploy-with-logging:
  runs-on: ubuntu-latest

  steps:
    - name: Deploy and Stream Logs
      run: |
        kubectl set image deployment/app app=app:${{ github.sha }}

        # Stream logs for 2 minutes after deployment
        kubectl logs -f deployment/app --all-containers=true --tail=100 --timestamps=true &
        LOG_PID=$!

        sleep 120
        kill $LOG_PID || true

# Log structure for debugging:
# - Timestamp
# - Log level (DEBUG, INFO, WARN, ERROR)
# - Service name
# - Request ID (for tracing)
# - Message
# - Context (user ID, session, etc.)
```

#### 3. **Traces**

End-to-end journey of a request through systems.

```yaml
# Distributed tracing for microservices
deploy-with-tracing:
  runs-on: ubuntu-latest

  steps:
    - name: Deploy with Tracing Headers
      run: |
        # Ensure all services propagate trace headers
        # Format: traceparent: 00-<trace-id>-<span-id>-<trace-flags>

        kubectl set image deployment/app app=app:${{ github.sha }}

        # Verify tracing propagation
        curl -v -H "traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01" \
          https://example.com/api/users/123 2>&1 | grep traceparent
```

### Alert Configuration

```yaml
# Prometheus AlertRules
alert-rules: |
  groups:
    - name: deployment
      rules:
        - alert: HighErrorRate
          expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
          for: 2m
          annotations:
            summary: "High error rate detected"
            description: "Error rate is {{ $value }} errors/sec"

        - alert: HighLatency
          expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
          for: 5m
          annotations:
            summary: "High latency detected"
            description: "p95 latency is {{ $value }}s"

        - alert: DeploymentFailure
          expr: increase(deployment_failures_total[5m]) > 0
          annotations:
            summary: "Deployment failed"
```

### GitHub Actions Integration with Monitoring

```yaml
deploy-with-monitoring:
  runs-on: ubuntu-latest

  steps:
    - uses: actions/checkout@v6

    - name: Deploy Application
      run: yarn deploy:prod

    - name: Wait for Stabilization
      run: sleep 30

    - name: Verify Health Checks
      run: |
        # HTTP health check
        curl -f https://example.com/health || exit 1

        # Database connectivity
        curl -f https://example.com/api/db-health || exit 1

        # Cache connectivity
        curl -f https://example.com/api/cache-health || exit 1

    - name: Fetch Deployment Metrics
      run: |
        # Query metrics from last 5 minutes
        curl -s "http://prometheus:9090/api/v1/query_range?query=rate(errors_total[5m])&start=$(date -d '5 minutes ago' +%s)&end=$(date +%s)&step=1m" \
          -o deployment-metrics.json

    - name: Post Deployment Summary
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          const metrics = JSON.parse(fs.readFileSync('deployment-metrics.json'));

          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: `## Deployment Metrics\n\nError Rate: ${metrics.data.result[0]?.value[1] || 'N/A'}`
          });
```

---

## Security Best Practices

### 1. **Secrets Management**

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production

    steps:
      # GOOD: Use GitHub secrets
      - name: Deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          API_KEY: ${{ secrets.API_KEY }}
        run: |
          # Secrets are automatically masked in logs
          echo "Deploying with API key: $API_KEY" # Shows as ***
          yarn deploy

      # AVOID: Hardcoding secrets
      # - name: Deploy
      #   run: |
      #     export API_KEY="sk-1234567890"  # NEVER DO THIS
```

### 2. **Dependency Pinning**

```yaml
- name: Setup Node
  uses: actions/setup-node@v6 # Pinned to specific version
  with:
    node-version: "18.19.0" # Exact version, not latest

# Check action pinning:
# actions/checkout@a81bbbf8298c0fa03ea29cdc473d45769f953675  # Good
# actions/checkout@v6                                           # Acceptable
# actions/checkout@main                                         # Avoid
```

### 3. **SBOM Generation**

Generate Software Bill of Materials for security scanning:

```yaml
sbom:
  runs-on: ubuntu-latest

  steps:
    - uses: actions/checkout@v6

    - name: Generate SBOM
      uses: anchore/sbom-action@v0
      with:
        path: .
        format: spdx-json
        output-file: sbom.json

    - name: Upload SBOM
      uses: actions/upload-artifact@v3
      with:
        name: sbom
        path: sbom.json
```

---

## Performance Metrics

### Key Metrics to Track

#### 1. **Pipeline Performance**

| Metric            | Target       | Impact                 |
| ----------------- | ------------ | ---------------------- |
| Workflow Run Time | < 30 minutes | Developer productivity |
| Build Time        | < 10 minutes | Feedback loop speed    |
| Test Execution    | < 5 minutes  | Release velocity       |
| Deployment Time   | < 5 minutes  | Incident response      |

#### 2. **Deployment Reliability**

| Metric                       | Target       | Impact            |
| ---------------------------- | ------------ | ----------------- |
| Success Rate                 | > 99%        | System stability  |
| Rollback Duration            | < 3 minutes  | Incident recovery |
| Mean Time to Recovery (MTTR) | < 15 minutes | User impact       |
| Failed Deployment Recovery   | < 1 hour     | Team productivity |

#### 3. **Infrastructure Efficiency**

| Metric                   | Target         | Impact                |
| ------------------------ | -------------- | --------------------- |
| Cache Hit Rate           | > 80%          | CI minutes saved      |
| Parallel Job Utilization | > 70%          | Throughput efficiency |
| Resource Waste           | < 10%          | Cost optimization     |
| Disk Usage               | < 80% of limit | Reliability           |

### Monitoring Dashboard Example

```yaml
# Grafana Dashboard JSON
dashboard:
  title: "CI/CD Pipeline Health"
  panels:
    - title: "Workflow Success Rate"
      query: "sum(rate(workflow_runs_total{status='success'}[1h])) / sum(rate(workflow_runs_total[1h]))"

    - title: "Average Pipeline Duration"
      query: "histogram_quantile(0.5, workflow_run_duration_seconds)"

    - title: "Cache Hit Rate"
      query: "sum(cache_hits) / sum(cache_requests)"

    - title: "Deployment Frequency"
      query: "rate(deployments_total[1d])"

    - title: "Mean Time to Recovery"
      query: "avg(deployment_rollback_duration_seconds)"
```

---

## Implementation Checklist

- [ ] **Workflow Design**
  - [ ] Trigger conditions properly scoped
  - [ ] Jobs parallelized with `needs`
  - [ ] Timeouts configured appropriately
  - [ ] Actions pinned to commit SHAs
  - [ ] Reusable workflows created

- [ ] **Build Optimization**
  - [ ] Dependencies cached (yarn.lock)
  - [ ] Build artifacts cached
  - [ ] Docker layer caching implemented
  - [ ] Cache keys include lock files
  - [ ] Cache purge schedule established

- [ ] **Deployment**
  - [ ] Deployment strategy selected (blue-green/canary/rolling/flags)
  - [ ] Smoke tests configured
  - [ ] Health checks implemented
  - [ ] Rollback procedures documented

- [ ] **Environments**
  - [ ] Dev, staging, prod tiers established
  - [ ] Preview environments automated
  - [ ] Environment secrets managed separately
  - [ ] Database migration strategy defined

- [ ] **Monitoring**
  - [ ] Metrics collection configured
  - [ ] Log aggregation setup
  - [ ] Distributed tracing enabled
  - [ ] Alerts configured for critical metrics
  - [ ] Dashboard created for pipeline health

- [ ] **Security**
  - [ ] Secrets managed through GitHub
  - [ ] Actions pinned to specific versions
  - [ ] SBOM generation enabled
  - [ ] Permissions minimized
  - [ ] Secrets rotation scheduled

---

## References

- [GitHub Actions: Best Practices](https://exercism.org/docs/building/github/gha-best-practices)
- [GitHub Actions Workflow Design Guide](https://www.datree.io/resources/github-actions-best-practices)
- [CI/CD Pipeline Caching Strategies](https://www.atmosly.com/blog/cicd-pipeline-optimization-smart-caching-for-faster-builds)
- [Deployment Strategies Comparison](https://www.harness.io/blog/blue-green-canary-deployment-strategies)
- [Blue-Green vs Canary Deployment](https://circleci.com/blog/canary-vs-blue-green-downtime/)
- [Environment Management Best Practices](https://northflank.com/blog/what-are-dev-qa-preview-test-staging-and-production-environments)
- [Preview Environments Guide](https://shipyard.build/preview-environments/)
- [Deployment Rollback Strategies](https://www.featbit.co/articles2025/modern-deploy-rollback-strategies-2025)
- [GitOps Rollback Automation](https://medium.com/@bavicnative/automating-deployment-rollbacks-with-gitops-3887a81e1b2a)
- [Observability vs Monitoring](https://middleware.io/blog/observability-vs-monitoring/)
- [Monitoring and Observability Differences](https://aws.amazon.com/compare/the-difference-between-monitoring-and-observability/)
