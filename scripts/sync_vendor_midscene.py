#!/usr/bin/env python3
"""Sync built Midscene packages from sibling ../midscene into vendor/midscene/.

Cross-platform (macOS / Windows / Linux). Does NOT symlink outside this repo.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VENDOR = ROOT / "vendor" / "midscene"

WORKSPACE_TO_FILE = {
    "@midscene/shared": "file:../shared",
    "@midscene/core": "file:../core",
    "@midscene/playground": "file:../playground",
    "@midscene/android": "file:../android",
}


def die(msg: str, code: int = 1) -> None:
    print(msg, file=sys.stderr)
    raise SystemExit(code)


def find_midscene_src() -> Path:
    env = os.environ.get("MIDSCENE_SRC")
    if env:
        return Path(env).expanduser().resolve()
    return (ROOT / ".." / "midscene").resolve()


def find_rslib(ms: Path) -> Path:
    """Locate rslib binary under midscene's pnpm / npm node_modules."""
    candidates: list[Path] = []
    bases = (
        ms / "node_modules" / ".pnpm" / "node_modules" / ".bin",
        ms / "node_modules" / ".bin",
    )
    for base in bases:
        if sys.platform == "win32":
            candidates.extend(
                [
                    base / "rslib.CMD",
                    base / "rslib.cmd",
                    base / "rslib.ps1",
                    base / "rslib",
                ]
            )
        else:
            candidates.append(base / "rslib")

    for c in candidates:
        if c.is_file():
            return c

    which = shutil.which("rslib")
    if which:
        return Path(which)
    die(f"rslib not found under {ms} — run pnpm install there first")


def run_rslib(ms: Path, rslib: Path, pkg: str, extra: list[str] | None = None) -> None:
    cmd = [str(rslib), "build", *(extra or [])]
    print(f"Building @midscene/{pkg}…")
    completed = subprocess.run(
        cmd,
        cwd=str(ms / "packages" / pkg),
        shell=sys.platform == "win32",
        check=False,
    )
    if completed.returncode != 0:
        die(f"rslib build failed for {pkg} (exit {completed.returncode})")


def ensure_built(ms: Path, rslib: Path) -> None:
    shared_dist = ms / "packages" / "shared" / "dist"
    if not shared_dist.is_dir():
        subprocess.run(
            [str(rslib), "build", "-c", "./rslib.inspect.config.ts"],
            cwd=str(ms / "packages" / "shared"),
            shell=sys.platform == "win32",
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        run_rslib(ms, rslib, "shared")

    for pkg in ("core", "android", "playground"):
        if not (ms / "packages" / pkg / "dist").is_dir():
            run_rslib(ms, rslib, pkg)


def copy_items(src: Path, dst: Path, items: list[str]) -> None:
    dst.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src / "package.json", dst / "package.json")
    for item in items:
        sp = src / item
        if not sp.exists():
            continue
        dp = dst / item
        if sp.is_dir():
            if dp.exists():
                shutil.rmtree(dp)
            shutil.copytree(sp, dp)
        else:
            shutil.copy2(sp, dp)
    for extra in ("LICENSE", "README.md"):
        ep = src / extra
        if ep.is_file():
            shutil.copy2(ep, dst / extra)
    print(f"vendored {src.name}")


def rewrite_workspace_deps(vendor: Path) -> None:
    for pkg in vendor.iterdir():
        if not pkg.is_dir() or pkg.name.startswith("."):
            continue
        pj = pkg / "package.json"
        if not pj.is_file():
            continue
        data = json.loads(pj.read_text(encoding="utf-8"))
        for section in (
            "dependencies",
            "optionalDependencies",
            "peerDependencies",
            "devDependencies",
        ):
            deps = data.get(section) or {}
            for k, v in list(deps.items()):
                if k in WORKSPACE_TO_FILE and isinstance(v, str) and v.startswith(
                    "workspace:"
                ):
                    deps[k] = WORKSPACE_TO_FILE[k]
            if deps:
                data[section] = deps
        pj.write_text(
            json.dumps(data, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )


def write_vendor_readme(vendor: Path) -> None:
    (vendor / "README.md").write_text(
        """# Vendored Midscene packages (built artifacts)

Used by `@mtp/domain-executor` and `@mtp/business-cowork-csv` via `file:` deps.
Refresh from the sibling `midscene` repo with:

```bash
npm run sync:midscene
```

Then commit the updated `vendor/midscene/**` trees.
""",
        encoding="utf-8",
    )


def main() -> None:
    ms = find_midscene_src()
    if not (ms / "packages" / "core").is_dir():
        die(
            "Midscene source not found "
            f"(set MIDSCENE_SRC or place repo at {ROOT / '..' / 'midscene'})"
        )

    rslib = find_rslib(ms)
    ensure_built(ms, rslib)

    if VENDOR.exists():
        shutil.rmtree(VENDOR)
    VENDOR.mkdir(parents=True)

    copy_items(ms / "packages" / "shared", VENDOR / "shared", ["dist"])
    copy_items(ms / "packages" / "core", VENDOR / "core", ["dist"])
    copy_items(ms / "packages" / "android", VENDOR / "android", ["bin", "dist"])
    copy_items(
        ms / "packages" / "playground", VENDOR / "playground", ["dist", "static"]
    )

    rewrite_workspace_deps(VENDOR)
    write_vendor_readme(VENDOR)

    print(f"Synced into {VENDOR}")
    print("Next: npm install && restart executor-service")


if __name__ == "__main__":
    main()
