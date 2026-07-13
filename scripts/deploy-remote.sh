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
  echo "[deploy] APP_DIR not found: $APP_DIR" >&2
  exit 1
fi

if [ -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env" /tmp/onecode.env.backup
fi

cd "$APP_DIR"

if [ -d ".git" ]; then
  echo "[deploy] repo exists, pulling $BRANCH"
  git clean -fdx
  git fetch --depth=1 origin "$BRANCH"
  git checkout -B "$BRANCH" "origin/$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  echo "[deploy] bootstrap git repository"
  find . -mindepth 1 -maxdepth 1 \
    ! -name '.env' \
    ! -name '.git' \
    -exec rm -rf {} +
  rm -rf .git
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

npm ci --no-audit --no-fund
npm run build:prod

systemctl restart onecode
systemctl status onecode --no-pager -l | sed -n '1,30p'
