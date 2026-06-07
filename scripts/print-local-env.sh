#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

status_env="$(npx supabase status -o env)"
eval "$status_env"

cat <<EOF
NEXT_PUBLIC_SUPABASE_URL=${API_URL}
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${ANON_KEY}
NEXT_PUBLIC_ENABLE_DEV_AUTH=true
EOF
