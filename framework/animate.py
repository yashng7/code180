"""Dependency-free terminal animation player for problem visualizations.

Optional ``visualize.py``
-------------------------
A problem may ship a ``visualize.py`` next to ``solution.py`` exposing::

    def frames(*args, palette=None) -> Iterator[str]:
        '''Yield one complete frame (multi-line string) per algorithm step.'''

The runner drives it::

    python3 run.py two_sum --animate
    python3 run.py two_sum --animate -c '[[3, 2, 4], 6]' --speed 0.4
    python3 run.py two_sum --animate --case 5

``play`` repaints the same block of the terminal in place with ANSI cursor
movement, which works in the VS Code integrated terminal, tmux and any
ANSI-capable emulator. When ``stdout`` is not a TTY (pipes, CI) or
``speed <= 0``, only the final frame is printed, so the animation degrades
to a plain walkthrough of the last step.
"""
from __future__ import annotations

import json
import re
import shutil
import sys
import time
from typing import Any, Iterable, Optional

from .runner import Palette

DEFAULT_SPEED = 0.8                     # seconds between frames
HIDE_CURSOR = "\033[?25l"
SHOW_CURSOR = "\033[?25h"
_ANSI = re.compile(r"\x1b\[[0-9;?]*[A-Za-z]")


def strip_ansi(text: str) -> str:
    """Remove ANSI escape sequences so text can be measured."""
    return _ANSI.sub("", text)


def display_width(text: str) -> int:
    """Visible width of ``text`` ignoring ANSI escapes."""
    return len(strip_ansi(text))


def visual_rows(text: str, columns: int) -> int:
    """How many terminal rows ``text`` occupies, accounting for wrapping."""
    lines = text.split("\n")
    if lines and lines[-1] == "":
        lines.pop()
    rows = 0
    for line in lines:
        width = display_width(line)
        rows += max(1, -(-width // columns))
    return rows


def play(
    frames: Iterable[str],
    *,
    speed: float = DEFAULT_SPEED,
    header: str = "",
    stream: Any = None,
) -> None:
    """Play ``frames`` in place, then leave the final frame on screen.

    ``header`` (if given) is printed once above the animated block. Without
    a TTY -- or with ``speed <= 0`` -- only the last frame is printed, so
    piped output and CI logs stay readable.
    """
    if stream is None:
        stream = sys.stdout
    if header:
        stream.write(header.rstrip("\n") + "\n")

    interactive = speed > 0 and bool(getattr(stream, "isatty", lambda: False)())
    if not interactive:
        _print_final_frame(frames, stream)
        return

    columns = shutil.get_terminal_size(fallback=(80, 24)).columns or 80
    iterator = iter(frames)

    stream.write(HIDE_CURSOR)
    stream.flush()
    drawn = 0                            # rows occupied by the previous frame
    try:
        frame = next(iterator, None)
        while frame is not None:
            if drawn:                    # jump back to the block's first row
                stream.write(f"\033[{drawn}A")
            stream.write("\033[J")       # erase the previous block
            text = frame if frame.endswith("\n") else frame + "\n"
            stream.write(text)
            stream.flush()
            drawn = visual_rows(text, columns)
            frame = next(iterator, None)
            if frame is not None:
                time.sleep(speed)
    except KeyboardInterrupt:
        stream.write("\n")               # leave the terminal below the frame
    finally:
        stream.write(SHOW_CURSOR)
        stream.flush()


def _print_final_frame(frames: Iterable[str], stream: Any) -> None:
    last: Optional[str] = None
    for frame in frames:
        last = frame
    if last is None:
        return
    stream.write(last if last.endswith("\n") else last + "\n")
    stream.flush()


def run(
    problem: Any,
    *,
    raw: Optional[str] = None,
    case_index: Optional[int] = None,
    speed: float = DEFAULT_SPEED,
    palette: Optional[Palette] = None,
) -> int:
    """Animate ``problem`` using its ``visualize.py``; returns an exit code."""
    p = palette or Palette(enabled=True)
    visualizer = problem.visualizer()
    if visualizer is None or not hasattr(visualizer, "frames"):
        print(
            f"'{problem.id}' has no terminal visualization yet "
            f"(add visualize.py with a frames() generator)."
        )
        return 2

    args = resolve_args(problem, raw, case_index)
    if args is None:
        return 2

    function = problem.meta.get("function", problem.id)
    shown = ", ".join(repr(arg) for arg in args)
    header = (
        p.bold(f"{problem.title}  ·  {problem.topic}") + "\n"
        + p.dim(f"{function}({shown})  ·  ctrl-c to stop")
    )
    try:
        play(visualizer.frames(*args, palette=p), speed=speed, header=header)
    except TypeError as exc:      # e.g. the wrong number of custom arguments
        print(f"Could not animate {function}({shown}): {exc}")
        return 2
    return 0


def resolve_args(
    problem: Any, raw: Optional[str], case_index: Optional[int]
) -> Optional[list]:
    """Pick the arguments to animate: custom ``raw`` JSON or a built-in case."""
    if raw is not None:
        try:
            args = json.loads(raw)
        except json.JSONDecodeError:
            try:
                args = json.loads(f"[{raw}]")
            except json.JSONDecodeError as exc:
                print(f"Could not parse custom arguments: {exc}")
                return None
        return args if isinstance(args, list) else [args]

    cases = problem.cases
    if not cases:
        print(f"'{problem.id}' has no built-in cases to animate.")
        return None
    index = 1 if case_index is None else case_index
    if not 1 <= index <= len(cases):
        print(f"--case must be between 1 and {len(cases)}; {problem.id} has {len(cases)} cases.")
        return None
    case_args = cases[index - 1].get("args", [])
    # Design problems pass their operation sequence as a single dict payload.
    return case_args if isinstance(case_args, dict) else list(case_args)
