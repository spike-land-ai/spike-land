# Testing

## Docker-Based Incremental Test Caching

Tests run inside Docker using BuildKit's layer cache to skip unchanged packages. Each package gets its own named cache scope in GitHub Actions, so only packages whose source files changed will re-run tests on each PR or push.

### How it works

1. `scripts/detect-changed-packages.sh` diffs `HEAD` against `origin/main` and outputs a list of changed package names (or `ALL` if root config files changed).
2. The CI workflow (`test-incremental.yml`) converts that list into a matrix and launches one Docker build job per changed package.
3. Each job targets the corresponding stage in `docker/Dockerfile.test` (e.g. `test-chess-engine`) using `docker/build-push-action` with GHA cache (`type=gha,scope=test-<package>`).
4. If the package source is unchanged, BuildKit restores the cached layer and exits immediately — no test runner is invoked.
5. When `detect-changes` outputs `run_all=true`, a single `test-all` job runs the top-level stage that covers every package.

### Local usage

```bash
# Test only packages changed since origin/main
npm run test:docker:ci

# Test a specific package
bash scripts/docker-test.sh chess-engine

# Test everything
npm run test:docker:all
```

### Cache scopes

Each package gets an isolated GHA cache key (`scope=test-<package>`), so a cache hit for `chess-engine` does not invalidate `spike-edge` and vice versa.
