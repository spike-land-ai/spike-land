# ============================================================================
# Docker Bake Configuration for CI/CD Pipeline
#
# This replaces repetitive Dockerfile sharding with declarative HCL syntax.
# BuildKit will automatically parallelize targets within the same group.
#
# Usage:
#   docker buildx bake                    # Build default (ci) target
#   docker buildx bake ci                 # Full CI pipeline
#   docker buildx bake unit-tests         # Just unit tests (all shards)
#   docker buildx bake production         # Production image
#   docker buildx bake --print            # Preview what would be built
#
#   depot bake ci                         # Full CI via Depot
# ============================================================================

variable "UNIT_SHARDS" {
  default = 4
}

# ============================================================================
# Groups - Logical collections of targets
# ============================================================================

group "default" {
  targets = ["ci"]
}

group "ci" {
  targets = ["ci-final"]
}

group "unit-tests" {
  targets = ["unit-tests-collector"]
}

# ============================================================================
# Base Targets - Shared configuration
# ============================================================================

target "_common" {
  dockerfile = "Dockerfile"
  context    = "."
  attest     = []
}

# ============================================================================
# Build Pipeline Targets
# ============================================================================

target "base" {
  inherits = ["_common"]
  target   = "base"
}

target "deps" {
  inherits = ["_common"]
  target   = "deps"
}

target "source" {
  inherits = ["_common"]
  target   = "source"
}

target "lint" {
  inherits = ["_common"]
  target   = "lint"
}

target "build" {
  inherits = ["_common"]
  target   = "build"
  cache-to = ["type=local,dest=.docker-cache/build"]
  cache-from = ["type=local,src=.docker-cache/build"]
}

target "test-source" {
  inherits = ["_common"]
  target   = "test-source"
}

# ============================================================================
# Unit Test Shards - Matrix build pattern
# ============================================================================

target "unit-test-shard" {
  inherits = ["_common"]
  target   = "unit-test-shard"
  args = {
    SHARD_INDEX = "1"
    SHARD_TOTAL = "${UNIT_SHARDS}"
  }
}

target "unit-tests-1" {
  inherits = ["unit-test-shard"]
  args = {
    SHARD_INDEX = "1"
    SHARD_TOTAL = "${UNIT_SHARDS}"
  }
}

target "unit-tests-2" {
  inherits = ["unit-test-shard"]
  args = {
    SHARD_INDEX = "2"
    SHARD_TOTAL = "${UNIT_SHARDS}"
  }
}

target "unit-tests-3" {
  inherits = ["unit-test-shard"]
  args = {
    SHARD_INDEX = "3"
    SHARD_TOTAL = "${UNIT_SHARDS}"
  }
}

target "unit-tests-4" {
  inherits = ["unit-test-shard"]
  args = {
    SHARD_INDEX = "4"
    SHARD_TOTAL = "${UNIT_SHARDS}"
  }
}

target "unit-tests-collector" {
  inherits = ["_common"]
  target   = "unit-tests"
}

# ============================================================================
# Final Targets
# ============================================================================

target "ci-final" {
  inherits = ["_common"]
  target   = "ci"
}

target "production" {
  inherits = ["_common"]
  target   = "production"
  tags     = ["spike-land:production", "spike-land:latest"]
}

target "dev" {
  inherits = ["_common"]
  target   = "dev"
  tags     = ["spike-land:dev"]
}
