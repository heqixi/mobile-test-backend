#!/usr/bin/env python3
"""Point node_modules/@midscene/* at in-repo vendor/midscene (Mac / Windows / Linux).

Prefer `npm install` (file: deps); this repairs links if install was skipped.
On Windows, falls back to directory junctions when symlinks require elevation.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VENDOR = ROOT / "vendor" / "midscene"
NM = ROOT / "node_modules" / "@midscene"
PKGS = ("shared", "core", "android", "playground")


def die(msg: str, code: int = 1) -> None:
    print(msg, file=sys.stderr)
    raise SystemExit(code)


def remove_path(path: Path) -> None:
    if not path.exists() and not path.is_symlink():
        return
    if path.is_symlink() or path.is_file():
        path.unlink()
        return
    shutil.rmtree(path)


def link_dir(src: Path, dst: Path) -> None:
    remove_path(dst)
    try:
        os.symlink(src, dst, target_is_directory=True)
        return
    except OSError as err:
        if sys.platform != "win32":
            raise
        # Directory junction: no admin / Developer Mode required.
        completed = subprocess.run(
            ["cmd", "/c", "mklink", "/J", str(dst), str(src)],
            check=False,
            capture_output=True,
            text=True,
        )
        if completed.returncode != 0:
            detail = (completed.stderr or completed.stdout or str(err)).strip()
            die(f"Failed to link {dst} -> {src}: {detail}")


def main() -> None:
    if not (VENDOR / "core" / "dist").is_dir():
        die(f"Missing {VENDOR / 'core' / 'dist'} — run: npm run sync:midscene")

    NM.mkdir(parents=True, exist_ok=True)
    for pkg in PKGS:
        src = VENDOR / pkg
        dst = NM / pkg
        if not src.is_dir():
            print(f"skip missing {src}", file=sys.stderr)
            continue
        link_dir(src, dst)
        print(f"linked @midscene/{pkg} -> {src}")

    print("Done. Restart executor-service to pick up vendored Midscene.")
    print("Tip: MIDSCENE_AI_ACT_MAX_ACTIONS=1 (or pass maxActions per call).")


if __name__ == "__main__":
    main()
