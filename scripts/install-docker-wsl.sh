#!/usr/bin/env bash
set -euo pipefail

if ! grep -qi microsoft /proc/version; then
  echo "This script is intended for Ubuntu running under WSL." >&2
  exit 1
fi

if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo is required to install Docker Engine." >&2
  exit 1
fi

sudo apt-get update
sudo apt-get install -y ca-certificates curl

sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" |
  sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker "$USER"

if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
  sudo systemctl enable --now docker
else
  sudo service docker start
fi

docker --version
docker compose version

cat <<'EOF'

Docker Engine is installed.

If `docker ps` says permission denied, close this WSL terminal and open it again
so the new `docker` group membership takes effect.

Then run:

  cd /home/wsw/git/time-tracker
  npm run dev:local
EOF
