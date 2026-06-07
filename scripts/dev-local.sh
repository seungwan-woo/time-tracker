#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for local Supabase. Install Docker Desktop and enable WSL integration." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop, then run npm run dev:local again." >&2
  exit 1
fi

npx supabase start

status_env="$(npx supabase status -o env)"
eval "$status_env"

export NEXT_PUBLIC_SUPABASE_URL="${API_URL}"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${ANON_KEY}"
export NEXT_PUBLIC_ENABLE_DEV_AUTH=true

npm run dev
