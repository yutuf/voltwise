#!/usr/bin/env bash
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

PORT="${PORT:-8000}"
echo ""
echo "  Voltwise → http://127.0.0.1:${PORT}"
echo "  Admin    → http://127.0.0.1:${PORT}/admin"
echo "  API docs → http://127.0.0.1:${PORT}/docs"
echo ""
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --reload
