#!/bin/bash
#
# Interactive Setup Script for spike-land-nextjs
# Automates developer onboarding from clone to running app
#
# Usage:
#   ./scripts/setup.sh           # Interactive mode with all prompts
#   ./scripts/setup.sh --quick   # Skip optional OAuth/database prompts
#   ./scripts/setup.sh --ci      # Non-interactive mode for CI environments
#
# For more information, see: README.md
#

set -e

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.local"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"

# Flags
QUICK_MODE=false
CI_MODE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --quick)
      QUICK_MODE=true
      shift
      ;;
    --ci)
      CI_MODE=true
      QUICK_MODE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [--quick] [--ci] [--help]"
      echo ""
      echo "Options:"
      echo "  --quick  Skip optional OAuth and database setup prompts"
      echo "  --ci     Non-interactive mode for CI environments"
      echo "  --help   Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# =============================================================================
# Colors and Output Helpers
# =============================================================================

# Check if terminal supports colors
if [[ -t 1 ]] && [[ -n "$TERM" ]] && command -v tput &>/dev/null; then
  RED=$(tput setaf 1)
  GREEN=$(tput setaf 2)
  YELLOW=$(tput setaf 3)
  BLUE=$(tput setaf 4)
  CYAN=$(tput setaf 6)
  BOLD=$(tput bold)
  RESET=$(tput sgr0)
else
  RED=""
  GREEN=""
  YELLOW=""
  BLUE=""
  CYAN=""
  BOLD=""
  RESET=""
fi

info() {
  echo "${BLUE}[INFO]${RESET} $1"
}

success() {
  echo "${GREEN}[OK]${RESET} $1"
}

warn() {
  echo "${YELLOW}[WARN]${RESET} $1"
}

error() {
  echo "${RED}[ERROR]${RESET} $1" >&2
}

step() {
  echo ""
  echo "${BOLD}${CYAN}==> $1${RESET}"
}

# =============================================================================
# Helper Functions
# =============================================================================

# Check if a command exists
command_exists() {
  command -v "$1" &>/dev/null
}

# Generate a secure random secret
generate_secret() {
  if command_exists openssl; then
    openssl rand -base64 32
  elif [[ -r /dev/urandom ]]; then
    head -c 32 /dev/urandom | base64
  else
    error "Cannot generate secret: no openssl or /dev/urandom available"
    return 1
  fi
}

# Get user input with default value
prompt() {
  local prompt_text="$1"
  local default_value="$2"
  local result

  if [[ "$CI_MODE" == "true" ]]; then
    echo "$default_value"
    return
  fi

  if [[ -n "$default_value" ]]; then
    read -r -p "$prompt_text [$default_value]: " result
    echo "${result:-$default_value}"
  else
    read -r -p "$prompt_text: " result
    echo "$result"
  fi
}

# Ask yes/no question
confirm() {
  local prompt_text="$1"
  local default="${2:-n}"

  if [[ "$CI_MODE" == "true" ]]; then
    [[ "$default" == "y" ]] && return 0 || return 1
  fi

  local yn_prompt
  if [[ "$default" == "y" ]]; then
    yn_prompt="[Y/n]"
  else
    yn_prompt="[y/N]"
  fi

  read -r -p "$prompt_text $yn_prompt: " response
  case "${response,,}" in
    y|yes) return 0 ;;
    n|no) return 1 ;;
    "") [[ "$default" == "y" ]] && return 0 || return 1 ;;
    *) return 1 ;;
  esac
}

# Get Node.js major version
get_node_version() {
  if command_exists node; then
    node -v | sed 's/v//' | cut -d. -f1
  else
    echo "0"
  fi
}

# Detect operating system
detect_os() {
  case "$(uname -s)" in
    Darwin*) echo "macos" ;;
    Linux*) echo "linux" ;;
    CYGWIN*|MINGW*|MSYS*) echo "windows" ;;
    *) echo "unknown" ;;
  esac
}

# =============================================================================
# Setup Steps
# =============================================================================

check_prerequisites() {
  step "Checking Prerequisites"

  local os
  os=$(detect_os)
  info "Detected OS: $os"

  # Check Node.js
  if ! command_exists node; then
    error "Node.js is not installed"
    echo "  Please install Node.js v20 or later:"
    echo "  - macOS: brew install node"
    echo "  - Linux: https://nodejs.org/en/download/"
    exit 1
  fi

  local node_version
  node_version=$(get_node_version)
  if [[ "$node_version" -lt 20 ]]; then
    error "Node.js v20 or later is required (found v$node_version)"
    echo "  Please upgrade Node.js to v20 or later"
    exit 1
  fi
  success "Node.js v$(node -v | sed 's/v//') detected"

  # Check corepack
  if ! command_exists corepack; then
    error "Corepack is not available"
    echo "  Corepack should be included with Node.js v16.9.0+"
    echo "  Try reinstalling Node.js"
    exit 1
  fi
  success "Corepack is available"

  # Check optional dependencies
  if command_exists docker; then
    success "Docker is available (optional, for local database)"
  else
    info "Docker not found (optional, for local database)"
  fi

  if command_exists openssl; then
    success "OpenSSL is available (for secret generation)"
  else
    warn "OpenSSL not found, will use /dev/urandom for secrets"
  fi
}

enable_corepack() {
  step "Enabling Corepack"

  if corepack enable 2>/dev/null; then
    success "Corepack enabled"
  else
    warn "Could not enable corepack (may require sudo)"
    info "Trying with sudo..."
    if sudo corepack enable; then
      success "Corepack enabled with sudo"
    else
      error "Failed to enable corepack"
      echo "  Please run: sudo corepack enable"
      exit 1
    fi
  fi
}

install_dependencies() {
  step "Installing Dependencies"

  cd "$PROJECT_ROOT"

  info "Running yarn..."
  if yarn; then
    success "Dependencies installed"
  else
    error "Failed to install dependencies"
    echo "  Check your network connection and try again"
    exit 1
  fi
}

setup_environment() {
  step "Setting Up Environment Variables"

  cd "$PROJECT_ROOT"

  # Check if .env.local already exists
  if [[ -f "$ENV_FILE" ]]; then
    if [[ "$CI_MODE" == "true" ]]; then
      info ".env.local already exists, skipping environment setup"
      return
    fi

    warn ".env.local already exists"
    if ! confirm "Do you want to reconfigure it?" "n"; then
      info "Keeping existing .env.local"
      return
    fi
  fi

  # Start with the example file
  if [[ -f "$ENV_EXAMPLE" ]]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    info "Created .env.local from .env.example"
  else
    touch "$ENV_FILE"
    warn ".env.example not found, creating empty .env.local"
  fi

  # Generate AUTH_SECRET
  info "Generating AUTH_SECRET..."
  local auth_secret
  auth_secret=$(generate_secret)
  if [[ -n "$auth_secret" ]]; then
    # Replace placeholder in .env.local
    if grep -q "^AUTH_SECRET=" "$ENV_FILE"; then
      if [[ "$(detect_os)" == "macos" ]]; then
        sed -i '' "s|^AUTH_SECRET=.*|AUTH_SECRET=$auth_secret|" "$ENV_FILE"
      else
        sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=$auth_secret|" "$ENV_FILE"
      fi
    else
      echo "AUTH_SECRET=$auth_secret" >> "$ENV_FILE"
    fi
    success "AUTH_SECRET generated and saved"
  else
    error "Failed to generate AUTH_SECRET"
  fi

  # Set NEXTAUTH_URL
  local nextauth_url="http://localhost:3000"
  if grep -q "^NEXTAUTH_URL=" "$ENV_FILE"; then
    if [[ "$(detect_os)" == "macos" ]]; then
      sed -i '' "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=$nextauth_url|" "$ENV_FILE"
    else
      sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=$nextauth_url|" "$ENV_FILE"
    fi
  else
    echo "NEXTAUTH_URL=$nextauth_url" >> "$ENV_FILE"
  fi
  success "NEXTAUTH_URL set to $nextauth_url"

  # Generate E2E_BYPASS_SECRET
  info "Generating E2E_BYPASS_SECRET..."
  local e2e_secret
  e2e_secret=$(generate_secret)
  if [[ -n "$e2e_secret" ]]; then
    if grep -q "^# E2E_BYPASS_SECRET=" "$ENV_FILE" || grep -q "^E2E_BYPASS_SECRET=" "$ENV_FILE"; then
      if [[ "$(detect_os)" == "macos" ]]; then
        sed -i '' "s|^# E2E_BYPASS_SECRET=.*|E2E_BYPASS_SECRET=$e2e_secret|" "$ENV_FILE"
        sed -i '' "s|^E2E_BYPASS_SECRET=.*|E2E_BYPASS_SECRET=$e2e_secret|" "$ENV_FILE"
      else
        sed -i "s|^# E2E_BYPASS_SECRET=.*|E2E_BYPASS_SECRET=$e2e_secret|" "$ENV_FILE"
        sed -i "s|^E2E_BYPASS_SECRET=.*|E2E_BYPASS_SECRET=$e2e_secret|" "$ENV_FILE"
      fi
    else
      echo "E2E_BYPASS_SECRET=$e2e_secret" >> "$ENV_FILE"
    fi
    success "E2E_BYPASS_SECRET generated and saved"
  fi
}

setup_database() {
  step "Database Setup (Optional)"

  if [[ "$QUICK_MODE" == "true" ]]; then
    info "Skipping database setup (--quick mode)"
    return
  fi

  if ! command_exists docker; then
    info "Docker not installed, skipping database setup"
    echo "  To use a local database, install Docker and run this script again"
    return
  fi

  echo ""
  echo "You can set up a local PostgreSQL database using Docker."
  echo "This is optional - the app can work without a database for basic features."
  echo ""

  if ! confirm "Would you like to set up a local PostgreSQL database?" "n"; then
    info "Skipping database setup"
    return
  fi

  info "Starting PostgreSQL container..."

  # Check if container already exists
  if docker ps -a --format '{{.Names}}' | grep -q "^spike-land-postgres$"; then
    warn "Container 'spike-land-postgres' already exists"
    if docker ps --format '{{.Names}}' | grep -q "^spike-land-postgres$"; then
      success "PostgreSQL container is already running"
    else
      info "Starting existing container..."
      docker start spike-land-postgres
      success "PostgreSQL container started"
    fi
  else
    # Create new container
    docker run -d \
      --name spike-land-postgres \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=password \
      -e POSTGRES_DB=spike_land \
      -p 5432:5432 \
      postgres:16-alpine

    success "PostgreSQL container created and started"
  fi

  # Update DATABASE_URL in .env.local
  local db_url="postgresql://postgres:password@localhost:5432/spike_land?schema=public"
  if grep -q "^DATABASE_URL=" "$ENV_FILE"; then
    if [[ "$(detect_os)" == "macos" ]]; then
      sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=$db_url|" "$ENV_FILE"
    else
      sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$db_url|" "$ENV_FILE"
    fi
  else
    echo "DATABASE_URL=$db_url" >> "$ENV_FILE"
  fi
  success "DATABASE_URL configured in .env.local"

  # Wait for database to be ready
  info "Waiting for database to be ready..."
  local retries=30
  while ! docker exec spike-land-postgres pg_isready -U postgres &>/dev/null; do
    retries=$((retries - 1))
    if [[ $retries -le 0 ]]; then
      error "Database did not become ready in time"
      return
    fi
    sleep 1
  done
  success "Database is ready"

  # Run Prisma migrations if available
  if [[ -f "$PROJECT_ROOT/prisma/schema.prisma" ]]; then
    info "Running Prisma migrations..."
    cd "$PROJECT_ROOT"
    if yarn prisma migrate deploy 2>/dev/null || yarn prisma db push 2>/dev/null; then
      success "Database schema applied"
    else
      warn "Could not apply database migrations"
      echo "  You may need to run: yarn prisma db push"
    fi
  fi
}

setup_oauth() {
  step "OAuth Provider Setup (Optional)"

  if [[ "$QUICK_MODE" == "true" ]]; then
    info "Skipping OAuth setup (--quick mode)"
    echo "  You can configure OAuth providers later by editing .env.local"
    return
  fi

  echo ""
  echo "OAuth providers enable user authentication via GitHub, Google, etc."
  echo "This is optional - you can set this up later."
  echo ""

  # GitHub OAuth
  if confirm "Would you like to configure GitHub OAuth?" "n"; then
    echo ""
    echo "To set up GitHub OAuth:"
    echo "  1. Go to: https://github.com/settings/developers"
    echo "  2. Click 'New OAuth App'"
    echo "  3. Set callback URL to: http://localhost:3000/api/auth/callback/github"
    echo ""

    local github_id
    local github_secret
    github_id=$(prompt "Enter GitHub Client ID" "")
    if [[ -n "$github_id" ]]; then
      github_secret=$(prompt "Enter GitHub Client Secret" "")
      if [[ -n "$github_secret" ]]; then
        # Update .env.local
        if [[ "$(detect_os)" == "macos" ]]; then
          sed -i '' "s|^GITHUB_ID=.*|GITHUB_ID=$github_id|" "$ENV_FILE"
          sed -i '' "s|^GITHUB_SECRET=.*|GITHUB_SECRET=$github_secret|" "$ENV_FILE"
        else
          sed -i "s|^GITHUB_ID=.*|GITHUB_ID=$github_id|" "$ENV_FILE"
          sed -i "s|^GITHUB_SECRET=.*|GITHUB_SECRET=$github_secret|" "$ENV_FILE"
        fi
        success "GitHub OAuth configured"
      fi
    fi
  fi

  # Google OAuth
  if confirm "Would you like to configure Google OAuth?" "n"; then
    echo ""
    echo "To set up Google OAuth:"
    echo "  1. Go to: https://console.cloud.google.com/"
    echo "  2. Create/select a project"
    echo "  3. Go to APIs & Services > Credentials"
    echo "  4. Create OAuth 2.0 Client ID"
    echo "  5. Add redirect URI: http://localhost:3000/api/auth/callback/google"
    echo ""

    local google_id
    local google_secret
    google_id=$(prompt "Enter Google Client ID" "")
    if [[ -n "$google_id" ]]; then
      google_secret=$(prompt "Enter Google Client Secret" "")
      if [[ -n "$google_secret" ]]; then
        # Update .env.local
        if [[ "$(detect_os)" == "macos" ]]; then
          sed -i '' "s|^GOOGLE_ID=.*|GOOGLE_ID=$google_id|" "$ENV_FILE"
          sed -i '' "s|^GOOGLE_SECRET=.*|GOOGLE_SECRET=$google_secret|" "$ENV_FILE"
        else
          sed -i "s|^GOOGLE_ID=.*|GOOGLE_ID=$google_id|" "$ENV_FILE"
          sed -i "s|^GOOGLE_SECRET=.*|GOOGLE_SECRET=$google_secret|" "$ENV_FILE"
        fi
        success "Google OAuth configured"
      fi
    fi
  fi
}

setup_playwright() {
  step "Installing Playwright Browsers"

  cd "$PROJECT_ROOT"

  info "Installing Chromium for E2E tests..."
  if yarn dlx playwright install chromium; then
    success "Playwright Chromium installed"
  else
    warn "Failed to install Playwright browsers"
    echo "  You can install later with: yarn dlx playwright install chromium"
  fi
}

run_health_check() {
  step "Running Health Check"

  cd "$PROJECT_ROOT"

  # Try to build
  info "Building the application..."
  if yarn build; then
    success "Build successful"
  else
    error "Build failed"
    echo "  Please check the error messages above"
    return 1
  fi
}

print_summary() {
  step "Setup Complete!"

  echo ""
  echo "${GREEN}${BOLD}Congratulations! Your development environment is ready.${RESET}"
  echo ""
  echo "Next steps:"
  echo ""
  echo "  1. Start the development server:"
  echo "     ${CYAN}yarn dev${RESET}"
  echo ""
  echo "  2. Open your browser:"
  echo "     ${CYAN}http://localhost:3000${RESET}"
  echo ""
  echo "  3. Run tests:"
  echo "     ${CYAN}yarn test${RESET}              # Unit tests"
  echo "     ${CYAN}yarn test:coverage${RESET}     # With coverage"
  echo "     ${CYAN}yarn test:e2e:local${RESET}    # E2E tests (dev server must be running)"
  echo ""

  if [[ "$QUICK_MODE" == "true" ]]; then
    echo "Optional configuration:"
    echo ""
    echo "  - Edit ${CYAN}.env.local${RESET} to configure:"
    echo "    - OAuth providers (GitHub, Google)"
    echo "    - Database connection"
    echo "    - Other services"
    echo ""
  fi

  echo "For more information, see:"
  echo "  - ${CYAN}README.md${RESET}           - Project documentation"
  echo "  - ${CYAN}CLAUDE.md${RESET}           - Development guidelines"
  echo "  - ${CYAN}docs/${RESET}               - Additional documentation"
  echo ""
}

# =============================================================================
# Main
# =============================================================================

main() {
  echo ""
  echo "${BOLD}${CYAN}=====================================${RESET}"
  echo "${BOLD}${CYAN}  spike-land-nextjs Setup Script${RESET}"
  echo "${BOLD}${CYAN}=====================================${RESET}"
  echo ""

  if [[ "$CI_MODE" == "true" ]]; then
    info "Running in CI mode (non-interactive)"
  elif [[ "$QUICK_MODE" == "true" ]]; then
    info "Running in quick mode (skipping optional prompts)"
  fi

  check_prerequisites
  enable_corepack
  install_dependencies
  setup_environment
  setup_database
  setup_oauth
  setup_playwright
  run_health_check
  print_summary
}

# Run main function
main
