#!/usr/bin/env bash
# Production server — no reload, binds all interfaces
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/backend"

if [ -f "$ROOT/.env" ]; then
  set -a
  source "$ROOT/.env"
  set +a
fi

if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt

export ENVIRONMENT="${ENVIRONMENT:-production}"
WORKERS="${WORKERS:-1}"
PORT="${PORT:-8000}"

echo "Voltwise PRODUCTION → http://0.0.0.0:${PORT}"
echo "API docs → http://0.0.0.0:${PORT}/docs"
echo "Admin    → http://0.0.0.0:${PORT}/admin"

exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "$PORT" \
  --workers "$WORKERS"
