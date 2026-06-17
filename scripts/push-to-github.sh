#!/usr/bin/env bash
# Create GitHub repo and push — run once after: gh auth login
set -e
cd "$(dirname "$0")/.."

REPO_NAME="${1:-voltwise}"
VISIBILITY="${2:-public}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Install GitHub CLI: https://cli.github.com/"
  echo "Then: gh auth login"
  exit 1
fi

gh auth status || { echo "Run: gh auth login"; exit 1; }

if git remote get-url origin >/dev/null 2>&1; then
  echo "Remote exists, pushing..."
  git push -u origin main
else
  gh repo create "$REPO_NAME" --$VISIBILITY --source=. --remote=origin --push
fi

echo ""
echo "Done. Import in Vercel: https://vercel.com/new"
gh repo view --web 2>/dev/null || true
