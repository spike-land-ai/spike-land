# GitHub Actions CI/CD Pipeline

This workflow automatically tests, builds, deploys, and validates your Next.js
application with comprehensive quality gates.

## Workflow Steps

1. **Test** - Runs linter and unit tests with 100% coverage requirement
2. **Build** - Builds the Next.js application (only if tests pass)
3. **Deploy** - Deploys to Vercel Preview (only if build succeeds, runs on all
   branches)
4. **E2E** - Runs end-to-end tests against deployed preview (only after
   successful deployment, runs on all branches)

## Required Secrets

For complete secrets documentation including all environment variables, see:
**[docs/guides/SECRETS_SETUP.md](../../docs/guides/SECRETS_SETUP.md)**

### Quick Reference for CI/CD

| Secret                  | Required | Purpose                         |
| ----------------------- | :------: | ------------------------------- |
| DATABASE_URL            |   Yes    | E2E test database connection    |
| AUTH_SECRET             |   Yes    | NextAuth session signing        |
| E2E_BYPASS_SECRET       |   Yes    | E2E test authentication bypass  |
| GH_PAT_TOKEN            |   Yes    | GitHub CLI for Claude workflows |
| CODECOV_TOKEN           |    No    | Coverage reporting              |
| CLAUDE_CODE_OAUTH_TOKEN |    No    | Claude Code GitHub Action auth  |

## How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings**
3. Navigate to **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with its respective name and value

For detailed setup instructions, see
[docs/guides/SECRETS_SETUP.md](../../docs/guides/SECRETS_SETUP.md).

## Local Testing

To test the workflow locally, you can use [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash  # Linux

# Run the workflow
act push
```

## Triggering the Workflow

The workflow automatically runs when:

- You push commits to `main` or `develop` branches
- You create a pull request targeting `main` or `develop`

All jobs run on all branches when:

- Tests pass ✅
- Build succeeds ✅
- Preview deployment succeeds ✅
- E2E tests run against preview deployment ✅

**Note:** Production deployments to Vercel are done manually from the `main`
branch when needed.

## Branch Protection (RECOMMENDED)

### ⚠️ Enforce Quality Standards

To prevent merging broken code to `main`, set up branch protection rules:

1. Go to: **Settings** → **Branches** → **Add branch protection rule**
2. Branch name pattern: `main`
3. Enable these settings:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
     - Required status checks: `Run Tests`, `Build Application`, `E2E Tests`
   - ✅ **Do not allow bypassing the above settings**

**See `BRANCH_PROTECTION_SETUP.md` for detailed setup instructions.**

### Benefits of Branch Protection

With branch protection enabled:

- ❌ **No direct commits to main** - All changes via Pull Requests
- ✅ **100% test coverage enforced** - Tests must pass before merge
- ✅ **Build verification** - No broken builds reach main
- ✅ **Preview deployment** - Every PR gets a preview deployment
- ✅ **E2E validation** - Preview apps tested before merge

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and write tests
# ... code changes ...

# 3. Verify locally
yarn test:coverage  # Must pass with 100% coverage
yarn build          # Must build successfully

# 4. Push and create PR
git push origin feature/my-feature
# Create PR on GitHub

# 5. Wait for CI checks ✅
# - Tests run automatically
# - Build verification
# - Preview deployment
# - E2E tests against preview
# - Merge button enabled only when all checks pass

# 6. Merge to main
# - Deploy to production manually when ready
```

## Pipeline Jobs

### 1. Test Job

- **Triggers**: All pushes and pull requests
- **Steps**:
  - Checkout code
  - Install dependencies
  - Run ESLint
  - Run Vitest with 100% coverage requirement
  - Upload coverage to Codecov (if token configured)
- **Artifacts**: Coverage reports

### 2. Build Job

- **Triggers**: Only if Test job passes
- **Steps**:
  - Checkout code
  - Install dependencies
  - Build Next.js application
  - Upload build artifacts
- **Artifacts**: `.next` directory

### 3. Deploy Job

- **Triggers**: On all branches after successful build
- **Steps**:
  - Install Vercel CLI
  - Pull Vercel preview environment
  - Build for preview
  - Deploy to Vercel Preview
  - Output deployment URL
- **Outputs**: `deployment-url` - URL of the preview deployment

### 4. E2E Job

- **Triggers**: On all branches after successful deployment
- **Steps**:
  - Checkout code
  - Install dependencies
  - Install Playwright browsers
  - Run Cucumber/Playwright tests against preview URL
  - Upload test reports and screenshots
- **Artifacts**: E2E test reports and failure screenshots

## Monitoring CI/CD

### View Workflow Runs

- Go to **Actions** tab in your repository
- Click on a workflow run to see details
- View logs for each job

### Download Artifacts

- Build artifacts (`.next` directory)
- E2E test reports and screenshots
- Available for 7 days after workflow run

### Status Badges

Add to your README:

```markdown
[![CI/CD Pipeline](https://github.com/spike-land-ai/spike.land/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/spike-land-ai/spike.land/actions/workflows/ci-cd.yml)
```
