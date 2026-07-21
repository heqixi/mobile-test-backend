#!/usr/bin/env bash
# Ensure node_modules/@midscene/* points at in-repo vendor/midscene packages.
# Prefer `npm install` (file: deps); this script repairs symlinks if install was skipped.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR="$ROOT/vendor/midscene"
NM="$ROOT/node_modules/@midscene"

if [[ ! -d "$VENDOR/core/dist" ]]; then
  echo "Missing $VENDOR/core/dist — run: npm run sync:midscene" >&2
  exit 1
fi

mkdir -p "$NM"
for pkg in shared core android playground; do
  src="$VENDOR/$pkg"
  dst="$NM/$pkg"
  if [[ ! -d "$src" ]]; then
    echo "skip missing $src" >&2
    continue
  fi
  rm -rf "$dst"
  ln -s "$src" "$dst"
  echo "linked @midscene/$pkg -> $src"
done

echo "Done. Restart executor-service to pick up vendored Midscene."
echo "Tip: MIDSCENE_AI_ACT_MAX_ACTIONS=1 (or pass maxActions per call)."
