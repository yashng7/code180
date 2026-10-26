"""Animated terminal visualization for Container With Most Water.

The runner picks this file up automatically::

    python3 run.py container_with_most_water --animate
    python3 run.py container_with_most_water --animate --case 1 --speed 0.4
    python3 run.py container_with_most_water --animate -c '[[1, 8, 6, 2, 5, 4, 8, 3, 7]]'

``frames(height, palette=...)`` yields one complete frame per algorithm step:
the heights as a bar chart, the two pointers starting at the ends, the water
rectangle between them shaded up to the shorter wall, the
``width x height = area`` arithmetic, and the running ``best``.  Each step then
slides the shorter wall inward.  ``framework.animate.play`` repaints the frames
in place.  The bar art is meant for small arrays (<= ~12 lines).
"""
from __future__ import annotations

from typing import Iterator, List, Optional

from framework.runner import Palette

MARGIN = "  "                     # left margin shared by every art row
CW = 3                            # width of one column of the chart
MAX_ROWS = 12                     # tall arrays are scaled to fit this many rows
WALL = "█"
WATER = "░"


def frames(height: List[int], *, palette: Optional[Palette] = None) -> Iterator[str]:
    """Yield the step-by-step frames for one Container With Most Water call."""
    p = palette or Palette(enabled=True)
    values = [int(v) for v in height]
    n = len(values)

    if n < 2:
        yield _degenerate(values, p)
        return

    peak = max(values)
    scale = min(1.0, MAX_ROWS / peak) if peak > 0 else 1.0
    rows = max(1, _level(peak, scale))
    bars = [_level(value, scale) for value in values]

    lo, hi = 0, n - 1
    best = 0

    # 0. the widest container: the two ends.
    yield _frame(
        values, bars, rows, lo, hi, p,
        active=False, best=0,
        status="start with the widest container: lo = 0, hi = n - 1",
    )

    while lo < hi:
        width = hi - lo
        short = min(values[lo], values[hi])
        area = width * short
        updated = area > best
        if updated:
            best = area
        level = _level(short, scale)

        # 1. the candidate rectangle between the pointers.
        yield _frame(
            values, bars, rows, lo, hi, p,
            active=True, water_level=level, area=area,
            best=best, updated=updated,
            status=f"area = width × height = {width} × {short} = {area}",
        )

        # 2. always move the shorter wall inward.
        if values[lo] < values[hi]:
            move = "left"
            why = f"h[{lo}] = {values[lo]} < h[{hi}] = {values[hi]}"
        else:
            move = "right"
            why = f"h[{hi}] = {values[hi]} ≤ h[{lo}] = {values[lo]}"
        yield _frame(
            values, bars, rows, lo, hi, p,
            active=True, water_level=level, area=area,
            best=best, updated=False, moving=move,
            status=f"{why} → move the shorter wall inward",
        )

        if move == "left":
            lo += 1
        else:
            hi -= 1

    # 3. the pointers met: nothing wider is left.
    yield _frame(
        values, bars, rows, lo, hi, p,
        active=False, best=best,
        status="the pointers met — no container can be wider",
        result=f"return {best}",
    )


# -- frame rendering -------------------------------------------------------

def _frame(values, bars, rows, lo, hi, p, *, active, water_level=0, area=None,
           best=0, updated=False, moving=None, status="", result="") -> str:
    """Render one full frame; every frame has the same number of rows."""
    n = len(values)
    width = n * CW + (n - 1)          # visible width of one chart row
    lines: List[str] = []

    # the bar chart, tallest row first
    for y in range(rows, 0, -1):
        cells = []
        for i in range(n):
            if bars[i] >= y:
                role = "lo" if (active and i == lo) else \
                       "hi" if (active and i == hi) else "wall"
                cells.append(_tint(WALL * CW, role, p))
            elif active and lo <= i <= hi and y <= water_level:
                cells.append(_tint(WATER * CW, "water", p))
            else:
                cells.append(" " * CW)
        lines.append(MARGIN + " ".join(cells))

    # axis + index row
    lines.append(MARGIN + "─" * width)
    index_cells = [
        _tint(f"{i:^{CW}}",
              "lo" if (active and i == lo) else
              "hi" if (active and i == hi) else "dim", p)
        for i in range(n)
    ]
    lines.append(MARGIN + " ".join(index_cells))

    # pointer arrows
    lines.append(MARGIN + _arrows(n, lo, hi, active, moving, p))
    lines.append("")

    # pointer detail
    if active:
        lines.append(
            MARGIN + "lo = " + p.bold(p.yellow(str(lo)))
            + f" (h = {values[lo]})" + "        "
            + "hi = " + p.bold(p.cyan(str(hi))) + f" (h = {values[hi]})"
        )
    else:
        lines.append(MARGIN + p.dim("lo / hi    (the two walls)"))

    # width x height = area
    if area is not None:
        w = hi - lo
        short = min(values[lo], values[hi])
        shown = p.bold(p.green(str(area))) if updated else str(area)
        lines.append(MARGIN + f"width  = hi - lo = {hi} - {lo} = {w}")
        lines.append(MARGIN + f"height = min({values[lo]}, {values[hi]}) = {short}")
        lines.append(MARGIN + f"area   = {w} × {short} = {shown}")
    else:
        lines.append(MARGIN + p.dim("width  = …"))
        lines.append(MARGIN + p.dim("height = …"))
        lines.append(MARGIN + p.dim("area   = …"))

    # the running best
    if best:
        record = p.green("   ← new record") if updated else ""
        lines.append(MARGIN + "best   = " + p.bold(p.green(str(best))) + record)
    else:
        lines.append(MARGIN + p.dim("best   = 0"))

    lines.append("")
    if moving:
        lines.append(MARGIN + p.bold(p.yellow("move : ")) + status)
    else:
        lines.append(MARGIN + p.dim("step : ") + status)

    lines.append(MARGIN + p.bold(p.green(result)) if result else "")
    return "\n".join(lines) + "\n"


def _degenerate(values: List[int], p: Palette) -> str:
    """A single, meaningful frame for arrays that cannot hold water."""
    if not values:
        detail = "height is empty"
    else:
        detail = f"height = [{values[0]}] is a single line"
    lines = [
        MARGIN + p.bold(p.yellow("Container With Most Water")),
        "",
        MARGIN + p.dim(detail + " → no pair of walls → no container"),
        "",
        MARGIN + "best   = " + p.bold(p.green("0")),
        "",
        MARGIN + p.bold(p.green("return 0")),
        "",
    ]
    return "\n".join(lines) + "\n"


def _arrows(n, lo, hi, active, moving, p) -> str:
    """A row of ↑ markers under the two pointers; the mover flips colour."""
    width = n * CW + (n - 1)
    chars = [" "] * width
    roles: List[Optional[str]] = [None] * width
    if active and 0 <= lo < n:
        pos = lo * (CW + 1) + CW // 2
        chars[pos] = "→" if moving == "left" else "↑"
        roles[pos] = "move" if moving == "left" else "lo"
    if active and 0 <= hi < n:
        pos = hi * (CW + 1) + CW // 2
        chars[pos] = "←" if moving == "right" else "↑"
        roles[pos] = "move" if moving == "right" else "hi"
    return "".join(
        _tint(chars[i], roles[i], p) if chars[i] != " " else " "
        for i in range(width)
    )


def _level(value: int, scale: float) -> int:
    """Scale a wall height to a whole number of chart rows (1 when positive)."""
    if value <= 0:
        return 0
    return max(1, int(round(value * scale)))


def _tint(text: str, role: Optional[str], p: Palette) -> str:
    if role == "lo":
        return p.bold(p.yellow(text))
    if role == "hi":
        return p.bold(p.cyan(text))
    if role == "move":
        return p.bold(p.green(text))
    if role == "water":
        return p.dim(p.cyan(text))
    if role == "dim":
        return p.dim(text)
    return text
