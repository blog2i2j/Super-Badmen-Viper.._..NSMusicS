#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
IMAGE_REPO="${NSMUSICS_DOCKER_IMAGE:-xiangch007/nsmusics}"
HOST_ARCH="$(uname -m)"

if [[ "${HOST_ARCH}" != "arm64" && "${HOST_ARCH}" != "aarch64" ]]; then
  echo "[docker-mac-upload] arm64 host required, current host: ${HOST_ARCH}" >&2
  exit 1
fi

cd "${PROJECT_ROOT}"

echo "[docker-mac-upload] project root: ${PROJECT_ROOT}"
echo "[docker-mac-upload] push: ${IMAGE_REPO}:arm64-pure"

docker push "${IMAGE_REPO}:arm64-pure"
docker manifest rm "${IMAGE_REPO}:latest" >/dev/null 2>&1 || true
docker manifest create --amend "${IMAGE_REPO}:latest" "${IMAGE_REPO}:amd64-pure" "${IMAGE_REPO}:arm64-pure"
docker manifest annotate "${IMAGE_REPO}:latest" "${IMAGE_REPO}:amd64-pure" --os linux --arch amd64
docker manifest annotate "${IMAGE_REPO}:latest" "${IMAGE_REPO}:arm64-pure" --os linux --arch arm64 --variant v8
docker manifest push --purge "${IMAGE_REPO}:latest"
