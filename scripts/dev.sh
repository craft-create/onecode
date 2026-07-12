#!/usr/bin/env bash
# `npm run dev` 入口：Linux 上直接使用 dev-local 启动脚本，不依赖飞书沙箱环境变量。
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$SCRIPT_DIR/dev-local.js" ]; then
  echo "[dev] scripts/dev-local.js 缺失" >&2
  exit 1
fi

exec node "$SCRIPT_DIR/dev-local.js" "$@"
