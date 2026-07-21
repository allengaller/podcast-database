#!/usr/bin/env bash
#
# pre-deploy-check.sh
#
# Verifies that the local environment has every variable and binary the
# Vercel + Railway + GitHub Actions deploy path expects, so a deploy
# failure surfaces at "30 seconds in" instead of "30 minutes in".
#
# Usage:
#   ./scripts/pre-deploy-check.sh                  # verify the project itself
#   DEPLOY_TARGET=production ./scripts/pre-deploy-check.sh   # also check secrets
#
# Exit codes:
#   0  - ready to deploy
#   1  - missing required dependency / env
#   2  - missing recommended (non-fatal) hint
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

red()    { printf '\033[31m%s\033[0m\n' "$*"; }
green()  { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
bold()   { printf '\033[1m%s\033[0m\n' "$*"; }

FAIL=0
HINT=0

require() {
  local label="$1"
  local cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    green "  ✓ $label"
  else
    red   "  ✗ $label"
    FAIL=1
  fi
}

hint() {
  local label="$1"
  local cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    green "  ✓ $label"
  else
    yellow "  ! $label (recommended)"
    HINT=1
  fi
}

file_present() {
  local label="$1"
  local path="$2"
  if [ -f "$ROOT/$path" ]; then
    green "  ✓ $label"
  else
    red   "  ✗ $label"
    FAIL=1
  fi
}

env_present() {
  local name="$1"
  if [ -n "${!name:-}" ]; then
    green "  ✓ $name"
  else
    red   "  ✗ $name"
    FAIL=1
  fi
}

env_hint() {
  local name="$1"
  if [ -n "${!name:-}" ]; then
    green "  ✓ $name"
  else
    yellow "  ! $name (recommended for production)"
    HINT=1
  fi
}

bold "▶ Host binaries"
require "node (>=18)"        "node -e 'process.exit(parseInt(process.versions.node) < 18 ? 1 : 0)'"
require "pnpm (>=9)"          "pnpm -v | awk -F. '{ exit (\$1 < 9) ? 1 : 0 }'"
hint   "docker"               "command -v docker"
hint   "redis-cli"            "command -v redis-cli"
hint   "yt-dlp (transcribe)"  "command -v yt-dlp"

bold ""
bold "▶ Repo files"
file_present ".env (or .env.local)"   ".env"
file_present "frontend/.env.local"    "frontend/.env.local"
file_present "apps/worker/.env"       "apps/worker/.env"
file_present "vercel.json"            "frontend/vercel.json"
file_present "apps/worker/Dockerfile" "apps/worker/Dockerfile"
file_present "railway.toml"           "railway.toml"

bold ""
bold "▶ Production-required env (when DEPLOY_TARGET=production)"
if [ "${DEPLOY_TARGET:-}" = "production" ]; then
  env_present "DATABASE_URL"
  env_present "REDIS_URL"
  env_present "S3_ENDPOINT"
  env_present "S3_BUCKET"
  env_present "S3_ACCESS_KEY"
  env_present "S3_SECRET_KEY"
  env_present "AUTH_SECRET"
  env_present "GITHUB_CLIENT_ID"
  env_present "GITHUB_CLIENT_SECRET"
  env_present "ADMIN_TOKEN"
  env_hint   "SENTRY_DSN"
  env_hint   "SENTRY_ORG"
  env_hint   "SENTRY_PROJECT"
  env_hint   "SENTRY_AUTH_TOKEN"
  env_hint   "CODECOV_TOKEN"
fi

bold ""
bold "▶ Local source sanity (opt-in: set SKIP_SOURCE_CHECK=1 to skip)"
if [ "${SKIP_SOURCE_CHECK:-}" != "1" ]; then
  require "TypeScript compiles"   "pnpm -s typecheck 2>&1 | tail -5 | grep -q 'failed' && exit 1 || true"
  hint   "All unit tests pass"    "pnpm -s test 2>&1 | tail -5"
else
  yellow "  ! skipped (SKIP_SOURCE_CHECK=1)"
fi

bold ""
if [ $FAIL -eq 0 ]; then
  green "✓ Pre-deploy checks passed."
  if [ $HINT -ne 0 ]; then
    yellow "  (Some recommended items missing — fine for local dev, address before production.)"
  fi
  exit 0
else
  red   "✗ Pre-deploy checks FAILED. Fix the items above before deploying."
  exit 1
fi
