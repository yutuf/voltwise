#!/usr/bin/env bash
# Push to github.com/yutuf/voltwise — run after: gh auth login
set -e
cd "$(dirname "$0")/.."
GH="${GH:-$(dirname "$0")/../.tools/gh_2.67.0_linux_amd64/bin/gh}"
command -v gh >/dev/null 2>&1 && GH=gh

$GH auth status || { echo "First run: $GH auth login"; exit 1; }

if git remote get-url origin | grep -q yutuf/voltwise; then
  if curl -sf https://api.github.com/repos/yutuf/voltwise >/dev/null 2>&1; then
    echo "Repo exists, pushing..."
    git push -u origin main
  else
    echo "Creating github.com/yutuf/voltwise ..."
    $GH repo create voltwise --public --source=. --remote=origin --push
  fi
else
  git remote add origin https://github.com/yutuf/voltwise.git 2>/dev/null || true
  $GH repo create voltwise --public --source=. --remote=origin --push
fi

echo ""
echo "✓ https://github.com/yutuf/voltwise"
echo "→ Next: https://vercel.com/new import this repo"
