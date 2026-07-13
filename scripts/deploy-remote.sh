#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/onecode"
REPO_URL="https://github.com/craft-create/onecode.git"
BRANCH="${DEPLOY_BRANCH:-main}"
if ! git ls-remote --exit-code --heads "$REPO_URL" "$BRANCH" >/dev/null 2>&1; then
  if [ "$BRANCH" != "master" ] && git ls-remote --exit-code --heads "$REPO_URL" "master" >/dev/null 2>&1; then
    BRANCH="master"
  elif [ "$BRANCH" != "main" ] && git ls-remote --exit-code --heads "$REPO_URL" "main" >/dev/null 2>&1; then
    BRANCH="main"
  else
    BRANCH="main"
  fi
fi

run_with_env() {
  if [ -n "${NPM_HTTP_PROXY:-}" ]; then
    export HTTP_PROXY="$NPM_HTTP_PROXY"
    export HTTPS_PROXY="$NPM_HTTP_PROXY"
    export http_proxy="$NPM_HTTP_PROXY"
    export https_proxy="$NPM_HTTP_PROXY"
  fi

  if [ -n "${NPM_NO_PROXY:-}" ]; then
    export NO_PROXY="$NPM_NO_PROXY"
    export no_proxy="$NPM_NO_PROXY"
  fi
}

run_with_env

if [ ! -d "$APP_DIR" ]; then
  echo "[deploy] APP_DIR not found, creating it: $APP_DIR" >&2
  mkdir -p "$APP_DIR"
fi

if [ -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env" /tmp/onecode.env.backup
fi

cd "$APP_DIR"

if [ -d ".git" ]; then
  echo "[deploy] repo exists, fetching $BRANCH"
  git clean -fd
  git fetch --depth=1 origin "$BRANCH"
  git checkout -f -B "$BRANCH" "origin/$BRANCH"
else
  echo "[deploy] bootstrap git repository"
  find . -mindepth 1 -maxdepth 1 \
    ! -name '.env' \
    -exec rm -rf {} +
  git init
  git remote add origin "$REPO_URL"
  git fetch --depth=1 origin "$BRANCH"
  git checkout -B "$BRANCH" "origin/$BRANCH"
fi

git clean -fd

if [ -f /tmp/onecode.env.backup ]; then
  cp /tmp/onecode.env.backup .env
  rm -f /tmp/onecode.env.backup
fi

# 缓存依赖，减少重复部署耗时（依赖不变则走快速路径）
NPM_CACHE_DIR="/opt/.onecode_npm_cache"
CURRENT_LOCK_SHA="$(sha256sum package-lock.json | awk '{print $1}')"
mkdir -p "$NPM_CACHE_DIR"

if [ -f "package-lock.json" ]; then
  if [ -f "node_modules/.package-lock.sha256" ] && [ "$CURRENT_LOCK_SHA" = "$(cat node_modules/.package-lock.sha256 2>/dev/null || true)" ]; then
    echo "[deploy] package-lock 未变，跳过 npm ci（提升部署速度）"
    npm install --prefer-offline --no-audit --no-fund
  else
    echo "[deploy] package-lock 已变或首次部署，执行 npm ci"
    npm ci --no-audit --no-fund --cache "$NPM_CACHE_DIR"
    echo "$CURRENT_LOCK_SHA" > node_modules/.package-lock.sha256
  fi
else
  npm ci --no-audit --no-fund --cache "$NPM_CACHE_DIR"
fi

npm run build:prod

if command -v sudo >/dev/null 2>&1; then
  if [ -z "${SUDO_PASSWORD:-}" ]; then
    echo "SUDO_PASSWORD is required to restart service"
    exit 1
  fi
  echo "$SUDO_PASSWORD" | sudo -S -p '' systemctl restart onecode
  echo "$SUDO_PASSWORD" | sudo -S -p '' systemctl status onecode --no-pager -l | sed -n '1,30p'
else
  systemctl restart onecode
  systemctl status onecode --no-pager -l | sed -n '1,30p'
fi
