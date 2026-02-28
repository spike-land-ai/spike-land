# Branch Protection Setup Guide

This guide explains how to configure GitHub branch protection rules to ensure no
code can be merged to `main` without passing all tests.

## Steps to Configure Branch Protection

### 1. Navigate to Branch Protection Settings

1. Go to your GitHub repository: https://github.com/spike-land-ai/spike.land
2. Click on **Settings** (top navigation)
3. Click on **Branches** (left sidebar under "Code and automation")
4. Under "Branch protection rules", click **Add rule** or **Add branch
   protection rule**

### 2. Configure the Protection Rule

#### Branch Name Pattern

- Enter: `main`

#### Protect Matching Branches - Enable These Settings:

✅ **Require a pull request before merging**

- This ensures all changes go through a PR
- Optional: Check "Require approvals" if you want code reviews (set number of
  required reviewers)
- Optional: Check "Dismiss stale pull request approvals when new commits are
  pushed"

✅ **Require status checks to pass before merging**

- Check this box
- Check "Require branches to be up to date before merging"
- In the search box, add these status checks (they appear after your first CI
  run):
  - `Run Tests` (unit tests)
  - `Build Application` (build verification)
  - `E2E Tests` (end-to-end tests against preview deployment)

✅ **Require conversation resolution before merging** (recommended)

- Ensures all PR comments are addressed

✅ **Do not allow bypassing the above settings** (recommended)

- Prevents admins from bypassing these rules
- Uncheck if you need emergency override capability

#### Optional but Recommended Settings:

✅ **Require linear history**

- Prevents merge commits, keeps history clean
- Requires rebase or squash merge

✅ **Require deployments to succeed before merging**

- **RECOMMENDED**: Require Vercel preview deployments to succeed
- Vercel automatically reports deployment status via GitHub integration
- Add `Vercel` or `Vercel – spike.land` to required checks once available

### 3. Save the Rule

Click **Create** or **Save changes** at the bottom of the page.

## How It Works

### After Configuration:

1. **Direct commits to `main` are blocked** - You must create a branch and PR
2. **All required status checks must pass** - Tests and build must succeed
3. **PR can only be merged after checks pass** - Green checkmarks required
4. **Failed tests block merging** - Red X prevents merge

### Workflow Example:

```bash
# 1. Create a feature branch
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "Add new feature"

# 3. Push to GitHub
git push origin feature/my-feature

# 4. Create Pull Request on GitHub
# - Tests will automatically run
# - Wait for all checks to pass ✅
# - Merge button will be enabled only when all checks pass

# 5. Merge the PR
# - After merge, deployment and E2E tests run on main
```

## Required Status Checks

The following checks must pass before merging:

- ✅ **Run Tests** - Unit tests with 100% coverage (Vitest)
- ✅ **Build Application** - Next.js build must succeed
- ✅ **E2E Tests** - Playwright/Cucumber tests against preview deployment

All checks run on every branch and pull request.

## Testing the Protection

Try to push directly to main:

```bash
git checkout main
echo "test" >> test.txt
git add test.txt
git commit -m "Test protection"
git push origin main
```

You should see an error like:

```
remote: error: GH006: Protected branch update failed for refs/heads/main.
```

## Troubleshooting

### Status Checks Don't Appear

- Push a commit to trigger the CI pipeline first
- Status checks only appear after running at least once
- Check the workflow runs in the Actions tab

### Can't Find Status Checks

- Make sure you've run the workflow at least once
- The job names must match exactly: "Run Tests", "Build Application", and "E2E
  Tests"
- Check for spaces and capitalization

### Need to Override Protection

- Temporarily disable "Do not allow bypassing"
- Or give specific users/teams bypass permissions
- Re-enable after emergency fix

## Alternative: GitHub CLI Method

You can also set this up via GitHub CLI:

```bash
# Install GitHub CLI if needed
# brew install gh  # macOS
# Or: https://cli.github.com/

# Authenticate
echo ${GH_PAT_TOKEN} | gh auth login --with-token

# Create branch protection rule
gh api repos/spike-land-ai/spike.land/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=Run Tests \
  --field required_status_checks[contexts][]=Build Application \
  --field required_status_checks[contexts][]=E2E Tests \
  --field required_pull_request_reviews[required_approving_review_count]=0 \
  --field enforce_admins=true \
  --field restrictions=null
```

## Pre-Merge Smoke Test (MANDATORY)

**Before merging ANY pull request**, a manual smoke test MUST be performed on
the Vercel preview deployment.

### Smoke Test Process

1. Find the preview URL in Vercel's PR comment
2. Open the preview deployment
3. Test key functionality relevant to the PR changes
4. Document the test result in a PR comment

### Required PR Comment Format

```markdown
✅ Manual smoke test completed on preview deployment

Tested:

- [x] Home page loads correctly
- [x] [Feature specific tests...]
- [x] No console errors

Ready to merge.
```

### Why This Is Required

Automated tests catch regressions, but manual verification ensures:

- UI renders correctly in production-like environment
- Critical user flows work end-to-end
- No visual regressions or broken layouts
- Environment variables and integrations work correctly

**See CLAUDE.md "Pre-Merge Smoke Test" section for full checklist.**

## Benefits

✅ **No broken code in main** - All tests must pass ✅ **Consistent quality** -
Enforced code standards ✅ **Safe deployments** - Only tested code reaches
production ✅ **Manual verification** - Smoke tests catch UI/UX issues ✅ **Code
review process** - PRs encourage collaboration ✅ **Audit trail** - All changes
documented in PRs

## Additional Resources

- [Secrets Setup Guide](../docs/guides/SECRETS_SETUP.md) - Complete secrets and
  environment variables documentation
- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Status Checks Documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
