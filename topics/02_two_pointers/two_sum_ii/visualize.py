"""Animated terminal visualization for Two Sum II - Input Array Is Sorted.

The runner picks this file up automatically::

    python3 run.py two_sum_ii --animate
    python3 run.py two_sum_ii --animate -c '[[2, 7, 11, 15], 9]'
    python3 run.py two_sum_ii --animate --case 2 --speed 0.4

``frames(numbers, target, palette=...)`` yields one complete frame per algorithm
step: the sorted array as a row of boxes, the two pointers at each end, the
running ``numbers[lo] + numbers[hi]`` sum compared against ``target``, and the
pointer that has to move. On a match both chips glow green, an arc ties the pair
together, and the answer is shown 1-indexed. ``framework.animate.play`` repaints
the frames in place. The box art is meant for small inputs (<= ~10 numbers).
"""
from __future__ import annotations

from typing import Dict, Iterator, List, Optional

from framework.runner import Palette

MARGIN = "  "          # left margin shared by every art row
BAR = "▲"


def frames(numbers: List[int], target: int, *, palette: Optional[Palette] = None) -> Iterator[str]:
    """Yield the step-by-step frames for one Two Sum II call."""
    p = palette or Palette(enabled=True)

    if not numbers:
        yield f"{MARGIN}{p.dim('numbers is empty → return []')}\n"
        return
    if len(numbers) == 1:
        yield f"{MARGIN}{p.dim('need two numbers to form a pair → return []')}\n"
        return

    width = max(len(str(value)) for value in numbers) + 2   # inner box width
    for state in _states(list(numbers), target):
        yield _frame(numbers, width, state, p, target)


# -- algorithm model -------------------------------------------------------

def _states(numbers: List[int], target: int) -> List[Dict]:
    """Replay the two-pointer scan as a list of renderable states."""
    n = len(numbers)
    lo, hi = 0, n - 1
    states: List[Dict] = []

    def add(kind: str, **extra) -> None:
        states.append(dict(kind=kind, lo=lo, hi=hi, **extra))

    add("start", sum=numbers[lo] + numbers[hi])

    while lo < hi:
        total = numbers[lo] + numbers[hi]
        if total == target:
            add("match", sum=total)
            return states
        if total > target:
            add("move_hi", sum=total, moving="hi")
            hi -= 1
        else:
            add("move_lo", sum=total, moving="lo")
            lo += 1

    add("none")
    return states


# -- frame rendering -------------------------------------------------------

def _frame(numbers: List[int], width: int, state: Dict, p: Palette, target: int) -> str:
    """Render one full frame; every frame has the same number of rows."""
    n = len(numbers)
    lo, hi = state["lo"], state["hi"]

    indices, cells, bars = [], [], []
    for i in range(n):
        role = _role(i, state)
        indices.append(_tint(_cell(str(i), width), role, p))
        cells.append(_tint(_cell(str(numbers[i]), width), role, p))
        marker = BAR if i in (lo, hi) else ""
        bars.append(_tint(_cell(marker, width), role, p))

    arc = _arc_row(numbers, width, lo, hi, state["kind"] == "match", p)
    top = MARGIN + "┌" + "┬".join("─" * width for _ in range(n)) + "┐"
    middle = MARGIN + "│" + "│".join(cells) + "│"
    bottom = MARGIN + "└" + "┴".join("─" * width for _ in range(n)) + "┘"

    lines = [
        arc,
        (MARGIN + " " + " ".join(indices) + " ").rstrip(),
        top,
        middle,
        bottom,
        (MARGIN + " " + " ".join(bars)).rstrip(),
        "",
        _pointer_line(numbers, state, p),
        _sum_line(numbers, state, p),
        _compare_line(state, target, p),
        "",
        _result_line(state, p),
    ]
    return "\n".join(lines) + "\n"


def _arc_row(numbers: List[int], width: int, lo: int, hi: int,
             matched: bool, p: Palette) -> str:
    """A smile-shaped arc over the matched pair (blank on every other frame)."""
    if not matched:
        return ""
    centre = lambda i: 1 + i * (width + 1) + width // 2   # noqa: E731
    left, right = centre(lo), centre(hi)
    if right <= left + 1:
        return ""
    arc = "╰" + "─" * (right - left - 1) + "╯"
    return MARGIN + " " * left + p.bold(p.green(arc))


def _pointer_line(numbers: List[int], state: Dict, p: Palette) -> str:
    lo, hi = state["lo"], state["hi"]
    kind = state["kind"]

    def idx(i: int, which: str) -> str:
        text = f"{i} (numbers[{i}] = {numbers[i]})"
        if kind == "match":
            return p.bold(p.green(text))
        if kind in ("move_lo", "move_hi") and state["moving"] == which:
            return p.bold(p.cyan(text))
        return p.bold(p.yellow(text))

    return (MARGIN + p.dim("lo = ") + idx(lo, "lo")
            + "    " + p.dim("hi = ") + idx(hi, "hi"))


def _sum_line(numbers: List[int], state: Dict, p: Palette) -> str:
    total = state.get("sum")
    if total is None:
        return MARGIN + p.dim("sum   : –  (pointers crossed)")
    lo, hi = state["lo"], state["hi"]
    return (MARGIN + p.dim("sum   : ")
            + p.bold(str(numbers[lo])) + p.dim(" + ") + p.bold(str(numbers[hi]))
            + p.dim(" = ") + p.bold(str(total)))


def _compare_line(state: Dict, target: int, p: Palette) -> str:
    kind = state["kind"]
    total = state.get("sum")
    if kind == "start":
        return MARGIN + p.dim(f"check : compare {total} with target {target} …")
    if kind == "match":
        return MARGIN + p.bold(p.green(f"check : {total} = target {target}   ✓ match"))
    if kind == "move_lo":
        return MARGIN + p.bold(p.cyan(f"check : {total} < target {target}   → lo++ (need a bigger sum)"))
    if kind == "move_hi":
        return MARGIN + p.bold(p.yellow(f"check : {total} > target {target}   → hi-- (need a smaller sum)"))
    return MARGIN + p.dim("check : pointers crossed → no pair")


def _result_line(state: Dict, p: Palette) -> str:
    kind = state["kind"]
    if kind == "match":
        lo, hi = state["lo"], state["hi"]
        return (MARGIN + p.bold(p.green(f"return [{lo + 1}, {hi + 1}]"))
                + p.dim(f"   ← 1-indexed (0-based [{lo}, {hi}])"))
    if kind == "none":
        return MARGIN + p.dim("return []   (no pair adds up to target)")
    return ""


def _role(index: int, state: Dict) -> str:
    kind = state["kind"]
    lo, hi = state["lo"], state["hi"]
    if kind == "match" and index in (lo, hi):
        return "green"
    if kind in ("move_lo", "move_hi") and index == state[state["moving"]]:
        return "cyan"
    if index in (lo, hi):
        return "yellow"
    return "plain"


def _cell(content: str, width: int) -> str:
    """One value/index box, right-aligned like the numbers it sits over."""
    return " " + f"{content:>{width - 2}} "


def _tint(text: str, role: str, p: Palette) -> str:
    if role == "yellow":
        return p.bold(p.yellow(text))
    if role == "green":
        return p.bold(p.green(text))
    if role == "red":
        return p.bold(p.red(text))
    if role == "cyan":
        return p.bold(p.cyan(text))
    if role == "dim":
        return p.dim(text)
    return text
