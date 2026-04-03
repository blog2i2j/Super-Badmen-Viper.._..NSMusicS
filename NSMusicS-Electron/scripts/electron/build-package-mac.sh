#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CURRENT_ARCH="$(node -p "process.arch")"
OTHER_ARCH="x64"
NODE_VERSION="${NSMUSICS_MAC_NODE_VERSION:-18}"

if [[ "${CURRENT_ARCH}" != "x64" && "${CURRENT_ARCH}" != "arm64" ]]; then
  echo "[mac] unsupported current arch: ${CURRENT_ARCH}" >&2
  echo "[mac] use x64 or arm64" >&2
  exit 1
fi

if [[ "${CURRENT_ARCH}" == "x64" ]]; then
  OTHER_ARCH="arm64"
fi

echo "[mac] project root: ${PROJECT_ROOT}"
echo "[mac] current arch: ${CURRENT_ARCH}"
echo "[mac] next arch: ${OTHER_ARCH}"

echo "[mac] build current arch first"
cd "${PROJECT_ROOT}"
node -p "process.arch"
npm run build

echo "[mac] switch arch and reset npm environment"
arch -"${OTHER_ARCH}" zsh <<EOF
set -euo pipefail
export NVM_DIR="\${NVM_DIR:-\$HOME/.nvm}"
if [[ ! -s "\$NVM_DIR/nvm.sh" ]]; then
  echo "[mac] missing nvm.sh under \$NVM_DIR" >&2
  exit 1
fi
. "\$NVM_DIR/nvm.sh"
if [[ -s "\$NVM_DIR/bash_completion" ]]; then
  . "\$NVM_DIR/bash_completion"
fi
cd "${PROJECT_ROOT}"
nvm use "${NODE_VERSION}"
node -p "process.arch"
npm run build
EOF
