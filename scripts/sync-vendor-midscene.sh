#!/usr/bin/env bash
# Sync built Midscene packages from the sibling ../midscene repo into
# vendor/midscene/ (in-repo, committed). Does NOT symlink outside this repo.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MS_DEFAULT="$(cd "$ROOT/../midscene" 2>/dev/null && pwd || true)"
MS="${MIDSCENE_SRC:-$MS_DEFAULT}"
VENDOR="$ROOT/vendor/midscene"
RSLIB="${MS:+$MS/node_modules/.pnpm/node_modules/.bin/rslib}"

if [[ -z "${MS:-}" || ! -d "$MS/packages/core" ]]; then
  echo "Midscene source not found (set MIDSCENE_SRC or place repo at $ROOT/../midscene)" >&2
  exit 1
fi

build_pkg() {
  local pkg="$1"
  echo "Building @midscene/$pkg…"
  (cd "$MS/packages/$pkg" && "$RSLIB" build)
}

if [[ ! -x "${RSLIB:-}" ]]; then
  echo "rslib not found under midscene — run pnpm install there first" >&2
  exit 1
fi

if [[ ! -d "$MS/packages/shared/dist" ]]; then
  (cd "$MS/packages/shared" && "$RSLIB" build -c ./rslib.inspect.config.ts >/dev/null || true)
  build_pkg shared
fi
for pkg in core android playground; do
  if [[ ! -d "$MS/packages/$pkg/dist" ]]; then
    build_pkg "$pkg"
  fi
done

rm -rf "$VENDOR"
mkdir -p "$VENDOR"

copy_pkg() {
  local name="$1"
  shift
  local src="$MS/packages/$name"
  local dst="$VENDOR/$name"
  mkdir -p "$dst"
  cp "$src/package.json" "$dst/"
  for item in "$@"; do
    if [[ -e "$src/$item" ]]; then
      rsync -a "$src/$item" "$dst/"
    fi
  done
  [[ -f "$src/LICENSE" ]] && cp "$src/LICENSE" "$dst/" || true
  [[ -f "$src/README.md" ]] && cp "$src/README.md" "$dst/" || true
  echo "vendored $name"
}

copy_pkg shared dist
copy_pkg core dist
copy_pkg android bin dist
copy_pkg playground dist static

python3 - "$VENDOR" <<'PY'
import json, sys
from pathlib import Path
vendor = Path(sys.argv[1])
mapping = {
    "@midscene/shared": "file:../shared",
    "@midscene/core": "file:../core",
    "@midscene/playground": "file:../playground",
    "@midscene/android": "file:../android",
}
for pkg in vendor.iterdir():
    if not pkg.is_dir() or pkg.name.startswith('.'):
        continue
    pj = pkg / "package.json"
    if not pj.exists():
        continue
    data = json.loads(pj.read_text())
    for section in ("dependencies", "optionalDependencies", "peerDependencies", "devDependencies"):
        deps = data.get(section) or {}
        for k, v in list(deps.items()):
            if k in mapping and isinstance(v, str) and v.startswith("workspace:"):
                deps[k] = mapping[k]
        if deps:
            data[section] = deps
    pj.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
PY

cat > "$VENDOR/README.md" <<'EOF'
# Vendored Midscene packages (built artifacts)

Used by `@mtp/domain-executor` and `@mtp/business-cowork-csv` via `file:` deps.
Refresh from the sibling `midscene` repo with:

```bash
npm run sync:midscene
```

Then commit the updated `vendor/midscene/**` trees.
EOF

echo "Synced into $VENDOR"
echo "Next: npm install && restart executor-service"
