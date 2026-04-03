#!/usr/bin/env bash
# 手动执行示例:
# export NSMUSICS_DOCKER_IMAGE="xiangch007/nsmusics"
# docker build --platform linux/arm64/v8 -t xiangch007/nsmusics:arm64-pure --provenance=false .
#
# 通过 npm 调用:
# npm run docker:build:mac

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
IMAGE_REPO="${NSMUSICS_DOCKER_IMAGE:-xiangch007/nsmusics}"
HOST_ARCH="$(uname -m)"

if [[ "${HOST_ARCH}" != "arm64" && "${HOST_ARCH}" != "aarch64" ]]; then
  echo "[docker-mac-build] arm64 host required, current host: ${HOST_ARCH}" >&2
  exit 1
fi

cd "${PROJECT_ROOT}"

echo "[docker-mac-build] project root: ${PROJECT_ROOT}"
echo "[docker-mac-build] image: ${IMAGE_REPO}:arm64-pure"

docker build --platform linux/arm64/v8 -t "${IMAGE_REPO}:arm64-pure" --provenance=false .
