"""Serve and open a problem's optional animated HTML page.

A problem may ship a ``visualize.html`` next to ``solution.py``. The runner
serves the problem directory over a tiny local HTTP server -- so JSON
arguments can travel in the query string -- and does its best to open the
URL in the user's browser::

    python3 run.py two_sum --html
    python3 run.py two_sum --html -c '[[3, 2, 4], 6]' --case 8

The page receives ``?args=<url-encoded JSON list>``. Press Ctrl+C to stop
the server; set ``CODE180_NO_OPEN=1`` to skip launching a browser.

In VS Code the URL can also be shown in an editor tab: Command Palette ->
``Simple Browser: Show`` -> paste the URL.
"""
from __future__ import annotations

import functools
import json
import os
import shutil
import subprocess
import urllib.parse
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Optional

from .animate import resolve_args
from .runner import Palette

ROOT = Path(__file__).resolve().parent.parent


class _QuietHandler(SimpleHTTPRequestHandler):
    """A static file handler that keeps the terminal clean."""

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A002
        pass


def _is_wsl() -> bool:
    try:
        return "microsoft" in Path("/proc/version").read_text().lower()
    except OSError:
        return False


def open_url(url: str) -> bool:
    """Best-effort: open ``url`` in the user's default browser."""
    if _is_wsl():
        # xdg-open usually has no browser installed in WSL; cmd.exe does.
        for cmd in ("cmd.exe", "/mnt/c/Windows/System32/cmd.exe"):
            if shutil.which(cmd) or Path(cmd).exists():
                try:
                    subprocess.Popen(
                        [cmd, "/c", "start", "", url],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                    return True
                except OSError:
                    break
    try:
        return webbrowser.open(url)
    except webbrowser.Error:
        return False


def run_home(
    *,
    anchor: Optional[str] = None,
    palette: Optional[Palette] = None,
) -> int:
    """Serve the root ``index.html`` catalog and return when Ctrl+C stops the server."""
    page = ROOT / "index.html"
    if not page.exists():
        from .viz.build import build_index
        page = build_index()

    handler = functools.partial(_QuietHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    port = server.server_address[1]
    frag = f"#{anchor}" if anchor else ""
    url = f"http://127.0.0.1:{port}/index.html{frag}"

    p = palette or Palette(enabled=True)
    print(p.bold("code180  ·  Visual Algorithm Catalog (Home)"))
    print(f"  file    : {page}")
    print(f"  url     : {url}")
    print("  vscode  : Command Palette → 'Simple Browser: Show' → paste the URL")
    print("  ctrl-c to stop the server")
    if os.environ.get("CODE180_NO_OPEN") or not open_url(url):
        print("  (could not launch a browser automatically — open the url above)")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.server_close()
    return 0


def run(
    problem: Any,
    *,
    raw: Optional[str] = None,
    case_index: Optional[int] = None,
    palette: Optional[Palette] = None,
) -> int:
    """Serve ``visualize.html`` from repo root and return when Ctrl+C stops the server."""
    page = problem.directory / "visualize.html"
    if not page.exists():
        print(
            f"'{problem.id}' has no HTML visualization yet "
            f"(add visualize.html next to solution.py)."
        )
        return 2

    args = resolve_args(problem, raw, case_index)
    if args is None:
        return 2

    query = urllib.parse.urlencode({"args": json.dumps(args)})
    rel_path = page.resolve().relative_to(ROOT.resolve()).as_posix()
    handler = functools.partial(_QuietHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    port = server.server_address[1]
    url = f"http://127.0.0.1:{port}/{rel_path}?{query}"

    p = palette or Palette(enabled=True)
    print(p.bold(f"{problem.title}  ·  HTML visualization"))
    print(f"  file    : {page}")
    print(f"  url     : {url}")
    print("  vscode  : Command Palette → 'Simple Browser: Show' → paste the URL")
    print("  ctrl-c to stop the server")
    if os.environ.get("CODE180_NO_OPEN") or not open_url(url):
        print("  (could not launch a browser automatically — open the url above)")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.server_close()
    return 0
