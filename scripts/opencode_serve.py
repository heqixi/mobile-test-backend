#!/usr/bin/env python3
"""Start OpenCode headless server via installed CLI (no sibling source tree).

Cross-platform (macOS / Windows / Linux).
Install once: brew install opencode  OR  npm i -g opencode-ai
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_dotenv(path: Path) -> None:
    """Minimal .env loader (KEY=VALUE); does not override existing env."""
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        if not key or key in os.environ:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        os.environ[key] = value


def find_opencode() -> str:
    override = os.environ.get("OPENCODE_BIN", "").strip()
    if override:
        return override
    which = shutil.which("opencode")
    if which:
        return which
    if sys.platform == "win32":
        for name in ("opencode.cmd", "opencode.exe", "opencode.ps1"):
            found = shutil.which(name)
            if found:
                return found
    print("opencode CLI not found on PATH.", file=sys.stderr)
    print("Install (pick one), then re-run npm run opencode:serve:", file=sys.stderr)
    print("  brew install opencode", file=sys.stderr)
    print("  npm i -g opencode-ai", file=sys.stderr)
    print("Or set OPENCODE_BIN=/path/to/opencode", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    load_dotenv(ROOT / ".env")

    port = os.environ.get("OPENCODE_PORT", "4096")
    host = os.environ.get("OPENCODE_HOSTNAME", "127.0.0.1")
    bin_path = find_opencode()

    args = [
        bin_path,
        "serve",
        "--port",
        port,
        "--hostname",
        host,
        "--cors",
        "http://127.0.0.1:4100",
        "--cors",
        "http://127.0.0.1:4101",
        "--cors",
        "http://127.0.0.1:4102",
        "--cors",
        "http://127.0.0.1:4103",
    ]
    print(f"[opencode-serve] {' '.join(args)}")
    # Replace current process when possible; Windows still works via wait.
    if sys.platform == "win32":
        raise SystemExit(
            subprocess.call(args, shell=True, env=os.environ)
        )
    os.execvpe(bin_path, args, os.environ)


if __name__ == "__main__":
    main()
